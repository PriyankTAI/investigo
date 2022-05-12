const express = require('express');
const router = express.Router();
const createError = require('http-errors');
const bcrypt = require('bcryptjs');
const checkUser = require('../middleware/authMiddleware');

const User = require('../models/usermodel');

// POST register
router.post("/register", async (req, res, next) => {
    try {
        const userExist = await User.findOne({ email: req.body.email })
        if (userExist && userExist.googleid) {
            userExist.password = req.body.password;
            await userExist.save();
            return res.status(200).json({
                status: "success",
                message: "google user, password added"
            })
        }
        if (userExist) {
            return next(createError.BadRequest(`email already registered`));
        }
        const user = new User({
            name: req.body.name,
            email: req.body.email,
            password: req.body.password,
            phone: req.body.phone
        })
        const token = await user.generateAuthToken();
        await user.save();
        res.status(200).json({ status: "success", token })
    } catch (error) {
        // console.log(error);
        next(error)
    }
})

// POST login
router.post("/login", async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const userExist = await User.findOne({ email });
        if (!userExist) {
            return next(createError.BadRequest(`Invalid  email or password`));
        }
        if (!userExist.password) {
            return next(createError.BadRequest(`Please login with google`));
        }
        const isMatch = await bcrypt.compare(password, userExist.password);
        if (!isMatch) {
            return next(createError.BadRequest(`Invalid  email or password`));
        }
        const token = await userExist.generateAuthToken();
        res.status(200).json({ status: "success", token })
    } catch (error) {
        console.log(error);
        next(error);
    }
})

// POST Change Pass
router.post("/changepass", checkUser, async (req, res, next) => {
    try {
        const user = req.user;
        if (user == null) {
            return next(createError.BadRequest(`Please login first`));
        }
        const { currentpass, newpass, cfnewpass } = req.body;
        if (!currentpass || currentpass.length < 6) {
            return next(createError.BadRequest(`Invalid current password`));
        }
        if (!newpass || newpass.length < 6) {
            return next(createError.BadRequest(`Invalid new password`));
        }
        if (!cfnewpass || cfnewpass.length < 6) {
            return next(createError.BadRequest(`Invalid confirm password`));
        }
        const isMatch = await bcrypt.compare(currentpass, user.password);
        if (!isMatch) {
            return next(createError.BadRequest(`Wrong current password`));
        }
        if (currentpass == newpass) {
            return next(createError.BadRequest(`New password can not be same as current password`));
        }
        if (newpass != cfnewpass) {
            return next(createError.BadRequest(`Password and confirm password do not match`));
        }
        user.password = newpass;
        await user.save();
        return res.status(200).json({
            status: "success",
            message: "password updated"
        });
    } catch (error) {
        console.log(error);
        next(error)
    }
})

module.exports = router;