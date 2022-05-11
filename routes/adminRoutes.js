const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
// const createError = require('http-errors');

const User = require('../models/usermodel');
const Admin = require('../models/adminmodel');

// GET admin dashboard
router.get('/', (req, res) => {
    res.render("dashboard", {
        title: "Dashboard",
    });
});


// GET admin login
router.get('/login', (req, res) => {
    res.render("login", {
        title: "Login",
    });
});

// POST login
router.post("/login",async (req, res) => {
    try {
        const { email, password } = req.body;
        const adminExist = await Admin.findOne({ email });
        if (!adminExist) {
            req.flash('red', 'Invalid email or password!');
            return res.redirect('/admin/login');
        }
        const isMatch = await bcrypt.compare(password, adminExist.password);
        if (!isMatch) {
            req.flash('red', 'Invalid email or password!');
            return res.redirect('/admin/login');
        }
        const token = await adminExist.generateAuthToken();
        res.cookie("jwtAdmin", token, {
            expires: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
            httpOnly: true,
            // secure:true
        });
        // req.flash('green', 'success!');
        res.redirect('/admin');
    } catch (error) {
        console.log(error);
        res.status(400).send(error.message);
    }
})


// GET logout
router.get("/logout", async (req, res) => {
    res.clearCookie("jwtAdmin");
    res.redirect('/admin/login');
})


// Get all user
router.get('/user', async (req, res) => {
    const users = await User.find(); // exclude admin
    res.render("user", {
        title: "User Management",
        users


    });
});
module.exports = router;