const router = require('express').Router();
const mongoose = require('mongoose');
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
        // req._params = req.params;
        // cb(new Error('Wrong file type! (Please upload only jpg or png.)'));
    }
};
const upload = multer({
    storage: storage,
    // limits: {
    //     fileSize: 1024 * 1024 * 20
    // },
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
router.post('/add', checkAdmin, upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'icon', maxCount: 1 },
    { name: 'gallery' }
]), [
    check('EnTitle', 'English title must have a value').notEmpty(),
    check('EnDesc', 'English description must have a value').notEmpty(),
    check('FrTitle', 'French title must have a value').notEmpty(),
    check('FrDesc', 'French description must have a value').notEmpty(),
    check('category', 'category must have a value').notEmpty(),
    check('property', 'property must have a value').notEmpty(),
    check('totalAmount', 'total amount must have a value').isNumeric(),
    check('annualReturn', 'annual return must have a value').notEmpty(),
    check('city', 'city must have a value').notEmpty(),
    check('location', 'location must have a value').notEmpty(),
], async (req, res) => {
    try {
        const validationErrors = validationResult(req);
        if (validationErrors.errors.length > 0) {
            req.flash('red', validationErrors.errors[0].msg);
            return res.redirect(req.originalUrl);
        }

        if (!fs.existsSync('./public/uploads/project'))
            fs.mkdirSync('./public/uploads/project', { recursive: true });

        const filename = Date.now() + req.files.image[0].originalname.replace(" ", "");
        await sharp(req.files.image[0].buffer)
            .resize({ width: 426, height: 242 })
            .toFile(`./public/uploads/project/${filename}`);

        const iconfilename = Date.now() + req.files.icon[0].originalname.replace(" ", "");
        await sharp(req.files.icon[0].buffer)
            .toFile(`./public/uploads/project/${iconfilename}`);

        let gallery = [];
        if (req.files.gallery) {
            for (let i = 0; i < req.files.gallery.length; i++) {
                let name = Date.now() + req.files.gallery[i].originalname.replace(" ", "");
                await sharp(req.files.gallery[i].buffer)
                    .resize({ width: 426, height: 242 })
                    .toFile(`./public/uploads/project/${name}`);
                gallery.push(`/uploads/project/${name}`);
            }
        }

        await Project.create({
            en: {
                title: req.body.EnTitle,
                description: req.body.EnDesc,
            },
            fr: {
                title: req.body.FrTitle,
                description: req.body.FrDesc,
            },
            category: req.body.category,
            property: req.body.property,
            totalAmount: req.body.totalAmount,
            annualReturn: req.body.annualReturn,
            location: req.body.location,
            city: req.body.city,
            coordinates: {
                lat: req.body.lat,
                lng: req.body.lng
            },
            image: `/uploads/project/${filename}`,
            icon: `/uploads/project/${iconfilename}`,
            gallery
        });

        req.flash('green', `Project added successfully`);
        res.redirect('/admin/project');
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
router.post('/edit/:id', checkAdmin, upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'icon', maxCount: 1 }
]), [
    check('EnTitle', 'English title must have a value').notEmpty(),
    check('EnDesc', 'English description must have a value').notEmpty(),
    check('FrTitle', 'French title must have a value').notEmpty(),
    check('FrDesc', 'French description must have a value').notEmpty(),
    check('category', 'category must have a value').notEmpty(),
    check('property', 'property must have a value').notEmpty(),
    check('totalAmount', 'total amount must have a value').isNumeric(),
    check('annualReturn', 'annual return must have a value').notEmpty(),
    check('city', 'city must have a value').notEmpty(),
    check('location', 'location must have a value').notEmpty(),
], async (req, res) => {
    try {
        const validationErrors = validationResult(req);
        if (validationErrors.errors.length > 0) {
            req.flash('red', validationErrors.errors[0].msg);
            return res.redirect(req.originalUrl);
        }

        const id = req.params.id;
        const project = await Project.findById(id);
        if (project == null) {
            req.flash('red', `Project not found!`);
            return res.redirect('/admin/project');
        }

        project.en.title = req.body.EnTitle;
        project.en.description = req.body.EnDesc;
        project.fr.title = req.body.FrTitle;
        project.fr.description = req.body.FrDesc;
        project.category = req.body.category;
        project.property = req.body.property;
        project.totalAmount = req.body.totalAmount;
        project.annualReturn = req.body.annualReturn;
        project.location = req.body.location;
        project.city = req.body.city;
        project.coordinates.lat = req.body.lat;
        project.coordinates.lng = req.body.lng;

        if (typeof req.files.image !== 'undefined') {
            oldImage = "public" + project.image;

            const filename = Date.now() + req.files.image[0].originalname.replace(" ", "");
            project.image = `/uploads/project/${filename}`;
            if (!fs.existsSync('./public/uploads/project')) {
                fs.mkdirSync('./public/uploads/project', { recursive: true });
            }
            fs.remove(oldImage, function (err) {
                if (err) { console.log(err); }
            })
            await sharp(req.files.image[0].buffer)
                .resize({ width: 426, height: 242 })
                .toFile(`./public/uploads/project/${filename}`);
        }

        if (typeof req.files.icon !== 'undefined') {
            oldImage = "public" + project.icon;

            const filename = Date.now() + req.files.icon[0].originalname.replace(" ", "");
            project.icon = `/uploads/project/${filename}`;
            if (!fs.existsSync('./public/uploads/project')) {
                fs.mkdirSync('./public/uploads/project', { recursive: true });
            }
            fs.remove(oldImage, function (err) {
                if (err) { console.log(err); }
            })
            await sharp(req.files.icon[0].buffer)
                .toFile(`./public/uploads/project/${filename}`);
        }

        await project.save();

        req.flash('green', `Project edited successfully`);
        res.redirect('/admin/project');
    } catch (error) {
        if (error.name === 'CastError') {
            req.flash('red', `Project not found!`);
            res.redirect('/admin/project');
        } else {
            console.log(error);
            req.flash('red', error.message);
            res.redirect('/admin/project');
        }
    }
});

