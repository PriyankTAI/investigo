const router = require('express').Router();
const { check, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sharp = require('sharp');
const fs = require('fs-extra');
const isToday = require('../../helpers/isToday');

const checkAdmin = require('../../middleware/authAdminMiddleware');

const Admin = require('../../models/adminModel');
const User = require('../../models/userModel');
const Order = require('../../models/orderModel');
// const Message = require('../../models/messageModel');
const Withdraw = require('../../models/withdrawModel');

const multer = require('multer');
const storage = multer.memoryStorage();
const fileFilter = (req, file, cb) => {
    // reject a file
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
        cb(null, true);
    } else {
        cb(createError.BadRequest('Wrong file type! (Please upload only jpg or png.)'), false);
    }
};
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 1024 * 1024 * 10
    },
    fileFilter: fileFilter
});

// GET admin dashboard
router.get('/', checkAdmin, async (req, res) => {
    try {
        const [users, orders] = await Promise.all([
            User.find().select('date'),
            Order.find().populate('package'),
        ])

        var newUsers = 0;
        for (let i = 0; i < users.length; i++) {
            if (isToday(users[i].date)) {
                newUsers++;
            }
        }

        var newOrders = 0;
        for (let i = 0; i < orders.length; i++) {
            if (isToday(orders[i].orderDate)) {
                newOrders++;
            }
        }

        // investments
        var allInvestment = 0;
        var newInvestment = 0;
        for (let i = 0; i < orders.length; i++) {
            allInvestment += orders[i].amount;
            if (isToday(orders[i].orderDate)) {
                newInvestment += orders[i].amount;
            }
        }

        // interests
        var allInterest = 0;
        var newInterest = 0;
        var second = Date.now();
        for (let i = 0; i < orders.length; i++) {
            if (orders[i].withdrawn) {
                // calculate yearly interest
                var value = (orders[i].package.annualReturn / 100) * orders[i].amount;
            } else {
                // calculate daily interest * days
                var first = Date.parse(orders[i].orderDate.toJSON().substring(0, 10));
                var days = Math.round((second - first) / (1000 * 60 * 60 * 24));
                var value = (orders[i].package.dailyReturn * days / 100) * orders[i].amount;
                // today's interest
                newInterest += (orders[i].package.dailyReturn / 100) * orders[i].amount;
            }
            allInterest += value;
        }

        res.render("dashboard", {
            image: req.admin.image,
            users: users.length,
            newUsers,
            orders: orders.length,
            newOrders,
            allInvestment,
            newInvestment,
            allInterest: Math.round(allInterest),
            newInterest: Math.round(newInterest),
        });
    } catch (error) {
        console.log(error);
        res.send(error.message);
    }
});

// GET admin login
router.get('/login', (req, res) => {
    if (req.session.checkAdminSuccess) {
        req.session.checkAdminSuccess = undefined;
        return res.render('login')
    }
    const token = req.cookies['jwtAdmin'];
    if (token) {
        jwt.verify(token, process.env.SECRET_KEY, function (err, decodedToken) {
            if (err) {
                console.log("ERROR: " + err.message);
                return res.render('login')
            } else {
                Admin.findById(decodedToken._id, function (err, user) {
                    if (err) {
                        console.log("ERROR: " + err.message)
                        return res.render('login')
                    }
                    if (!user) {
                        return res.render('login')
                    }
                    return res.redirect('/admin');
                });
            }
        });
    } else {
        return res.render('login')
    }
})

// POST login
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        const adminExist = await Admin.findOne({ email });
        if (!adminExist) {
            req.flash('red', 'Invalid email or password!');
            return res.redirect('/admin/login');
        }
        const isMatch = await bcrypt.compare(password, adminExist.password);
        if (!isMatch) {
            req.flash('red', 'Invalid email or password!');
            return res.redirect('/admin/login');
        }
        const token = await adminExist.generateAuthToken();
        res.cookie("jwtAdmin", token, {
            expires: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
            httpOnly: true,
        });
        res.redirect('/admin');
    } catch (error) {
        console.log(error);
        res.status(400).send(error.message);
    }
})

// Get Change pass
router.get('/changepass', checkAdmin, (req, res) => {
    res.render("change_pass", { image: req.admin.image });
});

