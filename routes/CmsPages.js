const express = require('express');
const router = express.Router();

const checkUser = require('../middleware/authMiddleware');

const Contact = require('../models/contact');
const Page = require('../models/pageModel');
const Message = require('../models/messageModel');
const Package = require('../models/package')

// about us
router.get("/about_us", async (req, res, next) => {
    try {
        const page = await Page.findOne({ title: 'About Us' })
        const content = page.content;
        res.status(201).json({
            status: "success",
            content
        });
    } catch (error) {
        console.log(error);
        next(error);
    }
});

// faqs
router.get("/faqs", async (req, res, next) => {
    try {
        const page = await Page.findOne({ title: 'FAQs' })
        const content = page.content;
        res.status(201).json({
            status: "success",
            content
        });
    } catch (error) {
        console.log(error);
        next(error);
    }
});

// terms
router.get("/terms_con", async (req, res, next) => {
    try {
        const page = await Page.findOne({ title: 'Terms & Condition' })
        const content = page.content;
        res.status(201).json({
            status: "success",
            content
        });
    } catch (error) {
        console.log(error);
        next(error);
    }
});

// privacy
router.get("/privacy_policy", async (req, res, next) => {
    try {
        const page = await Page.findOne({ title: 'Privacy Policy' })
        const content = page.content;
        res.status(201).json({
            status: "success",
            content
        });
    } catch (error) {
        console.log(error);
        next(error);
    }
});

// contact
router.get("/contact", async (req, res, next) => {
    try {
        const page = await Page.findOne({ title: 'Contact' })
        const content = page.content;
        const contact = await Contact.findOne();
        res.status(201).json({
            status: "success",
            content,
            contact
        });
    } catch (error) {
        console.log(error);
        next(error);
    }
});

// POST message
router.post("/contact", async (req, res, next) => {
    try {
        const message = new Message({
            name: req.body.name,
            email: req.body.email,
            address: req.body.address,
            phone: req.body.phone,
            message: req.body.message
        })
        await message.save();
        res.status(201).json({
            status: "success",
            message: "Message sent successfully",
        });
    } catch (error) {
        next(error);
        console.log(error);
    }
})

// get all packages
router.get("/package", checkUser, async (req, res, next) => {
    try {
        const packages = await Package.find();
        res.status(201).json({
            status: "success",
            total: packages.length,
            packages
        });
    } catch (error) {
        console.log(error);
        next(error);
    }
});

module.exports = router;