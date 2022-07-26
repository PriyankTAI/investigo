const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');

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

// GET model
const Package = require('../../models/packageModel');

// GET package
router.get("/", checkAdmin, async (req, res) => {
    try {
        const packages = await Package.find();
        res.status(201).render("package", {
            packages,
            image: req.admin.image
        });
    } catch (error) {
        console.log(error);
        res.status(500).send("An error occured")
    }
});

// GET add package
router.get("/add", checkAdmin, (req, res) => {
    res.render("add_package", { image: req.admin.image });
});

// POST add package
router.post('/add', checkAdmin, upload.single('image'), [
    check('title', 'title must have a value').notEmpty(),
    check('description', 'description must have a value').notEmpty(),
    check('price', 'price must have a value').isNumeric(),
    check('annualReturn', 'annul return must have a value').isNumeric(),
    check('term', 'term must have a value').isNumeric(),
], async (req, res) => {
    try {
        const { title, description, price, annualReturn, term } = req.body;
        const validationErrors = validationResult(req);
        if (validationErrors.errors.length > 0) {
            req.flash('red', validationErrors.errors[0].msg);
            return res.redirect(req.originalUrl)
        }
        const filename = new Date().toISOString().replace(/:/g, '-') + req.file.originalname.replace(" ", "");
        const monthlyReturn = req.body.monthlyReturn || (annualReturn / 12).toFixed(2);
        const dailyReturn = req.body.dailyReturn || (monthlyReturn / 30).toFixed(2);
        const package = new Package({
            title,
            description,
            price,
            annualReturn,
            dailyReturn,
            monthlyReturn,
            term,
            image: '/uploads/package/' + filename
        })
        if (!fs.existsSync('./public/uploads/package')) {
            fs.mkdirSync('./public/uploads/package', { recursive: true });
        }
        await package.save();
        await sharp(req.file.buffer)
            .toFile('./public/uploads/package/' + filename);
        req.flash('green', `Package added successfully`);
        res.redirect('/admin/package')
    } catch (error) {
        if (error.code == 11000) {
            req.flash('red', `Title name '${req.body.title}' already exist!`);
            res.redirect('/admin/package');
        } else {
            console.log(error);
            res.send(error.message);
        }
    }
});

// GET edit package
router.get("/edit/:id", checkAdmin, async (req, res) => {
    try {
        const id = req.params.id;
        const package = await Package.findById(id);
        if (package == null) {
            req.flash('red', `Package not found!`);
            return res.redirect('/admin/package');
        }
        res.status(201).render("edit_package", {
            package,
            image: req.admin.image
        });
    } catch (error) {
        if (error.name === 'CastError') {
            req.flash('red', `Package not found!`);
            res.redirect('/admin/package');
        } else {
            console.log(error);
            res.send(error)
        }
    }
});

// POST Edit package
router.post('/edit/:id', checkAdmin, upload.single('image'), [
    check('title', 'title must have a value').notEmpty(),
    check('description', 'description must have a value').notEmpty(),
    check('price', 'price must have a value').isNumeric(),
    check('annualReturn', 'annul return must have a value').isNumeric(),
    check('term', 'term must have a value').isNumeric(),
], async (req, res) => {
    try {
        const { title, description, price, annualReturn, term } = req.body;
        const validationErrors = validationResult(req);
        if (validationErrors.errors.length > 0) {
            req.flash('red', validationErrors.errors[0].msg)
            return res.redirect(req.originalUrl);
        }
        const id = req.params.id;
        const monthlyReturn = req.body.monthlyReturn || (annualReturn / 12).toFixed(2);
        const dailyReturn = req.body.dailyReturn || (monthlyReturn / 30).toFixed(2);
        const package = await Package.findById(id);
        if (package == null) {
            req.flash('red', `Package not found!`);
            return res.redirect('/admin/package');
        }
        package.title = title;
        package.description = description;
        package.price = price;
        package.annualReturn = annualReturn;
        package.monthlyReturn = monthlyReturn;
        package.dailyReturn = dailyReturn;
        package.term = term;
        if (typeof req.file !== 'undefined') {
            oldImage = "public" + package.image;

            const filename = new Date().toISOString().replace(/:/g, '-') + req.file.originalname.replace(" ", "");
            package.image = '/uploads/package/' + filename;
            if (!fs.existsSync('./public/uploads/package')) {
                fs.mkdirSync('./public/uploads/package', { recursive: true });
            }
            await package.save();
            fs.remove(oldImage, function (err) {
                if (err) { console.log(err); }
            })
            await sharp(req.file.buffer)
                .toFile('./public/uploads/package/' + filename);
        } else {
            await package.save();
        }
        req.flash('green', `Package edited successfully`);
        res.redirect('/admin/package')
    } catch (error) {
        console.log(error.message);
        if (error.code == 11000) {
            req.flash('red', `Package name '${req.body.title}' already exist!`);
            return res.redirect(req.originalUrl);
        } else if (error.name === 'CastError') {
            req.flash('red', `Package not found!`);
            res.redirect('/admin/package');
        } else {
            res.send(error.message);
            console.log(error);
        }
    }
});

// GET delete package
router.get("/delete/:id", checkAdmin, async (req, res) => {
    try {
        const id = req.params.id;
        const package = await Package.findByIdAndRemove(id);
        image = "public" + package.image;
        fs.remove(image, function (err) {
            if (err) { console.log(err); }
        })
        req.flash('green', `Package deleted successfully`);
        res.redirect('/admin/package')
    } catch (error) {
        if (error.name === 'CastError' || error.name === 'TypeError') {
            req.flash('red', `Package not found!`);
            res.redirect('/admin/package');
        } else {
            console.log(error);
            res.send(error)
        }
    }
});

module.exports = router;