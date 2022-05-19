const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
// const formatDate = require('../helpers/formateDate');

const checkAdmin = require('../middleware/authAdminMiddleware');

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
const Package = require('../models/package');

// GET package
router.get("/", checkAdmin, async (req, res) => {
    try {
    const packages = await Package.find();
        res.status(201).render("package",{
            packages
        });
    } catch (error) {
        console.log(error);
        res.status(500).send("An error occured")
    }
});

// GET add package
router.get("/add", checkAdmin, (req, res) => {
    res.render("add_package");
});

// POST add package
router.post('/add', checkAdmin, upload.single('image'), [
    check('title', 'title must have a value').notEmpty(),
    check('price', 'price must have a value').notEmpty(),
], async (req, res) => {
    try {
        const { title, description, price } = req.body;
        const validationErrors = validationResult(req);
        if (validationErrors.errors.length > 0) {
            req.flash('red', validationErrors.errors[0].msg);
            return res.render('add_package')
        }
        const filename = new Date().toISOString().replace(/:/g, '-') + req.file.originalname;
        const package = new Package({
            title,
            description,
            price,
            image: '/uploads/package/' + filename
        })
        if (!fs.existsSync('./public/uploads/package')) {
            fs.mkdirSync('./public/uploads/package', { recursive: true });
        }
        await sharp(req.file.buffer)
            .resize({ width: 1000, height: 723 })
            .toFile('./public/uploads/package/' + filename);
        await package.save();
        req.flash('green', `Package added successfully`);
        res.redirect('/admin/package')
    } catch (error) {
        if (error.code == 11000) {
            req.flash('red', `Title name '${req.body.name}' already exist!`);
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
            package
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
    check('price', 'price must have a value').notEmpty(),
], async (req, res) => {
    try {
        const { title, description, price } = req.body;
        const validationErrors = validationResult(req);
        if (validationErrors.errors.length > 0) {
            const alert = validationErrors.array()
            return res.render('edit_category', {
                alert
            })
        }
        const id = req.params.id;
        const package = await Package.findById(id);
        if (package == null) {
            req.flash('red', `Package not found!`);
            return res.redirect('/admin/package');
        }
        package.title = title;
        package.description = description;
        package.price = price;
        if (typeof req.file !== 'undefined') {
            oldImage = "public" + package.image;
            fs.remove(oldImage, function (err) {
                if (err) { console.log(err); }
            })
            const filename = new Date().toISOString().replace(/:/g, '-') + req.file.originalname;
            package.image = '/uploads/package/' + filename;
            // fs.access('./public/uploads/category', (err) => { if (err) fs.mkdirSync('./public/uploads/category'); });
            if (!fs.existsSync('./public/uploads/package')) {
                fs.mkdirSync('./public/uploads/package', { recursive: true });
            }
            await sharp(req.file.buffer)
                .resize({ width: 1000, height: 723 })
                .toFile('./public/uploads/package/' + filename);
        }
        await package.save();
        req.flash('green', `Package Edited successfully`);
        res.redirect('/admin/package')
    } catch (error) {
        console.log(error.message);
        if (error.code == 11000) {
            req.flash('red', `Package name '${req.body.name}' already exist!`);
            res.redirect(`/admin/package/edit/${req.params.id}`);
        } else if (error.name === 'CastError') {
            req.flash('red', `Package not found!`);
            res.redirect('/admin/package');
        } else {
            res.send(error.message);
            console.log(error);
        }
    }
});

// GET delete category
router.get("/delete/:id", checkAdmin, async (req, res) => {
    try {
        const id = req.params.id;
        const package = await Package.findByIdAndRemove(id);
        // await Subategory.deleteMany({ category: cat.id });
        // await Product.deleteMany({ category: cat.id });
        image = "public" + package.image;
        fs.remove(image, function (err) {
            if (err) { console.log(err); }
        })
        req.flash('green', `Package Deleted successfully`);
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