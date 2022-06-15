const express = require('express');
const router = express.Router();
const createError = require('http-errors');

const checkUser = require('../middleware/authMiddleware');

const User = require('../models/usermodel');
const Package = require('../models/package');
const Project = require('../models/project');
const Category = require('../models/category');
const Blog = require('../models/blog');

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

module.exports = router;