const router = require('express').Router();
const multilingual = require('../../helpers/multilingual');

// models
const Contact = require('../../models/contactModel');
const Page = require('../../models/pageModel');
const Message = require('../../models/messageModel');

// about us
router.get("/about_us", async (req, res, next) => {
    try {
        let page = await Page.findOne({ title: 'About Us' });
        page = multilingual(page, req);
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
        let page = await Page.findOne({ title: 'FAQs' });
        page = multilingual(page, req);
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
        let page = await Page.findOne({ title: 'Terms & Condition' });
        page = multilingual(page, req);
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
        let page = await Page.findOne({ title: 'Privacy Policy' });
        page = multilingual(page, req);
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
        let page = await Page.findOne({ title: 'Contact' });
        page = multilingual(page, req);
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
        const message = await Message.create(req.body);

        io.emit('msg', message);
        res.status(201).json({
            status: "success",
            message: "Message sent successfully",
        });
    } catch (error) {
        next(error);
    }
})

module.exports = router;