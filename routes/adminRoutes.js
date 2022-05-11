const express = require('express');
const router = express.Router();
// const createError = require('http-errors');

// const User = require('../models/usermodel');

// GET admin dashboard
router.get('/', (req, res) => {
    res.render("dashboard");
});

module.exports = router;