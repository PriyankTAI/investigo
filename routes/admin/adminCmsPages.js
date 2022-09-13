const router = require('express').Router();
const { check, validationResult } = require('express-validator');

const Page = require('../../models/pageModel');
const Contact = require('../../models/contactModel');

const checkAdmin = require('../../middleware/authAdminMiddleware');

const sharp = require('sharp');
const multer = require('multer');
const fs = require('fs-extra');
const storage = multer.memoryStorage();
const fileFilter = (req, file, cb) => {
    // reject a file
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
        cb(null, true);
    } else {
        cb(null, false);
    }
};
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 1024 * 1024 * 10
    },
    fileFilter: fileFilter
});

// about us
router.get("/about_us", checkAdmin, async (req, res) => {
    try {
        const page = await Page.findOne({ title: 'About Us' })
        const content = page.content;
        res.status(201).render("about", {
            content,
            image: req.admin.image
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
        req.flash('red', 'Content must have a value.');
        return res.redirect('/admin/cms/about_us');
    }
    try {
        const page = await Page.findOne({ title: 'About Us' })
        page.content = req.body.content;
        await page.save()
        req.flash('green', 'About us updated successfully.')
        res.redirect('/admin/cms/about_us')
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
            content,
            image: req.admin.image
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
        req.flash('red', 'Content must have a value.');
        return res.redirect('/admin/cms/faqs');
    }
    try {
        const page = await Page.findOne({ title: 'FAQs' })
        page.content = req.body.content;
        await page.save();
        req.flash('green', 'FAQs updated successfully.')
        res.redirect('/admin/cms/faqs')
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
            content,
            image: req.admin.image
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
        req.flash('red', 'Content must have a values.');
        return res.redirect('/admin/cms/terms_con');
    }
    try {
        const page = await Page.findOne({ title: 'Terms & Condition' })
        page.content = req.body.content;
        await page.save()
        req.flash('green', 'Terms & Conditions updated successfully.')
        res.redirect('/admin/cms/terms_con')
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
            content,
            image: req.admin.image
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
        req.flash('red', 'Content must have a value.');
        return res.redirect('/admin/cms/privacy_policy');
    }
    try {
        const page = await Page.findOne({ title: 'Privacy Policy' })
        page.content = req.body.content;
        await page.save()
        req.flash('green', 'Privacy Policy updated successfully.')
        res.redirect('/admin/cms/privacy_policy')
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
            contact,
            image: req.admin.image
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
            req.flash('red', validationErrors.errors[0].msg);
            return res.redirect('/admin/cms/contact');
        }
        page.content = req.body.content || '';
        await page.save()
        contact.phone = req.body.phone;
        contact.email = req.body.email;
        contact.address = req.body.address;
        await contact.save()
        req.flash('green', 'Contact Us updated successfully.')
        res.redirect('/admin/cms/contact')
    } catch (error) {
        console.log(error);
        res.status(500).send("An error occured")
    }
});

// uploader
router.post('/upload', upload.single('upload'), async (req, res) => {
    try {
        const filename = Date.now() + req.file.originalname;
        if (!fs.existsSync('./public/uploads/ckeditor')) {
            fs.mkdirSync('./public/uploads/ckeditor', { recursive: true });
        }
        await sharp(req.file.buffer)
            // .resize({ width: 1000, height: 723 })
            .toFile('./public/uploads/ckeditor/' + filename);

        const url = `/uploads/ckeditor/${filename}`;
        const send = `<script>window.parent.CKEDITOR.tools.callFunction('${req.query.CKEditorFuncNum}', '${url}');</script>`;
        res.send(send);
    } catch (error) {
        res.send(error.message);
        console.log(error.message);
    }
});

module.exports = router;