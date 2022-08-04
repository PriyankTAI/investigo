const router = require('express').Router();
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
const Project = require('../../models/projectModel');
const Order = require('../../models/orderModel')

// GET project
router.get("/", checkAdmin, async (req, res) => {
    try {
        const projects = await Project.find().sort('-_id');
        res.status(201).render("project", {
            projects,
            image: req.admin.image
        });
    } catch (error) {
        console.log(error);
        res.status(500).send("An error occured")
    }
});

// GET add project
router.get("/add", checkAdmin, (req, res) => {
    res.render("add_project", { image: req.admin.image });
});

// POST add project
router.post('/add', checkAdmin, upload.single('image'), [
    check('title', 'title must have a value').notEmpty(),
    check('category', 'category must have a value').notEmpty(),
    check('property', 'property must have a value').notEmpty(),
    check('description', 'description must have a value').notEmpty(),
    check('totalAmount', 'total amount must have a value').isNumeric(),
    check('location', 'location must have a value').notEmpty(),
], async (req, res) => {
    try {
        const validationErrors = validationResult(req);
        if (validationErrors.errors.length > 0) {
            req.flash('red', validationErrors.errors[0].msg);
            return res.redirect(req.originalUrl);
        }
        const filename = new Date().toISOString().replace(/:/g, '-') + req.file.originalname.replace(" ", "");
        const project = new Project({
            title: req.body.title,
            category: req.body.category,
            property: req.body.property,
            description: req.body.description,
            totalAmount: req.body.totalAmount,
            location: req.body.location,
            coordinates: {
                lat: req.body.lat,
                lng: req.body.lng
            },
            image: '/uploads/project/' + filename
        })
        if (!fs.existsSync('./public/uploads/project')) {
            fs.mkdirSync('./public/uploads/project', { recursive: true });
        }
        await project.save();
        await sharp(req.file.buffer)
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
            project,
            image: req.admin.image
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
    check('category', 'category must have a value').notEmpty(),
    check('property', 'property must have a value').notEmpty(),
    check('description', 'description must have a value').notEmpty(),
    check('totalAmount', 'total amount must have a value').isNumeric(),
    check('location', 'location must have a value').notEmpty(),
], async (req, res) => {
    try {
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
        project.title = req.body.title;
        project.category = req.body.category;
        project.property = req.body.property;
        project.description = req.body.description;
        project.totalAmount = req.body.totalAmount;
        project.location = req.body.location;
        project.coordinates.lat = req.body.lat;
        project.coordinates.lng = req.body.lng;
        if (typeof req.file !== 'undefined') {
            oldImage = "public" + project.image;

            const filename = new Date().toISOString().replace(/:/g, '-') + req.file.originalname.replace(" ", "");
            project.image = '/uploads/project/' + filename;
            if (!fs.existsSync('./public/uploads/project')) {
                fs.mkdirSync('./public/uploads/project', { recursive: true });
            }
            await project.save();
            fs.remove(oldImage, function (err) {
                if (err) { console.log(err); }
            })
            await sharp(req.file.buffer)
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

// GET project by id
router.get('/:id', checkAdmin, async (req, res) => {
    try {
        const [project, orders] = await Promise.all([
            Project.findById(req.params.id),
            Order.find({ project: req.params.id })
                .populate('project package user')
                .sort('-_id')
        ])

        if (project == null) {
            req.flash('red', 'Project not found!');
            return res.redirect('/admin/project');
        }

        res.render('project_view', {
            project,
            orders,
            image: req.admin.image
        })
    } catch (error) {
        if (error.name === 'CastError') {
            req.flash('red', `Project not found!`);
        } else {
            console.log(error);
            req.flash('red', error.message);
        }
        res.redirect('/admin/project');
    }
})

module.exports = router;