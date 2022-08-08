const router = require('express').Router();
const createError = require('http-errors');
const bcrypt = require('bcryptjs');
const customId = require("custom-id");
const { authenticator } = require('otplib') // generate totp
const QRCode = require('qrcode') // change url to qr
const { sendOtp } = require('../../helpers/sendEmail');

const checkUser = require('../../middleware/authMiddleware');

const User = require('../../models/userModel');
const Otp = require('../../models/otpModel');

// POST register
router.post("/register", async (req, res, next) => {
    try {
        const userExist = await User.findOne({ email: req.body.email })
        if (userExist && (userExist.googleid || userExist.facebookId)) {
            userExist.password = req.body.password;
            await userExist.save();
            return res.status(200).json({
                status: "success",
                message: "google/facebook user, password added"
            })
        }
        if (userExist) {
            return next(createError.BadRequest(`email already registered`));
        }
        const id = customId({});
        const user = new User({
            fname: req.body.fname,
            lname: req.body.lname,
            email: req.body.email,
            password: req.body.password,
            userId: id,
            youAre: req.body.youAre
        })
        const token = await user.generateAuthToken();
        await user.save();
        res.status(200).json({ status: "success", token, user })
    } catch (error) {
        console.log(error.message);
        if (error.keyValue && error.keyValue.userId) {
            return next(createError.InternalServerError('An error occured. Please try again.'));
        }
        next(error);
    }
})

// NOTE:
// if registered with method and tries another method
// 1. combine methods (not safe)
// 2. show message to login with right method (current)

// POST login
router.post("/login", async (req, res, next) => {
    try {
        const { email, password, googleId, facebookId } = req.body;
        const userExist = await User.findOne({ email }).select('-__v');
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
            if (userExist.twofa) {
                return res.status(200).json({ status: "success", message: "Two Factor Authentication required." });
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
                if (userExist.googleId != googleId) {
                    return next(createError.BadRequest(`Invalid google id.`));
                }
                const token = await userExist.generateAuthToken();
                return res.status(200).json({ status: "success", token, user: userExist })
            } else {
                const id = customId({});
                const user = new User({
                    fname: req.body.fname,
                    lname: req.body.lname,
                    email: req.body.email,
                    userId: id,
                    googleId,
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
                if (userExist.facebookId != facebookId) {
                    return next(createError.BadRequest(`Invalid facebook id.`));
                }
                const token = await userExist.generateAuthToken();
                return res.status(200).json({ status: "success", token, user: userExist })
            } else {
                const id = customId({});
                const user = new User({
                    fname: req.body.fname,
                    lname: req.body.lname,
                    email: req.body.email,
                    userId: id,
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
        if (error.keyValue && error.keyValue.userId) {
            return next(createError.InternalServerError('An error occured. Please try again.'));
        }
        next(error);
    }
})

// POST login 2fa
router.post("/two-factor-login", async (req, res, next) => {
    try {
        const { email, code } = req.body;
        const user = await User.findOne({ email });
        if (!user.secret) {
            return next(createError.BadRequest("Two factor authentication is not enabled!"));
        }

        const verify = await user.verifyCode(code);
        if (!verify)
            return res.status(401).json({
                status: "fail",
                message: "Fail to verify code!"
            });

        const token = await user.generateAuthToken();
        return res.status(200).json({ status: "success", token, user });
    } catch (error) {
        console.log(error);
        next(error);
    }
})

// POST Change Pass
router.post("/changepass", checkUser, async (req, res, next) => {
    try {
        const user = req.user;
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
        return res.status(200).json({
            status: "success",
            message: "Password changed successfully"
        });
    } catch (error) {
        console.log(error);
        next(error);
    }
})

// create secret and return qrcode
router.get('/get-2fa-qr', checkUser, async (req, res, next) => {
    try {
        if (req.user.twofa)
            return res.status(401).json({
                status: "fail",
                message: "Two factor authentication already enabled."
            });

        const email = req.user.email;
        const secret = authenticator.generateSecret();

        // update and store secret in user
        await User.findByIdAndUpdate(req.user.id, { secret });

        // generate qr
        QRCode.toDataURL(authenticator.keyuri(email, 'Investigo', secret), (err, url) => {
            if (err) {
                console.log(err);
                return next(createError.InternalServerError());
            }

            res.json({ url });
        })
    } catch (error) {
        console.log(error);
        next(error);
    }
})

// enable 2fa
router.post('/enable-2fa', checkUser, async (req, res, next) => {
    try {
        const user = req.user;

        if (user.twofa)
            return res.status(401).json({
                status: "fail",
                message: "Two factor authentication already enabled."
            });

        console.log(req.body.code);
        const verify = await user.verifyCode(req.body.code);

        if (!verify)
            return res.status(401).json({
                status: "fail",
                message: "Fail to verify code!"
            });

        user.twofa = true;
        await user.save();

        return res.json({
            status: "Success",
            message: "Two factor authentication enabled."
        });
    } catch (error) {
        console.log(error);
        next(error);
    }
})

module.exports = router;