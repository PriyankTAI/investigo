const router = require('express').Router();
const createError = require('http-errors');
const fs = require('fs-extra');
const sharp = require('sharp');
const multilingual = require('../../helpers/multilingual');

const checkUser = require('../../middleware/authMiddleware');

const User = require('../../models/userModel');
const Order = require('../../models/orderModel');
const Withdraw = require('../../models/withdrawModel');
const PaymentMethod = require('../../models/paymentMethodModel');

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
            .populate('project', 'en.title image')
            .populate('package', 'monthlyReturn dailyReturn annualReturn')
            .select('paymentType orderDate amount endDate withdrawn');

        orders = orders.map(el => {
            el = el.toObject();
            el.project.title = el.project.en.title;
            el.project.en = undefined;
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

// GET all invesments
router.get('/investment', checkUser, async (req, res, next) => {
    try {
        const orders = await Order.find({ user: req.user.id })
            .populate('project', 'title image')
            .populate('package', 'title monthlyReturn')
            .select('paymentType orderDate amount endDate');
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
        const orders = await Order.find({ user: req.user.id })
            .populate('project', 'title image')
            .select('paymentType orderDate');
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
        const order = await Order.findById(req.body.order).populate('package');
        if (!order)
            return next(createError.BadRequest('Invalid order id.'));

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

module.exports = router;