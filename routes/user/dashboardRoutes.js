const router = require('express').Router();
const createError = require('http-errors');
const fs = require('fs-extra');
const sharp = require('sharp');
const multilingual = require('../../helpers/multilingual');
const { sendSms } = require('../../helpers/sendSms');

const checkUser = require('../../middleware/authMiddleware');

const User = require('../../models/userModel');
const Order = require('../../models/orderModel');
const Withdraw = require('../../models/withdrawModel');
const PaymentMethod = require('../../models/paymentMethodModel');
const Otp = require('../../models/otpModel');

const multer = require('multer');
const storage = multer.memoryStorage();
const fileFilter = (req, file, cb) => {
    // reject a file
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
        cb(null, true);
    } else {
        cb(createError.BadRequest('validation.imageFile'), false);
    }
};
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 1024 * 1024 * 10
    },
    fileFilter: fileFilter
});

const generateCode = length => {
    var digits = '0123456789';
    let generated = '';
    for (let i = 0; i < length; i++) {
        generated += digits[Math.floor(Math.random() * 10)];
    }
    return generated;
}

// GET profile
router.get('/profile', checkUser, async (req, res, next) => {
    try {
        // hide details
        req.user.password = undefined;
        req.user.blocked = undefined;
        req.user.secret = undefined;
        res.json({
            status: "success",
            user: req.user
        });
    } catch (error) {
        console.log(error.message);
        next(error);
    }
})

// POST profile
router.post('/profile', checkUser, upload.single('image'), async (req, res, next) => {
    try {
        if (typeof req.file !== 'undefined') {
            oldImage = "public" + req.user.image;

            let extArray = req.file.mimetype.split("/");
            let extension = extArray[extArray.length - 1];
            const filename = req.user.id + '.' + extension;
            req.body.image = '/uploads/users/' + filename;
            if (!fs.existsSync('./public/uploads/users')) {
                fs.mkdirSync('./public/uploads/users', { recursive: true });
            }
            fs.remove(oldImage, function (err) {
                if (err) { console.log(err); }
            })
            await sharp(req.file.buffer)
                .resize({ width: 400, height: 400 })
                .toFile('./public/uploads/users/' + filename);
        }

        // not allowed to change
        req.body.userId = undefined;
        req.body.blocked = undefined;
        req.body.secret = undefined;
        req.body.twofa = undefined;
        req.body.password = undefined;

        const user = await User.findOneAndUpdate(
            { _id: req.user.id },
            req.body,
            { new: true, runValidators: true }
        ).select('-__v -password -secret -blocked');

        res.json({
            status: "success",
            user
        });
    } catch (error) {
        if (error.code == '11000' && Object.keys(error.keyValue) == 'national') {
            return next(createError.BadRequest('error.nationalReg'));
        }
        if (error.code == '11000' && Object.keys(error.keyValue) == 'email') {
            return next(createError.BadRequest('error.emailReg'));
        }
        console.log(error.message);
        next(error);
    }
});

// GET payment methods
router.get('/paymentMethod', checkUser, async (req, res, next) => {
    try {
        const paymentMethods = await PaymentMethod.find({ user: req.user.id });

        res.json({
            status: "success",
            paymentMethods
        });
    } catch (error) {
        console.log(error.message);
        next(error);
    }
});

// POST add payment method
router.post('/paymentMethod', checkUser, async (req, res, next) => {
    try {
        await PaymentMethod.create({
            user: req.user.id,
            card: req.body.card,
            network: req.body.network,
            expiry: req.body.expiry
        });

        // find and update user?

        res.json({
            status: "success",
            message: req.t('payment')
        });
    } catch (error) {
        // console.log(error.message);
        next(error);
    }
});

// GET all orders
router.get('/order', checkUser, async (req, res, next) => {
    try {
        let orders = await Order.find({ user: req.user.id })
            .populate('project', 'en.title fr.title image')
            .populate('package', 'en.title fr.title monthlyReturn dailyReturn annualReturn')
            .select('paymentType orderDate amount endDate withdrawn');

        orders = orders.map(el => {
            el = el.toObject();
            el.project = multilingual(el.project, req);
            el.package = multilingual(el.package, req);
            return el;
        });

        res.json({
            status: "success",
            total: orders.length,
            orders
        });
    } catch (error) {
        console.log(error.message);
        next(error);
    }
});

