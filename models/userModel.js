const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require("jsonwebtoken");
const validator = require("validator");
const createError = require('http-errors');
const { authenticator } = require('otplib');

const userSchema = new mongoose.Schema({
    googleId: String,
    facebookId: String,
    userId: {
        type: String,
        unique: true
    },
    national: {
        type: String,
        unique: true,
        sparse: true
    },
    fname: {
        type: String,
        required: [true, 'validation.fname'],
    },
    lname: {
        type: String,
        required: [true, 'validation.lname'],
    },
    email: {
        type: String,
        required: [true, 'validation.email'],
        unique: true,
        validate(value) {
            if (!validator.isEmail(value)) {
                throw new Error("validation.emailInvalid")
            }
        }
    },
    password: {
        type: String,
        validate(value) {
            if (!validator.isLength(value, { min: 6, max: 1000 })) {
                throw Error("validation.passInvalid");
            }
        }
    },
    lastLogin: Date,
    tokens: [{
        token: String,
        device: {
            type: String,
            required: [true, 'validation.device'],
        },
        date: {
            type: Date,
            default: Date.now
        }
    }],
    secret: String,
    recoveryCode: String,
    twofa: Boolean,
    // twofa: {
    //     enabled: Boolean,
    //     type: {
    //         type: String,
    //         enum: ['app', 'otp']
    //     }
    // },
    phone: String,
    youAre: {
        type: String,
        enum: ['particular', 'individual']
    },
    image: String,
    instagram: String,
    linkedin: String,
    website: String,
    announcements: Boolean,
    feedback: Boolean,
    // paymentMethod: [{
    //     type: mongoose.Schema.ObjectId,
    //     ref: 'PaymentMethod',
    // }],
    date: {
        type: Date,
        default: Date.now()
    },
    blocked: {
        type: Boolean,
        default: false
    }
});

// generating tokens
userSchema.methods.generateAuthToken = async function (device) {
    try {
        const token = jwt.sign(
            { _id: this._id.toString() },
            process.env.SECRET_KEY,
            { expiresIn: '90d' }
        );
        this.tokens = this.tokens.concat({ token, device });
        this.lastLogin = Date.now();
        await this.save();
        return token;
    } catch (error) {
        // console.log(error);
        throw createError.BadRequest(error);
    }
}

// verify 2fa code
userSchema.methods.verifyCode = function (code) {
    try {
        return authenticator.check(code, this.secret);
    } catch (error) {
        // console.log(error);
        createError.BadRequest(error);
    }
}

// converting password into hash
userSchema.pre("save", async function (next) {
    if (this.isModified("password")) {
        if (this.password == undefined) {
            return next(createError.BadRequest('validation.pass'));
        }
        this.password = await bcrypt.hash(this.password, 10);
    }
    next();
})

// pre validate trim value
userSchema.pre('validate', function (next) {
    if (this.fname) {
        this.fname = this.fname.trim();
    }
    if (this.lname) {
        this.lname = this.lname.trim();
    }
    if (this.password) {
        this.password = this.password.trim();
    }
    next();
});

module.exports = new mongoose.model("User", userSchema);