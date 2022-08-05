const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require("jsonwebtoken");
const validator = require("validator");
const createError = require('http-errors');
const { authenticator } = require('otplib')

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
        required: [true, 'First name is required'],
    },
    lname: {
        type: String,
        required: [true, 'Last name is required'],
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        validate(value) {
            if (!validator.isEmail(value)) {
                throw new Error("Email is invalid")
            }
        }
    },
    password: {
        type: String,
        // required: [true, 'Password is required'],
        validate(value) {
            if (!validator.isLength(value, { min: 6, max: 1000 })) {
                throw Error("Password should be atleast 6 characters long.");
            }
        }
    },
    secret: String,
    twofa: {
        type: Boolean,
        default: false
    },
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
    date: {
        type: Date,
        default: Date.now()
    },
    blocked: {
        type: Boolean,
        default: false
    }
})

// generating tokens
userSchema.methods.generateAuthToken = async function () {
    try {
        const token = jwt.sign({ _id: this._id.toString() }, process.env.SECRET_KEY, { expiresIn: '90d' });
        return token;
    } catch (error) {
        createError.BadRequest(error);
        console.log("error: " + error);
    }
}

userSchema.methods.verifyCode = async function (code) {
    try {
        return authenticator.check(code, this.secret)
    } catch (error) {
        console.log("error: " + error);
        next(error);
    }
}

// converting password into hash
userSchema.pre("save", async function (next) {
    if (this.isModified("password")) {
        if (this.password == undefined) {
            return next(createError.BadRequest('Password is required.'));
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