const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');

const Page = require('../../models/pageModel');
const Contact = require('../../models/contactModel');

const checkAdmin = require('../../middleware/authAdminMiddleware');

// about us
router.get("/about_us", checkAdmin, async (req, res) => {
    try {
        const page = await Page.findOne({ title: 'About Us' })
        const content = page.content;
        res.status(201).render("about", {
            content
        });
    } catch (error) {
        console.log(error);
        res.status(500).send("An error occured")
    }
});

router.post('/about_us', checkAdmin, [
    check('content', 'Content must have a value').notEmpty(),
], async function (req, res) {
    const validationErrors = validationResult(req)
    if (validationErrors.errors.length > 0) {
        req.flash('red', 'Content must have a value.')
        return res.redirect('/admin/about_us')
    }
    try {
        const page = await Page.findOne({ title: 'About Us' })
        page.content = req.body.content;
        await page.save()
        req.flash('green', 'About us updated successfully.')
        res.redirect('/admin/about_us')
    } catch (error) {
        console.log(error);
        res.status(500).send("An error occured")
    }
});

// faqs
router.get("/faqs", checkAdmin, async (req, res) => {
    try {
        const page = await Page.findOne({ title: 'FAQs' })
        const content = page.content;
        res.status(201).render("faqs", {
            title: 'FAQs',
            content
        });
    } catch (error) {
        console.log(error);
        res.status(500).send("An error occured")
    }
});

router.post('/faqs', checkAdmin, [
    check('content', 'Content must have a value').notEmpty(),
], async function (req, res) {
    const validationErrors = validationResult(req)
    if (validationErrors.errors.length > 0) {
        req.flash('red', 'Content must have a value.')
        return res.redirect('/admin/faqs')
    }
    try {
        const page = await Page.findOne({ title: 'FAQs' })
        page.content = req.body.content;
        await page.save();
        req.flash('green', 'FAQs updated successfully.')
        res.redirect('/admin/faqs')
    } catch (error) {
        console.log(error);
        res.status(500).send("An error occured")
    }
});

// terms
router.get("/terms_con", checkAdmin, async (req, res) => {
    try {
        const page = await Page.findOne({ title: 'Terms & Condition' })
        const content = page.content;
        res.status(201).render("terms", {
            content
        });
    } catch (error) {
        console.log(error);
        res.status(500).send("An error occured")
    }
});

router.post('/terms_con', checkAdmin, [
    check('content', 'Content must have a value').notEmpty(),
], async function (req, res) {
    const validationErrors = validationResult(req)
    if (validationErrors.errors.length > 0) {
        req.flash('red', 'Content must have a values.')
        return res.redirect('/admin/terms_con')
    }
    try {
        const page = await Page.findOne({ title: 'Terms & Condition' })
        page.content = req.body.content;
        await page.save()
        req.flash('green', 'Terms & Conditions updated successfully.')
        res.redirect('/admin/terms_con')
    } catch (error) {
        console.log(error);
        res.status(500).send("An error occurred")
    }
});

// privacy
router.get("/privacy_policy", checkAdmin, async (req, res) => {
    try {
        const page = await Page.findOne({ title: 'Privacy Policy' })
        const content = page.content;
        res.status(201).render("privacy", {
            content
        });
    } catch (error) {
        console.log(error);
        res.status(500).send("An error occured")
    }
});

router.post('/privacy_policy', checkAdmin, [
    check('content', 'Content must have a value').notEmpty(),
], async function (req, res) {
    const validationErrors = validationResult(req)
    if (validationErrors.errors.length > 0) {
        req.flash('red', 'Content must have a value.')
        return res.redirect('/admin/privacy_policy')
    }
    try {
        const page = await Page.findOne({ title: 'Privacy Policy' })
        page.content = req.body.content;
        await page.save()
        req.flash('green', 'Privacy Policy updated successfully.')
        res.redirect('/admin/privacy_policy')
    } catch (error) {
        console.log(error);
        res.status(500).send("An error occured")
    }
});

// contact
router.get("/contact", checkAdmin, async (req, res) => {
    try {
        const page = await Page.findOne({ title: 'Contact' })
        const content = page.content;
        const contact = await Contact.findOne();
        res.status(201).render("contact", {
            content,
            contact
        });
    } catch (error) {
        console.log(error);
        res.status(500).send("An error occured")
    }
});

router.post('/contact', checkAdmin, [
    check('phone', 'Phone must have a value').notEmpty(),
    check('email', 'Email must have a valid value').isEmail(),
    check('address', 'Address must have a value').notEmpty(),
], async function (req, res) {
    try {
        const page = await Page.findOne({ title: 'Contact' })
        const contact = await Contact.findOne();

        const validationErrors = validationResult(req)
        if (validationErrors.errors.length > 0) {
            req.flash('red', validationErrors.errors[0].msg)
            return res.redirect('/admin/contact')
        }
        page.content = req.body.content || '';
        await page.save()
        contact.phone = req.body.phone;
        contact.email = req.body.email;
        contact.address = req.body.address;
        await contact.save()
        req.flash('green', 'Contact Us updated successfully.')
        res.redirect('/admin/contact')
    } catch (error) {
        console.log(error);
        res.status(500).send("An error occured")
    }
});

module.exports = router;