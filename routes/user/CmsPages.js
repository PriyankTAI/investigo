const router = require('express').Router();
const multilingual = require('../../helpers/multilingual');

// models
const Contact = require('../../models/contactModel');
const Page = require('../../models/pageModel');
const Test = require('../../models/testModel');
const Message = require('../../models/messageModel');

// test
router.get("/test", async (req, res, next) => {
    try {
        // One
        // const test = await Test.findOne({});
        // const newTest = multilingual(test, req);
        // res.json({
        //     status: "success",
        //     test: newTest
        // });

        // Many
        const tests = await Test.find({});
        const newTests = tests.map(el => multilingual(el, req));
        res.json({
            status: "success",
            tests: newTests
        });
    } catch (error) {
        console.log(error);
        next(error);
    }
});

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