// GET completed-orders
router.get('/completed-orders', checkUser, async (req, res, next) => {
    try {
        let date = new Date();
        date.setDate(date.getDate() + 1);

        let orders = await Order.find({
            user: req.user.id,
            endDate: {
                $lte: new Date(date).toDateString()
            }
        }).populate('withdraw', 'status');

        res.json({
            status: "success",
            orders
        });
    } catch (error) {
        console.log(error);
        next(error);
    }
});

// GET all invesments
router.get('/investment', checkUser, async (req, res, next) => {
    try {
        let orders = await Order.find({ user: req.user.id })
            .populate('project', 'en.title fr.title image')
            .populate('package', 'en.title fr.title monthlyReturn')
            .select('paymentType orderDate amount endDate');

        orders = orders.map(el => {
            el = el.toObject();
            el.project = multilingual(el.project, req);
            el.package = multilingual(el.package, req);
            return el;
        });

        res.json({
            status: "success",
            total: orders.length,
            orders
        });
    } catch (error) {
        console.log(error.message);
        next(error);
    }
})

// GET all transactions
router.get('/transaction', checkUser, async (req, res, next) => {
    try {
        let orders = await Order.find({ user: req.user.id })
            .populate('project', 'en.title fr.title image')
            .select('paymentType orderDate');

        orders = orders.map(el => {
            el = el.toObject();
            el.project = multilingual(el.project, req);
            return el;
        });

        res.json({
            status: "success",
            total: orders.length,
            orders
        });
    } catch (error) {
        console.log(error.message);
        next(error);
    }
});

// get all withdraw
router.get('/withdraw', checkUser, async (req, res, next) => {
    try {
        const withdraws = await Withdraw.find({ user: req.user.id })
            .sort({ _id: -1 });
        res.json({
            status: "success",
            withdraws
        });
    } catch (error) {
        console.log(error);
        next(error);
    }
});

// withdraw request
router.post('/withdraw', checkUser, async (req, res, next) => {
    try {
        const [order, paymentMethod] = await Promise.all([
            Order.findById(req.body.order).populate('package'),
            PaymentMethod.findOne({ _id: req.body.paymentMethod, user: req.user.id }),
        ]);

        if (!order)
            return next(createError.BadRequest('Invalid order id.'));
        if (!paymentMethod)
            return next(createError.BadRequest('Invalid paymentMethod id.'));

        // check date
        if (Date.now() < Date.parse(order.endDate.toJSON().substring(0, 10)))
            return next(createError.BadRequest('notYet'));

        // calculate amount
        const amount = Math.round(
            (1 + (order.package.annualReturn / 100)) * order.amount
        );

        let withdraw = await Withdraw.create({
            user: req.user.id,
            order: req.body.order,
            paymentMethod: req.body.paymentMethod,
            amount
        });
        withdraw = await withdraw.populate('user');

        // notify with socket.io
        io.emit('withdraw', withdraw);

        // set order to withdrawn
        order.withdrawn = true;
        // set withdraw id
        order.withdraw = withdraw.id;
        await order.save();

        res.status(201).json({
            status: "success",
            message: req.t('withdraw')
        });
    } catch (error) {
        if (error.code === 11000)
            return next(createError.BadRequest('error.withdrawOrder'));
        console.log(error);
        next(error);
    }
});

// POST get-verify-otp phone
router.post('/get-verify-otp', checkUser, async (req, res, next) => {
    try {
        // check if already verified
        if (req.user.phoneVerified)
            return next(createError.Conflict('Phone already verified.'));

        let otp = await Otp.findOne({ userId: req.user._id });
        if (!otp) {
            const generated = generateCode(6);
            otp = await Otp.create({
                userId: req.user.id,
                otp: generated
            });
        }

        await sendSms(req.body.phone, otp.otp);

        return res.status(200).json({
            status: "success",
            otp: otp.otp
        });
    } catch (error) {
        if (error.code == 21408)
            return next(createError.BadRequest('Invalid phone number.'));
        console.log(error);
        next(error);
    }
});

// POST verify-phone
router.post('/verify-phone', checkUser, async (req, res, next) => {
    try {
        // check if already verified
        if (req.user.phoneVerified)
            return next(createError.Conflict('Phone already verified.'));

        // verify otp
        const otp = await Otp.findOne({ userId: req.user._id });
        if (!otp || otp.otp !== req.body.otp)
            return next(createError.BadRequest('Failed to verify otp.'));

        // update user
        req.user.phoneVerified = true;
        req.user.save();

        return res.status(200).json({
            status: "success",
            message: "Phone number verified succefully."
        });
    } catch (error) {
        console.log(error);
        next(error);
    }
});

module.exports = router;