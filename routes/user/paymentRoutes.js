const router = require('express').Router();
const createError = require('http-errors');
const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_KEY_SECRET);

const checkUser = require('../../middleware/authMiddleware');

const Package = require('../../models/packageModel')
const Project = require('../../models/projectModel')

// get public key
router.get('/config', (req, res) => {
    res.json({ key: process.env.STRIPE_KEY_PUBLIC });
})

// create payment intent
router.post('/payment', checkUser, async (req, res, next) => {
    try {
        const token = req.body.token;
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
        const [package, project] = await Promise.all([
            Package.findById(req.body.package),
            Project.findById(req.body.project),
        ])

        if (!package) return next(createError.BadRequest('Invalid package id.'));
        if (!project) return next(createError.BadRequest('Invalid project id.'));

        const total = package.price;
        const paymentIntent = await stripe.paymentIntents.create({
            amount: total * 100,
            currency: 'EUR',
            payment_method: 'pm_card_visa',
            payment_method_types: ['card'],
            // description: `User: ${req.user.id}`
        });
        // console.log(paymentIntent);
        res.json({ client_secret: paymentIntent.client_secret })
    } catch (error) {
        if (error.name === 'CastError') {
            return next(createError.BadRequest('invalid id for package or project.'))
        }
        console.log(error);
        next(createError.InternalServerError())
        // res.status(500).json({ error: error.message })
    }
})

// place order after stripe
router.post('/order', checkUser, async (req, res, next) => {
    try {
        // const paymentIntent = await stripe.paymentIntents.retrieve(req.body.intentId);
        // if (paymentIntent.status != 'succeeded') {
        //     return res.send({
        //         status: 'fail',
        //         error: `Payment status: '${paymentIntent.status}'`
        //     })
        // }
        // const amount = paymentIntent.amount/100;
        const amount = 100;

        // create order
        const order = await Order.create({
            user: req.user.id,
            package: req.body.package,
            project: req.body.project,
            amount
        })

        res.send({ status: `success`, order })
    } catch (error) {
        console.log(error);
        if (error.type == 'StripeInvalidRequestError') {
            return next(createError.BadRequest(error.message))
        }
        next(error)
    }
})

module.exports = router;