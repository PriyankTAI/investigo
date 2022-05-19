const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');

const checkUser = require('../middleware/authMiddleware');

const Contact = require('../models/contact');
const Page = require('../models/pageModel');
const Message = require('../models/messageModel');

// about us
router.get("/about_us", checkUser, async (req, res) => {
    try {
        const page = await Page.findOne({ title: 'About Us' })
        const content = page.content;
        res.status(201).json({
            status:"success",
            content
        });
    } catch (error) {
        console.log(error);
        res.status(500).send("An error occured")
    }
});

// faqs
router.get("/faqs", checkUser, async (req, res) => {
    try {
        const page = await Page.findOne({ title: 'FAQs' })
        const content = page.content;
        res.status(201).json({
            status:"success",
            content
        });
    } catch (error) {
        console.log(error);
        res.status(500).send("An error occured")
    }
});

// terms
router.get("/terms_con", checkUser,  async (req, res) => {
    try {
        const page = await Page.findOne({ title: 'Terms & Condition' })
        const content = page.content;
        res.status(201).json({
            status:"success",
            content
        });
    } catch (error) {
        console.log(error);
        res.status(500).send("An error occured")
    }
});

// privacy
router.get("/privacy_policy", checkUser, async (req, res) => {
    try {
        const page = await Page.findOne({ title: 'Privacy Policy' })
        const content = page.content;
        res.status(201).json({
            status:"success",
            content
        });
    } catch (error) {
        console.log(error);
        res.status(500).send("An error occured")
    }
});

// contact
router.get("/contact", checkUser, async (req, res) => {
    try {
        const page = await Page.findOne({ title: 'Contact' })
        const content = page.content;
        const contact = await Contact.findOne();
        res.status(201).json({
            status:"success",
            content,
            contact
        });
    } catch (error) {
        console.log(error);
        next(error);
    }
});

// POST message
router.post("/contact", [
    check('name', 'Please enter your name.').notEmpty(),
    check('email', 'Please enter valid email.').isEmail(),
    check('address', 'Please enter address.').notEmpty(),
    check('phone', 'Please enter phone number.').notEmpty(),
    check('message', 'Please enter a message.').notEmpty(),
], checkUser,async (req, res) => {
    try {
        const validationErrors = validationResult(req)
        if (validationErrors.errors.length > 0) {
            const alert = validationErrors.array()
            return next(createError.BadRequest(`An error occured`));
        }
        const message = new Message({
            name: req.body.name,
            email: req.body.email,
            address: req.body.address,
            phone: req.body.phone,
            message: req.body.message
        })
        await message.save();
        res.status(201).json({
            status:"success",
            message: "Message sent succesfully",
        });
    } catch (error) {
        console.log(error);
        next(error);
    }
})

module.exports = router;