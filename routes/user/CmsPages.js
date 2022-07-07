const express = require('express');
const router = express.Router();

// models
const Contact = require('../../models/contactModel');
const Page = require('../../models/pageModel');
const Message = require('../../models/messageModel');

// about us
router.get("/about_us", async (req, res, next) => {
    try {
        const page = await Page.findOne({ title: 'About Us' })
        const content = page.content;
        res.json({
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
        res.json({
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
        res.json({
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
        res.json({
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
        res.json({
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
        // console.log(req.io);
        const message = new Message({
            fname: req.body.fname,
            lname: req.body.lname,
            email: req.body.email,
            phone: req.body.phone,
            subject: req.body.subject,
            message: req.body.message
        })
        await message.save();
        req.io.emit('msg', message);
        res.status(201).json({
            status: "success",
            message: "Message sent successfully",
        });
    } catch (error) {
        // console.log(error.message);
        next(error);
    }
})

module.exports = router;