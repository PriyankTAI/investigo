const express = require('express');
const router = express.Router();
// const createError = require('http-errors');

const User = require('../models/usermodel');

// GET admin dashboard
router.get('/', (req, res) => {
    res.render("dashboard",{
        title: "Dashboard",
    });
});
router.get('/user', async(req, res) => {
    const users = await User.find(); // exclude admin
    res.render("user",{
        title: "User Management",
        users
        

    });
});
module.exports = router;