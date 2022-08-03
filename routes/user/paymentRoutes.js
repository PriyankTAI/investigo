const router = require('express').Router();
const createError = require('http-errors');
const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_KEY_SECRET);

const checkUser = require('../../middleware/authMiddleware');

const Package = require('../../models/packageModel');
const Project = require('../../models/projectModel');
const Order = require('../../models/orderModel');

// get public key
router.get('/config', (req, res) => {
    res.json({ key: process.env.STRIPE_KEY_PUBLIC });
})

// create charge
router.post('/payment', checkUser, async (req, res, next) => {
    try {
        const token = req.body.token;
        console.log(`token: ${token}`);

        const [package, project] = await Promise.all([
            Package.findById(req.body.package),
            Project.findById(req.body.project),
        ])

        if (!package) return next(createError.BadRequest('Invalid package id.'));
        if (!project) return next(createError.BadRequest('Invalid project id.'));

        const total = package.price;
        await stripe.charges.create({
            amount: total,
            currency: 'usd',
            description: 'Example charge',
            source: token,
        });

        res.json({ status: 'success' })
    } catch (error) {
        if (error.name === 'CastError') {
            return next(createError.BadRequest('invalid id for package or project.'))
        }
        console.log(error);
        res.json({ status: 'fail', error: error.message })
    }
})

// create payment intent
router.post('/create-payment-intent', checkUser, async (req, res, next) => {
    try {
        console.log(req.body);
        console.log(`package: ${req.body.package}`);
        console.log(`project: ${req.body.project}`);
        const package = await Package.findById(req.body.package);
        if (!package) return next(createError.BadRequest('Invalid package id.'));
        const total = package.price;

        const paymentIntent = await stripe.paymentIntents.create({
            amount: total * 100,
            currency: 'INR',
            payment_method: 'pm_card_visa',
            payment_method_types: ['card'],
        });

        res.json({ client_secret: paymentIntent.client_secret })
    } catch (error) {
        console.log(error);
        if (error.name === 'CastError') {
            return next(createError.BadRequest('invalid id for package or project.'))
        }
        next(createError.InternalServerError())
    }
})

// place order after stripe
router.post('/order', checkUser, async (req, res, next) => {
    try {
        const paymentIntent = await stripe.paymentIntents.retrieve(req.body.intentId);
        if (paymentIntent.status != 'succeeded') {
            return res.send({
                status: 'fail',
                error: `Payment status: '${paymentIntent.status}'`
            })
        }
        const amount = paymentIntent.amount / 100;
        // const amount = 100;

        const [package, project] = await Promise.all([
            Package.findById(req.body.package),
            Project.findById(req.body.project),
        ])

        if (!package) return next(createError.BadRequest('Invalid package id.'));
        if (!project) return next(createError.BadRequest('Invalid project id.'));

        // create order
        const date = new Date(Date.now());
        date.setMonth(date.getMonth() + package.term);

        const order = await Order.create({
            user: req.user.id,
            package: req.body.package,
            project: req.body.project,
            endDate: date,
            amount
        })

        // change data of investors in project

        res.send({ status: `success`, order })
    } catch (error) {
        console.log(error);
        if (error.name === 'CastError') {
            return next(createError.BadRequest('invalid id for package or project.'))
        }
        if (error.type == 'StripeInvalidRequestError') {
            return next(createError.BadRequest(error.message))
        }
        next(error)
    }
})

module.exports = router;