// add image
router.post('/gallery/:id/add', upload.single('image'), async (req, res) => {
    const id = req.params.id;
    try {
        // upload file
        const filename = Date.now() + req.file.originalname.replace(" ", "");
        if (!fs.existsSync('./public/uploads/project')) {
            fs.mkdirSync('./public/uploads/project', { recursive: true });
        }
        await sharp(req.file.buffer)
            .resize({ width: 426, height: 242 })
            .toFile(`./public/uploads/project/${filename}`);

        // update project
        await Project.findByIdAndUpdate(
            id,
            { $push: { gallery: `/uploads/project/${filename}` } }
        );

        res.redirect(`/admin/project/gallery/${id}`);
    } catch (error) {
        console.log(error);
        req.flash('red', error.message);
        res.redirect(`/admin/project/gallery/${id}`);
    }
});

// edit image
router.post('/gallery/:id/edit/:i', upload.single('image'), async (req, res) => {
    const { id, i } = req.params;
    try {
        const project = await Project.findById(id);
        const gallery = project.gallery;

        // upload file
        const filename = Date.now() + req.file.originalname.replace(" ", "");
        if (!fs.existsSync('./public/uploads/project')) {
            fs.mkdirSync('./public/uploads/project', { recursive: true });
        }
        await sharp(req.file.buffer)
            .resize({ width: 426, height: 242 })
            .toFile(`./public/uploads/project/${filename}`);

        // remove old file
        fs.remove(`public${gallery[i]}`, function (err) {
            if (err) { console.log(err); }
        });

        // update project
        gallery[i] = `/uploads/project/${filename}`;
        await project.save();

        res.redirect(`/admin/project/gallery/${id}`);
    } catch (error) {
        console.log(error.message);
        req.flash('red', error.message);
        res.redirect(`/admin/project/gallery/${id}`);
    }
});

// delete image
router.get('/gallery/:id/delete/:i', async (req, res) => {
    const { id, i } = req.params;
    try {
        const project = await Project.findById(id);

        // remove file
        fs.remove(`public${project.gallery[i]}`, function (err) {
            if (err) { console.log(err); }
        });

        // update project
        project.gallery = project.gallery.filter(e => e !== project.gallery[i]);
        await project.save();

        res.redirect(`/admin/project/gallery/${id}`);
    } catch (error) {
        console.log(error);
        req.flash('red', error.message);
        res.redirect(`/admin/project/gallery/${id}`);
    }
});

// GET project gallery
router.get('/gallery/:id', checkAdmin, async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);

        if (project == null) {
            req.flash('red', 'Project not found!');
            return res.redirect('/admin/project');
        }

        res.render('project_gallery', {
            project,
            image: req.admin.image
        });
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

// GET project by id
router.get('/:id', checkAdmin, async (req, res) => {
    try {
        const [project, orders, docs] = await Promise.all([
            Project.findById(req.params.id),
            Order.find({ project: req.params.id })
                .populate('project package user')
                .sort('-_id'),
            Order.aggregate([
                { $match: { project: mongoose.Types.ObjectId(req.params.id) } },
                {
                    $group: {
                        _id: '$package',
                        numberOfOrders: { $sum: 1 }
                    }
                },
                { $sort: { _id: 1 } },
                { $lookup: { from: 'packages', localField: '_id', foreignField: '_id', as: 'package' } }
            ])
        ])

        if (project == null) {
            req.flash('red', 'Project not found!');
            return res.redirect('/admin/project');
        }

        res.render('project_view', {
            project,
            orders,
            docs,
            image: req.admin.image
        });
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