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
const Project = require('../models/project');

// GET project
router.get("/", checkAdmin, async (req, res) => {
    try {
        const projects = await Project.find();
        res.status(201).render("project", {
            projects
        });
    } catch (error) {
        console.log(error);
        res.status(500).send("An error occured")
    }
});

// GET add project
router.get("/add", checkAdmin, (req, res) => {
    res.render("add_project");
});

// POST add project
router.post('/add', checkAdmin, upload.single('image'), [
    check('title', 'title must have a value').notEmpty(),
    check('description', 'description must have a value').notEmpty(),
], async (req, res) => {
    try {
        const { title, description } = req.body;
        const validationErrors = validationResult(req);
        if (validationErrors.errors.length > 0) {
            req.flash('red', validationErrors.errors[0].msg);
            return res.render('add_project')
        }
        const filename = new Date().toISOString().replace(/:/g, '-') + req.file.originalname;
        const project = new Project({
            title,
            description,
            image: '/uploads/project/' + filename
        })
        if (!fs.existsSync('./public/uploads/project')) {
            fs.mkdirSync('./public/uploads/project', { recursive: true });
        }
        await project.save();
        await sharp(req.file.buffer)
            .resize({ width: 1000, height: 723 })
            .toFile('./public/uploads/project/' + filename);
        req.flash('green', `Project added successfully`);
        res.redirect('/admin/project')
    } catch (error) {
        console.log(error);
        res.send(error.message);
    }
});

// GET edit project
router.get("/edit/:id", checkAdmin, async (req, res) => {
    try {
        const id = req.params.id;
        const project = await Project.findById(id);
        if (project == null) {
            req.flash('red', `Project not found!`);
            return res.redirect('/admin/project');
        }
        res.status(201).render("edit_project", {
            project
        });
    } catch (error) {
        if (error.name === 'CastError') {
            req.flash('red', `Project not found!`);
            res.redirect('/admin/project');
        } else {
            console.log(error);
            res.send(error)
        }
    }
});

// POST Edit project
router.post('/edit/:id', checkAdmin, upload.single('image'), [
    check('title', 'title must have a value').notEmpty(),
    check('description', 'description must have a value').notEmpty(),
], async (req, res) => {
    try {
        const { title, description } = req.body;
        const validationErrors = validationResult(req);
        if (validationErrors.errors.length > 0) {
            req.flash('red', validationErrors.errors[0].msg)
            return res.redirect(req.originalUrl);
        }
        const id = req.params.id;
        const project = await Project.findById(id);
        if (project == null) {
            req.flash('red', `Project not found!`);
            return res.redirect('/admin/project');
        }
        project.title = title;
        project.description = description;
        if (typeof req.file !== 'undefined') {
            oldImage = "public" + project.image;

            const filename = new Date().toISOString().replace(/:/g, '-') + req.file.originalname;
            project.image = '/uploads/project/' + filename;
            if (!fs.existsSync('./public/uploads/project')) {
                fs.mkdirSync('./public/uploads/project', { recursive: true });
            }
            await project.save();
            fs.remove(oldImage, function (err) {
                if (err) { console.log(err); }
            })
            await sharp(req.file.buffer)
                .resize({ width: 1000, height: 723 })
                .toFile('./public/uploads/project/' + filename);
        } else {
            await project.save();
        }
        req.flash('green', `Project edited successfully`);
        res.redirect('/admin/project')
    } catch (error) {
        if (error.name === 'CastError') {
            req.flash('red', `Project not found!`);
            res.redirect('/admin/project');
        } else {
            res.send(error.message);
            console.log(error);
        }
    }
});

// GET delete project
router.get("/delete/:id", checkAdmin, async (req, res) => {
    try {
        const id = req.params.id;
        const project = await Project.findByIdAndRemove(id);
        image = "public" + project.image;
        fs.remove(image, function (err) {
            if (err) { console.log(err); }
        })
        req.flash('green', `Project deleted successfully`);
        res.redirect('/admin/project')
    } catch (error) {
        if (error.name === 'CastError' || error.name === 'TypeError') {
            req.flash('red', `Project not found!`);
            res.redirect('/admin/project');
        } else {
            console.log(error);
            res.send(error)
        }
    }
});

module.exports = router;