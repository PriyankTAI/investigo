const router = require('express').Router();
const createError = require('http-errors');
const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_KEY_SECRET);

const checkUser = require('../../middleware/authMiddleware');

// get public key
router.get('/config', (req, res) => {
    res.json({ key: process.env.STRIPE_KEY_PUBLIC });
})

// create payment intent
router.post('/create-payment-intent', checkUser, async (req, res) => {
    try {
        const total = 0; // calculate total
        const paymentIntent = await stripe.paymentIntents.create({
            amount: total * 100,
            currency: 'inr', // change currency
            payment_method: 'pm_card_visa',
            payment_method_types: ['card'],
        });
        console.log(paymentIntent);
        res.json({ client_secret: paymentIntent.client_secret })
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ error: error.message })
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