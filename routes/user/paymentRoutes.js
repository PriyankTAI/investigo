const router = require("express").Router();
const createError = require("http-errors");
const axios = require("axios");
const stripe = require("stripe")(process.env.STRIPE_KEY_SECRET);

const checkUser = require("../../middleware/authMiddleware");

const Package = require("../../models/packageModel");
const Project = require("../../models/projectModel");
const Order = require("../../models/orderModel");

// revolut create order
router.post("/create-order", checkUser, async (req, res, next) => {
    try {
        const package = await Package.findById(req.body.package);
        if (!package)
            return next(createError.BadRequest("Invalid package id."));
        const amount = package.price;

        const response = await axios.post(
            process.env.REVOLUT_URL,
            {
                amount: amount,
                currency: "GBP",
                email: req.user.email,
            },
            {
                headers: {
                    Authorization: `Bearer ${process.env.REVOLUT_KEY_SECRET}`,
                },
            },
        );

        res.json({
            status: "success",
            public_id: response.data.public_id,
            orderId: response.data.id,
        });
    } catch (error) {
        console.log(error.message);
        next(error);
    }
});

// revolut place order
router.post("/place-order", checkUser, async (req, res, next) => {
    try {
        // retrive order
        const response = await axios.get(
            `${process.env.REVOLUT_URL}/${req.body.orderId}`,
            {
                headers: {
                    Authorization: `Bearer ${process.env.REVOLUT_KEY_SECRET}`,
                },
            }
        );

        if (response.data.state !== "COMPLETED")
            return res.send({
                status: "fail",
                message: `Payment state: '${response.data.state}'`,
            });

        const [package, project] = await Promise.all([
            Package.findById(req.body.package),
            Project.findById(req.body.project),
        ]);

        if (!package)
            return next(createError.BadRequest("Invalid package id."));
        if (!project)
            return next(createError.BadRequest("Invalid project id."));
        if (response.data.order_amount.value != package.price)
            return next(
                createError.BadRequest(
                    "Price paid and package price do not match!"
                )
            );
        if ((project.totalAmount - project.invested) < package.price)
            return next(createError.BadRequest("Project limit is reached."));

        // create order
        const date = new Date(Date.now());
        date.setMonth(date.getMonth() + package.term);

        const returnAmount =
            ((1 + (package.annualReturn / 100)) * package.price).toFixed(2);

        const order = await Order.create({
            user: req.user.id,
            package: req.body.package,
            project: req.body.project,
            orderId: req.body.orderId,
            endDate: date,
            paymentType: "card",
            amount: package.price,
            returnAmount,
        });

        // update investors and invested in project
        project.investors = project.investors + 1;
        project.invested = project.invested + package.price;
        await project.save();

        res.send({ status: "success", order });
    } catch (error) {
        if (error.code === 11000)
            return next(
                createError.BadRequest(
                    "Order already created with this orderId."
                )
            );
        if (error.name === "CastError")
            return next(
                createError.BadRequest("Invalid id for package or project.")
            );
        console.log(error);
        next(error);
    }
});

// get public key
router.get('/config', (req, res) => {
    res.json({ key: process.env.STRIPE_KEY_PUBLIC });
})

// create checkout session // not using
router.post('/create-checkout-session', checkUser, async (req, res, next) => {
    try {
        const package = await Package.findById(req.body.package);
        if (!package) return next(createError.BadRequest('Invalid package id.'));

        const session = await stripe.checkout.sessions.create({
            mode: "payment",
            line_items: [{
                price_data: {
                    currency: 'EUR',
                    product_data: {
                        name: package.en.title,
                        images: [process.env.BASE_URL + package.image]
                    },
                    unit_amount: package.price * 100,
                },
                quantity: 1
            }],
            success_url: 'http://localhost:4000/success',
            cancel_url: 'http://localhost:4000/cancel',
        })

        res.json({ url: session.url })
    } catch (error) {
        console.log(error)
        next(error)
    }
})

// create payment intent
router.post('/create-payment-intent', checkUser, async (req, res, next) => {
    try {
        const package = await Package.findById(req.body.package);
        if (!package) return next(createError.BadRequest('Invalid package id.'));
        const total = package.price;

        const customer = await stripe.customers.create({
            email: req.user.email,
            // address: {
            //     line1: '510 Townsend St',
            //     postal_code: '98140',
            //     city: 'San Francisco',
            //     state: 'CA',
            //     country: 'US',
            // },
        });

        const paymentIntent = await stripe.paymentIntents.create({
            amount: total * 100,
            currency: process.env.CURRENCY,
            customer: customer.id,
            receipt_email: req.user.email,
            // payment_method: 'pm_card_visa',
            // payment_method_types: ['card'],
        });

        res.json({ status: `success`, client_secret: paymentIntent.client_secret })
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

        const [package, project] = await Promise.all([
            Package.findById(req.body.package),
            Project.findById(req.body.project),
        ])

        if (!package) return next(createError.BadRequest('Invalid package id.'));
        if (!project) return next(createError.BadRequest('Invalid project id.'));
        if (amount != package.price) return next(createError.BadRequest('Price paid and package price do not match!'));

        // create order
        const date = new Date(Date.now());
        date.setMonth(date.getMonth() + package.term);

        // console.log(paymentIntent.charges.data[0].payment_method_details.card?.brand);
        const paymentType = paymentIntent.charges.data[0].payment_method_details.card?.brand || 'Card';
        const order = await Order.create({
            user: req.user.id,
            package: req.body.package,
            project: req.body.project,
            intentId: req.body.intentId,
            endDate: date,
            paymentType,
            amount
        })

        // update investors and invested in project
        project.investors = project.investors + 1;
        project.invested = project.invested + package.price;
        await project.save();

        res.send({ status: `success`, order })
    } catch (error) {
        if (error.code === 11000) {
            return next(createError.BadRequest('Order already created with this paymentIntentId'))
        }
        if (error.name === 'CastError') {
            return next(createError.BadRequest('invalid id for package or project.'))
        }
        if (error.type == 'StripeInvalidRequestError') {
            return next(createError.BadRequest(error.message))
        }
        console.log(error);
        next(error)
    }
})

module.exports = router;