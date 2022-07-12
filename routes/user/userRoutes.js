const express = require('express');
const router = express.Router();
const createError = require('http-errors');
const customId = require("custom-id");

const checkUser = require('../../middleware/authMiddleware');

const User = require('../../models/usermodel');
const Package = require('../../models/packageModel');
const Project = require('../../models/projectModel');
const Category = require('../../models/categoryModel');
const Blog = require('../../models/blogModel');
const Newsletter = require('../../models/newsletterModel');
const Application = require('../../models/applicationModel');

// multer
const multer = require('multer');
const fs = require('fs-extra');
const storage = multer.memoryStorage();
const fileFilter = (req, file, cb) => {
    // reject a file
    if (file.mimetype === 'application/pdf' || file.mimetype === 'application/msword' || file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        cb(null, true);
    } else {
        cb(createError.BadRequest('Wrong file type! (Please upload only pdf, doc or docx)'), false);
    }
};
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 1024 * 1024 * 5
    },
    fileFilter: fileFilter
});

// GET all packages
router.get('/package', async (req, res, next) => {
    try {
        const packages = await Package.find().select('-__v');
        res.json({
            status: "success",
            total: packages.length,
            packages
        });
    } catch (error) {
        console.log(error);
        next(error);
    }
})

// GET all projects
router.get('/project', async (req, res, next) => {
    try {
        const projects = await Project.find().select('-__v');
        res.json({
            status: "success",
            total: projects.length,
            projects
        })
    } catch (error) {
        console.log(error);
        next(error)
    }
})

// GET all category
router.get('/category', async (req, res, next) => {
    try {
        const categories = await Category.find().select('-__v');
        res.json({
            status: "success",
            total: categories.length,
            categories
        });
    } catch (error) {
        console.log(error);
        next(error);
    }
})

// GET all blogs
router.get('/blog', async (req, res, next) => {
    try {
        const blogs = await Blog.find().populate('category', '-date -__v').select('-__v');
        res.json({
            status: "success",
            total: blogs.length,
            blogs
        })
    } catch (error) {
        console.log(error);
        next(error)
    }
})

// GET a blog with id
router.get('/blog/:id', async (req, res, next) => {
    try {
        const blog = await Blog.findById(req.params.id).select('-__v');
        if (blog == null) {
            return next(createError.BadRequest(`Blog not found.`));
        }
        res.json({
            status: "success",
            blog
        })
    } catch (error) {
        console.log(error.message);
        if (error.name == 'CastError') {
            return next(createError.BadRequest(`Blog not found.`));
        }
        next(error)
    }
})

// GET add interest
router.get('/interest/add/:id', checkUser, async (req, res, next) => {
    try {
        const p = await Project.findById(req.params.id);
        if (p == null) {
            // given id is not a project
            // console.log(`Invalid project id: ${id}`);
            return next(createError.BadRequest(`Please provide valid project id.`));
        }
        const user = await User.findById(req.user.id);
        if (!user.interest.includes(req.params.id)) {
            user.interest.push(req.params.id);
            await user.save();
        }
        res.json({
            status: 'success',
            interest: user.interest
        })
    } catch (error) {
        console.log(error.message);
        if (error.name == 'CastError') {
            return next(createError.BadRequest(`Please provide valid project id.`));
        }
        next(error)
    }
})

// GET remove interest
router.get('/interest/remove/:id', checkUser, async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);
        user.interest = user.interest.filter((value) => value != req.params.id);
        await user.save();
        res.json({
            status: 'success',
            interest: user.interest
        })
    } catch (error) {
        console.log(error.message);
        if (error.name == 'CastError') {
            return next(createError.BadRequest(`Please provide valid project id.`));
        }
        next(error)
    }
})

// POST add newsletter
router.post('/newsletter', async (req, res, next) => {
    try {
        const { email } = req.body;
        const emailExist = await Newsletter.findOne({ email });
        if (emailExist) {
            return next(createError.BadRequest('email is already in our newsletter list.'));
        }
        await Newsletter.create({ email });
        res.status(201).json({
            status: 'success',
            message: 'Email added to our newsletter list.'
        })
    } catch (error) {
        console.log(error);
        next(error)
    }
})

// POST application
router.post('/application', upload.single('resume'), async (req, res, next) => {
    try {
        if (req.file == undefined) {
            return next(createError.BadRequest('Please provide resume.'));
        }
        const fileName = '/uploads/resume/' + customId({ randomLength: 1 }) + '_' + req.file.originalname;
        const path = './public' + fileName;
        const message = new Application({
            fname: req.body.fname,
            lname: req.body.lname,
            email: req.body.email,
            phone: req.body.phone,
            resume: fileName
        })
        await message.save();

        // save resume to file
        if (!fs.existsSync('./public/uploads/resume')) {
            fs.mkdirSync('./public/uploads/resume', { recursive: true });
        }
        fs.writeFileSync(path, req.file.buffer);

        res.status(201).json({
            status: "success",
            message: "Application registerd successfully"
        });
    } catch (error) {
        console.log(error.message);
        next(error);
    }
})

module.exports = router;