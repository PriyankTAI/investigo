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
        const page = await Page.findOne({ title: 'About Us' });
        res.status(201).render("about", {
            page,
            image: req.admin.image
        });
    } catch (error) {
        console.log(error);
        req.flash('red', error.message);
        res.redirect(req.originalUrl);
    }
});

router.post('/about_us', checkAdmin, [
    check('EnContent', 'English content must have a value').notEmpty(),
    check('FrContent', 'French content must have a value').notEmpty(),
], async function (req, res) {
    const validationErrors = validationResult(req);
    if (validationErrors.errors.length > 0) {
        req.flash('red', validationErrors.errors[0].msg);
        return res.redirect(req.originalUrl);
    }
    try {
        const page = await Page.findOne({ title: 'About Us' });
        page.en.content = req.body.EnContent;
        page.fr.content = req.body.FrContent;
        await page.save();

        req.flash('green', 'About us updated successfully.');
        res.redirect('/admin/cms/about_us');
    } catch (error) {
        console.log(error);
        req.flash('red', error.message);
        res.redirect(req.originalUrl);
    }
});

// faqs
router.get("/faqs", checkAdmin, async (req, res) => {
    try {
        const page = await Page.findOne({ title: 'FAQs' });
        res.status(201).render("faqs", {
            page,
            image: req.admin.image
        });
    } catch (error) {
        console.log(error);
        req.flash('red', error.message);
        res.redirect(req.originalUrl);
    }
});

router.post('/faqs', checkAdmin, [
    check('EnContent', 'English content must have a value').notEmpty(),
    check('FrContent', 'French content must have a value').notEmpty(),
], async function (req, res) {
    const validationErrors = validationResult(req);
    if (validationErrors.errors.length > 0) {
        req.flash('red', validationErrors.errors[0].msg);
        return res.redirect(req.originalUrl);
    }
    try {
        const page = await Page.findOne({ title: 'FAQs' });
        page.en.content = req.body.EnContent;
        page.fr.content = req.body.FrContent;
        await page.save();

        req.flash('green', 'FAQs updated successfully.')
        res.redirect('/admin/cms/faqs')
    } catch (error) {
        console.log(error);
        req.flash('red', error.message);
        res.redirect(req.originalUrl);
    }
});

// terms
router.get("/terms_con", checkAdmin, async (req, res) => {
    try {
        const page = await Page.findOne({ title: 'Terms & Condition' });
        res.status(201).render("terms", {
            page,
            image: req.admin.image
        });
    } catch (error) {
        console.log(error);
        req.flash('red', error.message);
        res.redirect(req.originalUrl);
    }
});

router.post('/terms_con', checkAdmin, [
    check('EnContent', 'English content must have a value').notEmpty(),
    check('FrContent', 'French content must have a value').notEmpty(),
], async function (req, res) {
    const validationErrors = validationResult(req)
    if (validationErrors.errors.length > 0) {
        req.flash('red', validationErrors.errors[0].msg);
        return res.redirect(req.originalUrl);
    }
    try {
        const page = await Page.findOne({ title: 'Terms & Condition' });
        page.en.content = req.body.EnContent;
        page.fr.content = req.body.FrContent;
        await page.save();

        req.flash('green', 'Terms & Conditions updated successfully.');
        res.redirect('/admin/cms/terms_con');
    } catch (error) {
        console.log(error);
        req.flash('red', error.message);
        res.redirect(req.originalUrl);
    }
});

// privacy
router.get("/privacy_policy", checkAdmin, async (req, res) => {
    try {
        const page = await Page.findOne({ title: 'Privacy Policy' });
        res.status(201).render("privacy", {
            page,
            image: req.admin.image
        });
    } catch (error) {
        console.log(error);
        req.flash('red', error.message);
        res.redirect(req.originalUrl);
    }
});

router.post('/privacy_policy', checkAdmin, [
    check('EnContent', 'English content must have a value').notEmpty(),
    check('FrContent', 'French content must have a value').notEmpty(),
], async function (req, res) {
    const validationErrors = validationResult(req)
    if (validationErrors.errors.length > 0) {
        req.flash('red', validationErrors.errors[0].msg);
        return res.redirect(req.originalUrl);
    }
    try {
        const page = await Page.findOne({ title: 'Privacy Policy' });
        page.en.content = req.body.EnContent;
        page.fr.content = req.body.FrContent;
        await page.save();

        req.flash('green', 'Privacy Policy updated successfully.');
        res.redirect('/admin/cms/privacy_policy');
    } catch (error) {
        console.log(error);
        req.flash('red', error.message);
        res.redirect(req.originalUrl);
    }
});

// contact
router.get("/contact", checkAdmin, async (req, res) => {
    try {
        const page = await Page.findOne({ title: 'Contact' });
        const contact = await Contact.findOne();
        res.status(201).render("contact", {
            page,
            contact,
            image: req.admin.image
        });
    } catch (error) {
        console.log(error);
        req.flash('red', error.message);
        res.redirect(req.originalUrl);
    }
});

router.post('/contact', checkAdmin, [
    check('EnContent', 'English content must have a value').notEmpty(),
    check('FrContent', 'French content must have a value').notEmpty(),
    check('phone', 'Phone must have a value').notEmpty(),
    check('email', 'Email must have a valid value').isEmail(),
    check('address', 'Address must have a value').notEmpty(),
], async function (req, res) {
    try {
        const page = await Page.findOne({ title: 'Contact' });
        const contact = await Contact.findOne();

        const validationErrors = validationResult(req);
        if (validationErrors.errors.length > 0) {
            req.flash('red', validationErrors.errors[0].msg);
            return res.redirect(req.originalUrl);
        }

        page.en.content = req.body.EnContent;
        page.fr.content = req.body.FrContent;
        await page.save();

        contact.phone = req.body.phone;
        contact.email = req.body.email;
        contact.address = req.body.address;
        await contact.save();

        req.flash('green', 'Contact Us updated successfully.');
        res.redirect('/admin/cms/contact');
    } catch (error) {
        console.log(error);
        req.flash('red', error.message);
        res.redirect(req.originalUrl);
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