// Change pass
router.post("/changepass", checkAdmin, async (req, res) => {
    try {
        const { currentpass, newpass, cfnewpass } = req.body;
        if (!currentpass || currentpass.length < 6) {
            req.flash('red', 'Invalid current password.');
            return res.redirect('/admin/changepass');
        }
        if (!newpass || newpass.length < 6) {
            req.flash('red', 'Invalid new password.');
            return res.redirect('/admin/changepass');
        }
        if (!cfnewpass || cfnewpass.length < 6) {
            req.flash('red', 'Invalid confirm new password.');
            return res.redirect('/admin/changepass');
        }
        const isMatch = await bcrypt.compare(currentpass, req.admin.password);
        if (!isMatch) {
            req.flash('red', 'Wrong current password.');
            return res.redirect('/admin/changepass');
        }
        if (currentpass == newpass) {
            req.flash('red', 'New password can not be same as current password.');
            return res.redirect('/admin/changepass');
        }
        if (newpass != cfnewpass) {
            req.flash('red', 'Password and confirm password does not match!');
            return res.redirect('/admin/changepass');
        }
        const admin = await Admin.findOne();
        admin.password = newpass;
        await admin.save();
        req.flash('green', 'Password updated.');
        return res.redirect('/admin/changepass');
    } catch (error) {
        console.log(error);
        res.status(400).send(error.message);
    }
})

// GET logout
router.get("/logout", async (req, res) => {
    res.clearCookie("jwtAdmin");
    res.redirect('/admin/login');
})

// GET profile
router.get('/profile', checkAdmin, async (req, res) => {
    try {
        const admin = await Admin.findById(req.admin.id)
        res.render('admin_profile', {
            admin,
            image: req.admin.image
        })
    } catch (error) {
        console.log(error.message);
        req.flash('red', error.message);
        res.redirect('/admin');
    }
})

// Post profile
router.post('/profile', checkAdmin, upload.single('image'), [
    check('name', 'name must have a value').notEmpty(),
], async (req, res) => {
    try {
        const validationErrors = validationResult(req)
        if (validationErrors.errors.length > 0) {
            req.flash('red', validationErrors.errors[0].msg)
            return res.redirect(req.originalUrl);
        }

        if (typeof req.file !== 'undefined') {
            oldImage = `public${req.admin.image}`;

            let extArray = req.file.mimetype.split("/");
            let extension = extArray[extArray.length - 1];
            const filename = req.admin.id + '.' + extension;
            req.body.image = `/uploads/admin/${filename}`;
            if (!fs.existsSync('./public/uploads/admin')) {
                fs.mkdirSync('./public/uploads/admin', { recursive: true });
            }
            fs.remove(oldImage, function (err) {
                if (err) { console.log(err); }
            })
            await sharp(req.file.buffer)
                .resize({ width: 500, height: 500 })
                .toFile('./public/uploads/admin/' + filename);
        }

        await Admin.findOneAndUpdate({ _id: req.admin.id }, req.body, { new: true, runValidators: true });
        req.flash('green', 'Profile updated successfully.');
        res.redirect(req.originalUrl);
    } catch (error) {
        console.log(error.message);
        req.flash('red', error.message);
        res.redirect(req.originalUrl);
    }
})

// GET all admin
router.get('/admin', checkAdmin, async (req, res) => {
    try {
        const admins = await Admin.find();
        res.render('admin', {
            admins,
            image: req.admin.image
        })
    } catch (error) {
        console.log(error.message);
        req.flash('red', error.message);
        res.redirect('/admin');
    }
})

// GET add admin
router.get('/admin/add', checkAdmin, async (req, res) => {
    res.render('add_admin', { image: req.admin.image });
})

// POST add admin
router.post('/admin/add', checkAdmin, async (req, res) => {
    try {
        const validationErrors = validationResult(req)
        if (validationErrors.errors.length > 0) {
            req.flash('red', validationErrors.errors[0].msg)
            return res.redirect(req.originalUrl);
        }
        const admin = new Admin({
            email: req.body.email,
            password: req.body.pass
        })
        await admin.save();
        req.flash('green', `Admin added successfully`);
        res.redirect('/admin/admin');
    } catch (error) {
        if (error.code == 11000) {
            req.flash('red', `Admin already exist with '${req.body.email}'.`);
            res.redirect(req.originalUrl);
        } else {
            console.log(error);
            res.send(error.message);
        }
    }
})

// GET admin by id
router.get('/admin/:id', checkAdmin, async (req, res) => {
    try {
        const admin = await Admin.findById(req.params.id);
        if (admin == null) {
            req.flash('red', `Admin not found!`);
            return res.redirect('/admin/admin');
        }
        res.render('admin_view', {
            admin,
            image: req.admin.image
        })
    } catch (error) {
        if (error.name === 'CastError') {
            req.flash('red', `Admin not found!`);
        } else {
            console.log(error);
            req.flash('red', error.message);
        }
        res.redirect('/admin/admin');
    }
})

// get notifications
router.get('/notification', async (req, res, next) => {
    try {
        const withdraws = await Withdraw.find().sort('-_id').limit(5).populate('user');
        res.json({ withdraws });
    } catch (error) {
        console.log(error);
        next(error);
    }
});

module.exports = router;