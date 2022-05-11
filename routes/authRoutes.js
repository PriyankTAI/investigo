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
            // console.log(userExist.googleid);
            userExist.password = req.body.password;
            await userExist.save();
            return res.status(200).json("success")
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
        res.status(200).json({status: "success",token})
    } catch (error) {
        console.log(error);
        res.status(500).send(error);
    }
})

// POST login
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        const userExist = await User.findOne({ email });
        if (!userExist) {
            return res.status(201).json('Invalid email or password!');
        }
        if (!userExist.password) {
            return res.status(201).json('Please login with google.');
        }
        const isMatch = await bcrypt.compare(password, userExist.password);
        if (!isMatch) {
            return res.status(201).json('Invalid email or password!');
        }
        const token = await userExist.generateAuthToken();
        res.status(200).json({status: "success",token})
    } catch (error) {
        console.log(error);
        res.status(400).send(error.message);
    }
})

// POST Change Pass
router.post("/changepass",checkUser, async (req, res) => {
    try {
        const user = req.user;
        console.log(req.user);
        if (user == null) {
            return res.status(201).json('Please login first.');
        }
        const { currentpass, newpass, cfnewpass } = req.body;
        if (!currentpass || currentpass.length < 6) {
            return res.status(201).json('Invalid current password');
        }
        if (!newpass || newpass.length < 6) {
            return res.status(201).json('Invalid new password');
        }
        if (!cfnewpass || cfnewpass.length < 6) {
            return res.status(201).json('Invalid confirm password');
        }
        const isMatch = await bcrypt.compare(currentpass, user.password);
        if (!isMatch) {
            return res.status(201).json('wrong current password');
            
        }
        if (currentpass == newpass) {
            return res.status(201).json('New password can not be same as current password');
            
        }
        if (newpass != cfnewpass) {
            return res.status(201).json('Password and confirm password does not match!');
            
        }
        user.password = newpass;
        await user.save();
        return res.status(200).json('Password updated');
    } catch (error) {
        if (error) {
            console.log(error);
            res.json(error)
        }
    }
})

module.exports = router;