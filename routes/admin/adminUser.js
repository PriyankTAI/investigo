const express = require('express');
const router = express.Router();

const checkAdmin = require('../../middleware/authAdminMiddleware');

const User = require('../../models/userModelRenameErr');

// Get all user
router.get('/', checkAdmin, async (req, res) => {
    const users = await User.find();
    res.render("user", {
        users,
        image: req.admin.image
    });
});

// GET user by id
router.get('/:id', checkAdmin, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (user == null) {
            req.flash('red', 'User not found!');
            return res.redirect('/admin/user');
        }
        res.render('user_view', {
            user,
            image: req.admin.image
        })
    } catch (error) {
        if (error.name === 'CastError') {
            req.flash('red', `User not found!`);
        } else {
            console.log(error);
            req.flash('red', error.message);
        }
        res.redirect('/admin/user');
    }
})

// block user
router.get('/block/:id', checkAdmin, async (req, res) => {
    try {
        const id = req.params.id;
        const user = await User.findByIdAndUpdate(id, { blocked: true });
        req.flash('green', `'${user.name}' blocked Successfully.`);
        res.redirect('/admin/user');
    } catch (error) {
        if (error.name === 'CastError' || error.name === 'TypeError') {
            req.flash('red', `User not found!`);
        } else {
            console.log(error);
            req.flash('red', error.message);
        }
        res.redirect('/admin/user');
    }
})

// unblock user
router.get('/unblock/:id', checkAdmin, async (req, res) => {
    try {
        const id = req.params.id;
        const user = await User.findByIdAndUpdate(id, { blocked: false });
        req.flash('green', `'${user.name}' unblock successfully.`);
        res.redirect('/admin/user');
    } catch (error) {
        if (error.name === 'CastError' || error.name === 'TypeError') {
            req.flash('red', `User not found!`);
        } else {
            console.log(error);
            req.flash('red', error.message);
        }
        res.redirect('/admin/user');
    }
})

module.exports = router;
