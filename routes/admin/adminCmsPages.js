const router = require('express').Router();
const { check, validationResult } = require('express-validator');

const Page = require('../../models/pageModel');
const FAQs = require('../../models/faqsModel');
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

// GET all faqs
router.get("/faqs", checkAdmin, async (req, res) => {
    try {
        const faqs = await FAQs.find();
        res.status(201).render("faqs_new", {
            faqs,
            image: req.admin.image
        });
    } catch (error) {
        console.log(error);
        req.flash('red', error.message);
        res.redirect(req.originalUrl);
    }
});

// GET add faq
router.get("/faqs/add", checkAdmin, async (req, res) => {
    res.render("add_faq", { image: req.admin.image });
});

// POST add faq
router.post("/faqs/add", checkAdmin, [
    check('EnQue', 'English question must have a value').notEmpty(),
    check('EnAns', 'English answer must have a value').notEmpty(),
    check('FrQue', 'French question must have a value').notEmpty(),
    check('FrAns', 'French answer must have a value').notEmpty(),
], async (req, res) => {
    try {
        const validationErrors = validationResult(req);
        if (validationErrors.errors.length > 0) {
            req.flash('red', validationErrors.errors[0].msg);
            return res.redirect(req.originalUrl);
        }

        await FAQs.create({
            en: {
                question: req.body.EnQue,
                answer: req.body.EnAns,
            },
            fr: {
                question: req.body.FrQue,
                answer: req.body.FrAns,
            },
            category: req.body.category,
        });

        req.flash('green', `FAQ added successfully.`);
        res.redirect('/admin/cms/faqs');
    } catch (error) {
        req.flash('red', error.message);
        res.redirect('/admin/cms/faqs');
    }
});

// GET edit faq
router.get("/faqs/edit/:id", checkAdmin, async (req, res) => {
    try {
        const faq = await FAQs.findById(req.params.id);
        if (faq == null) {
            req.flash('red', `FAQ not found!`);
            return res.redirect('/admin/cms/faqs');
        }

        res.status(201).render("edit_faq", {
            faq,
            image: req.admin.image
        });
    } catch (error) {
        if (error.name === 'CastError') {
            req.flash('red', `FAQ not found!`);
            res.redirect('/admin/cms/faqs');
        } else {
            req.flash('red', error.message);
            res.redirect('/admin/cms/faqs');
        }
    }
});

// POST Edit project
router.post('/faqs/edit/:id', checkAdmin, [
    check('EnQue', 'English question must have a value').notEmpty(),
    check('EnAns', 'English answer must have a value').notEmpty(),
    check('FrQue', 'French question must have a value').notEmpty(),
    check('FrAns', 'French answer must have a value').notEmpty(),
], async (req, res) => {
    try {
        const validationErrors = validationResult(req);
        if (validationErrors.errors.length > 0) {
            req.flash('red', validationErrors.errors[0].msg);
            return res.redirect(req.originalUrl);
        }

        const faq = await FAQs.findById(req.params.id);
        if (faq == null) {
            req.flash('red', `FAQ not found!`);
            return res.redirect('/admin/cms/faqs');
        }

        faq.en.question = req.body.EnQue;
        faq.en.answer = req.body.EnAns;
        faq.fr.question = req.body.FrQue;
        faq.fr.answer = req.body.FrAns;
        faq.category = req.body.category;
        await faq.save();

        req.flash('green', `FAQ edited successfully.`);
        res.redirect('/admin/cms/faqs');
    } catch (error) {
        if (error.name === 'CastError') {
            req.flash('red', `FAQ not found!`);
            res.redirect('/admin/cms/faqs');
        } else {
            console.log(error);
            req.flash('red', error.message);
            res.redirect(req.originalUrl);
        }
    }
});

// GET delete faq
router.get("/faqs/delete/:id", checkAdmin, async (req, res) => {
    try {
        await FAQs.findByIdAndRemove(req.params.id);

        req.flash('green', `FAQ deleted successfully.`);
        res.redirect('/admin/cms/faqs');
    } catch (error) {
        if (error.name === 'CastError' || error.name === 'TypeError') {
            req.flash('red', `FAQ not found!`);
            res.redirect('/admin/cms/faqs');
        } else {
            console.log(error);
            req.flash('red', error.message);
            res.redirect('/admin/cms/faqs');
        }
    }
});

module.exports = router;