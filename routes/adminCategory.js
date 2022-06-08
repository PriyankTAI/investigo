const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');

const formatDate = require('../helpers/formateDate');

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
const Category = require('../models/category');

// GET category
router.get("/", checkAdmin, async (req, res) => {
    try {
        const cats = await Category.find();
        res.status(201).render("category", {
            cats
        });
    } catch (error) {
        console.log(error);
        res.status(500).send("An error occured")
    }
});

// GET add category
router.get("/add", checkAdmin, (req, res) => {
    res.render("add_category");
});

// POST add category
router.post('/add', checkAdmin, [
    check('name', 'Category name must have a value').notEmpty(),
], async (req, res) => {
    try {
        const { name } = req.body;
        const validationErrors = validationResult(req)
        if (validationErrors.errors.length > 0) {
            const alert = validationErrors.array()
            return res.render('add_category')
        }
        const cat = new Category({
            name,
        })
        if (req.body.featured) {
            cat.featured = true
        }
        await cat.save();
        req.flash('green', `Category added successfully`);
        res.redirect('/admin/category')
    } catch (error) {
        if (error.code == 11000) {
            req.flash('red', `Category name '${req.body.name}' already exist!`);
            res.redirect('/admin/category');
        } else {
            console.log(error);
            res.send(error.message);
        }
    }
});

// GET edit category
router.get("/edit/:id", checkAdmin, async (req, res) => {
    try {
        const id = req.params.id;
        const cat = await Category.findById(id);
        if (cat == null) {
            req.flash('red', `Category not found!`);
            return res.redirect('/admin/category');
        }
        res.status(201).render("edit_category", {
            cat
        });
    } catch (error) {
        if (error.name === 'CastError') {
            req.flash('red', `Category not found!`);
            res.redirect('/admin/category');
        } else {
            console.log(error);
            res.send(error)
        }
    }
});

// POST Edit category
router.post('/edit/:id', checkAdmin, [
    check('name', 'Category name must have a value').notEmpty(),
], async (req, res) => {
    try {
        const { name } = req.body;
        const validationErrors = validationResult(req)
        if (validationErrors.errors.length > 0) {
            const alert = validationErrors.array()
            return res.render('edit_category')
        }
        const id = req.params.id;
        const cat = await Category.findById(id);
        if (cat == null) {
            req.flash('red', `Category not found!`);
            return res.redirect('/admin/category');
        }
        cat.name = name;
        if (req.body.featured) {
            cat.featured = true;
        } else {
            cat.featured = false;
        }
        await cat.save();
        req.flash('green', `Category Edited successfully`);
        res.redirect('/admin/category')
    } catch (error) {
        console.log(error.message);
        if (error.code == 11000) {
            req.flash('red', `Category name '${req.body.name}' already exist!`);
            res.redirect(`/admin/category/edit/${req.params.id}`);
        } else if (error.name === 'CastError') {
            req.flash('red', `Category not found!`);
            res.redirect('/admin/category');
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
        const cat = await Category.findByIdAndRemove(id);
        req.flash('green', `Category Deleted successfully`);
        res.redirect('/admin/category')
    } catch (error) {
        if (error.name === 'CastError' || error.name === 'TypeError') {
            req.flash('red', `Category not found!`);
            res.redirect('/admin/category');
        } else {
            console.log(error);
            res.send(error)
        }
    }
});

module.exports = router;