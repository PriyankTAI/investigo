const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');

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
const Blog = require('../models/blog');
const Category = require('../models/category');

// GET blog
router.get("/", checkAdmin, async (req, res) => {
    try {
        const blogs = await Blog.find().populate('category');
        res.status(201).render("blog", {
            blogs
        });
    } catch (error) {
        console.log(error);
        res.status(500).send("An error occured")
    }
});

// GET add blog
router.get("/add", checkAdmin, async (req, res) => {
    const cats = await Category.find()
    res.render("add_blog", {
        cats
    });
});

// POST add blog
router.post('/add', checkAdmin, upload.single('image'), [
    check('title', 'title must have a value').notEmpty(),
    check('content', 'content must have a value').notEmpty(),
    check('category', 'Please select category').notEmpty(),
], async (req, res) => {
    try {
        const { title, content, category, tags } = req.body;
        const validationErrors = validationResult(req);
        if (validationErrors.errors.length > 0) {
            req.flash('red', validationErrors.errors[0].msg)
            return res.redirect(req.originalUrl);
        }
        const filename = new Date().toISOString().replace(/:/g, '-') + req.file.originalname;
        const tagsArray = tags.split(',').filter(item => item !== '');
        const blog = new Blog({
            title,
            content,
            category,
            tags: tagsArray,
            image: '/uploads/blog/' + filename
        })
        if (!fs.existsSync('./public/uploads/blog')) {
            fs.mkdirSync('./public/uploads/blog', { recursive: true });
        }
        await blog.save();
        await sharp(req.file.buffer)
            .resize({ width: 1000, height: 723 })
            .toFile('./public/uploads/blog/' + filename);
        req.flash('green', `Blog added successfully`);
        res.redirect('/admin/blog')
    } catch (error) {
        console.log(error);
        res.send(error.message)
    }
});

// GET edit blog
router.get("/edit/:id", checkAdmin, async (req, res) => {
    try {
        const id = req.params.id;
        const cats = await Category.find();
        const blog = await Blog.findById(id);
        if (blog == null) {
            req.flash('red', `Blog not found!`);
            return res.redirect('/admin/blog');
        }
        res.status(201).render("edit_blog", {
            blog,
            cats
        });
    } catch (error) {
        if (error.name === 'CastError') {
            req.flash('red', `Blog not found!`);
            res.redirect('/admin/blog');
        } else {
            console.log(error);
            res.send(error)
        }
    }
});

// POST Edit blog
router.post('/edit/:id', checkAdmin, upload.single('image'), [
    check('title', 'title must have a value').notEmpty(),
    check('content', 'content must have a value').notEmpty(),
    check('category', 'Please select category').notEmpty(),
], async (req, res) => {
    try {
        const { title, content, category, tags } = req.body;
        const validationErrors = validationResult(req);
        if (validationErrors.errors.length > 0) {
            req.flash('red', validationErrors.errors[0].msg)
            return res.redirect(req.originalUrl);
        }
        const id = req.params.id;
        const blog = await Blog.findById(id);
        if (blog == null) {
            req.flash('red', `Blog not found!`);
            return res.redirect('/admin/blog');
        }
        const tagsArray = tags.split(',').filter(item => item !== '');
        blog.title = title;
        blog.content = content;
        blog.category = category;
        blog.tags = tagsArray;
        if (typeof req.file !== 'undefined') {
            oldImage = "public" + blog.image;

            const filename = new Date().toISOString().replace(/:/g, '-') + req.file.originalname;
            blog.image = '/uploads/blog/' + filename;
            if (!fs.existsSync('./public/uploads/blog')) {
                fs.mkdirSync('./public/uploads/blog', { recursive: true });
            }
            await blog.save();
            fs.remove(oldImage, function (err) {
                if (err) { console.log(err); }
            })
            await sharp(req.file.buffer)
                .resize({ width: 1000, height: 723 })
                .toFile('./public/uploads/blog/' + filename);
        } else {
            await blog.save();
        }
        req.flash('green', `Blog edited successfully`);
        res.redirect('/admin/blog')
    } catch (error) {
        res.send(error.message);
        console.log(error);
    }
});

// GET delete blog
router.get("/delete/:id", checkAdmin, async (req, res) => {
    try {
        const id = req.params.id;
        const blog = await Blog.findByIdAndRemove(id);
        image = "public" + blog.image;
        fs.remove(image, function (err) {
            if (err) { console.log(err); }
        })
        req.flash('green', `Blog deleted successfully`);
        res.redirect('/admin/blog')
    } catch (error) {
        if (error.name === 'CastError' || error.name === 'TypeError') {
            req.flash('red', `Blog not found!`);
            res.redirect('/admin/blog');
        } else {
            console.log(error);
            res.send(error)
        }
    }
});

module.exports = router;