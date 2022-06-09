const express = require('express');
const category = require('../models/category');
const router = express.Router();

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

module.exports = router;