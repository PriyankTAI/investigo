const express = require('express');
const router = express.Router();
const createError = require('http-errors');
const bcrypt = require('bcryptjs');
const { sendOtp } = require('../../helpers/sendEmail');

const checkUser = require('../../middleware/authMiddleware');

const User = require('../../models/usermodel');
const Otp = require('../../models/otpModel');

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
        res.status(200).json({ status: "success", token, user })
    } catch (error) {
        // console.log(error);
        next(error)
    }
})

// TODO: 
// if registered with method and tries another method
// 1. combine methods
// 2. show message to login with right method

// POST login
router.post("/login", async (req, res, next) => {
    try {
        const { email, password, googleId, facebookId } = req.body;
        const userExist = await User.findOne({ email });
        if (password) { // password
            if (!userExist) {
                return next(createError.BadRequest(`Invalid email or password.`));
            }
            if (!userExist.password) {
                if (userExist.googleId) {
                    return next(createError.BadRequest(`Please login with google.`));
                }
                if (userExist.facebookId) {
                    return next(createError.BadRequest(`Please login with facebook.`));
                }
            }
            const isMatch = await bcrypt.compare(password, userExist.password);
            if (!isMatch) {
                return next(createError.BadRequest(`Invalid email or password.`));
            }
            const token = await userExist.generateAuthToken();
            return res.status(200).json({ status: "success", token, user: userExist })
        } else if (googleId) { // google
            if (userExist) {
                if (!userExist.googleId) {
                    if (userExist.facebookId) {
                        return next(createError.BadRequest(`Please login with facebook.`));
                    }
                    if (userExist.password) {
                        return next(createError.BadRequest(`Please login with email and password.`));
                    }
                }
                const token = await userExist.generateAuthToken();
                return res.status(200).json({ status: "success", token, user: userExist })
            } else {
                const user = new User({
                    name: req.body.name,
                    email: req.body.email,
                    googleId
                })
                const token = await user.generateAuthToken();
                await user.save();
                return res.status(200).json({ status: "success", token, user })
            }
        } else if (facebookId) { // facebook
            if (userExist) {
                if (!userExist.facebookId) {
                    if (userExist.googleId) {
                        return next(createError.BadRequest(`Please login with google.`));
                    }
                    if (userExist.password) {
                        return next(createError.BadRequest(`Please login with email and password.`));
                    }
                }
                const token = await userExist.generateAuthToken();
                return res.status(200).json({ status: "success", token, user: userExist })
            } else {
                const user = new User({
                    name: req.body.name,
                    email: req.body.email,
                    facebookId
                })
                const token = await user.generateAuthToken();
                await user.save();
                return res.status(200).json({ status: "success", token, user })
            }
        } else {
            return next(createError.BadRequest(`Please provide password, googleId or facebookId.`));
        }
    } catch (error) {
        console.log(error.message);
        next(error);
    }
})

// POST Change Pass
router.post("/changepass", checkUser, async (req, res, next) => {
    try {
        const user = req.user;
        // if (user == null) {
        //     return next(createError.BadRequest(`Please login first`));
        // }
        if (!user.password) {
            if (user.googleId) {
                return next(createError.BadRequest(`You are a google user can not change password!`));
            }
            if (user.facebookId) {
                return next(createError.BadRequest(`You are a facebook user can not change password!`));
            }
        }
        const { currentpass, newpass, cfnewpass } = req.body;
        if (!currentpass || currentpass.length < 6) {
            return next(createError.BadRequest(`Password should be atleast 6 characters long`));
        }
        if (!newpass || newpass.length < 6) {
            return next(createError.BadRequest(`New Password should be atleast 6 characters long`));
        }
        if (!cfnewpass || cfnewpass.length < 6) {
            return next(createError.BadRequest(`Confirm Password should be atleast 6 characters long`));
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
        console.log(error.message);
        next(error);
    }
})

// POST forgot pass
router.post("/forgot", async (req, res, next) => {
    try {
        const email = req.body.email;
        const user = await User.findOne({ email });
        if (user == null) {
            return next(createError.BadRequest(`Please enter registerd email`));
        }

        let otp = await Otp.findOne({ userId: user._id });
        if (!otp) {
            var digits = '0123456789';
            let generated = '';
            for (let i = 0; i < 6; i++) {
                generated += digits[Math.floor(Math.random() * 10)];
            }
            otp = await new Otp({
                userId: user.id,
                otp: generated
            }).save();
        }
        sendOtp(user.email, otp.otp);
        return res.status(200).json({
            status: "success",
            email: user.email,
            otp: otp.otp
        });
    } catch (error) {
        console.log(error);
        next(error);
    }
})

// POST reset password
router.post("/reset_pass", async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (user == null) {
            return next(createError.BadRequest(`Please enter registerd email`));
        }
        user.password = password;
        await user.save();
        return res.status(200).json({ status: "success", message: "Password changed successfully" });
    } catch (error) {
        console.log(error);
        next(error);
    }
})

module.exports = router;