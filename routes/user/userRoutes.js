const router = require('express').Router();
const createError = require('http-errors');
const customId = require("custom-id");
const multilingual = require('../../helpers/multilingual');

// const checkUser = require('../../middleware/authMiddleware');

// const User = require('../../models/userModel');
const Package = require('../../models/packageModel');
const Project = require('../../models/projectModel');
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
        let packages = await Package.find().select('-__v');
        packages = packages.map(el => multilingual(el, req));

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
        let projects = await Project.find().select('-__v').sort('-_id');
        projects = projects.map(el => multilingual(el, req));

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

// GET project by id
router.get('/project/:id', async (req, res, next) => {
    try {
        let project = await Project.findById(req.params.id).select('-__v');
        project = multilingual(project, req);

        if (project == null) {
            return next(createError.NotFound('Project not found.'))
        }
        res.json({
            status: "success",
            project
        })
    } catch (error) {
        if (error.name == 'CastError') {
            return next(createError.NotFound(`Project not found.`));
        }
        console.log(error.message);
        next(error);
    }
})

// GET all blogs
router.get('/blog', async (req, res, next) => {
    try {
        let blogs = await Blog.find()
            .select('-content -tags -creator -__v')
            .sort('-_id');
        blogs = blogs.map(el => multilingual(el, req));

        const counts = {};
        for (const el of blogs) {
            counts[el.category] = counts[el.category] ? counts[el.category] + 1 : 1;
        }

        res.json({
            status: "success",
            total: blogs.length,
            blogs,
            counts
        });
    } catch (error) {
        console.log(error);
        next(error);
    }
});

// GET a blog with id
router.get('/blog/:id', async (req, res, next) => {
    try {
        let blog = await Blog.findById(req.params.id)
            .populate('creator', 'image name facebook twitter instagram linkedin')
            .select('-__v');

        if (blog == null)
            return next(createError.NotFound(`Blog not found.`));

        blog = multilingual(blog, req);

        res.json({
            status: "success",
            blog
        });
    } catch (error) {
        if (error.name == 'CastError')
            return next(createError.NotFound(`Blog not found.`));
        console.log(error.message);
        next(error);
    }
});

// POST add newsletter
router.post('/newsletter', async (req, res, next) => {
    try {
        const { email } = req.body;
        const emailExist = await Newsletter.findOne({ email });
        if (emailExist)
            return next(createError.BadRequest('email is already in our newsletter list.'));

        await Newsletter.create({ email });
        res.status(201).json({
            status: 'success',
            message: 'Email added to our newsletter list.'
        });
    } catch (error) {
        console.log(error);
        next(error);
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
        const application = new Application({
            fname: req.body.fname,
            lname: req.body.lname,
            email: req.body.email,
            phone: req.body.phone,
            resume: fileName
        })
        await application.save();

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