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
router.post('/stripe/create', checkUser, async (req, res) => {
    try {
        const paymentIntent = await stripe.paymentIntents.retrieve(req.body.intentId);
        if (paymentIntent.status != 'succeeded') {
            return res.send({ error: `Payment status: '${paymentIntent.status}'` })
        }
        // create order
        res.send({ status: `success` })
    } catch (error) {
        console.log(error);
        next(createError.InternalServerError())
    }
})

module.exports = router;