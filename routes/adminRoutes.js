const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const checkAdmin = require('../middleware/authAdminMiddleware');

const Admin = require('../models/adminmodel');
const Message = require('../models/messageModel');

// GET admin dashboard
router.get('/', checkAdmin, (req, res) => {
    res.render("dashboard");
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
    res.render("change_pass");
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
        if (error) {
            console.log(error);
            res.status(400).send(error.message);
        }
    }
})

// GET logout
router.get("/logout", async (req, res) => {
    res.clearCookie("jwtAdmin");
    res.redirect('/admin/login');
})

// GET notification messages
router.get("/message", async (req, res) => {
    const message = await Message.find().sort({ _id: -1 }).limit(5)
    res.json(message)
})

module.exports = router;