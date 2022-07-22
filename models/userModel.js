const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require("jsonwebtoken");
const validator = require("validator");
const createError = require('http-errors');

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
                throw Error("Length of the password should be between 6-1000");
            }
        }
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

// converting password into hash
userSchema.pre("save", async function (next) {
    if (this.isModified("password")) {
        this.password = await bcrypt.hash(this.password, 10);
    }
    next();
})

// pre validate trim value
userSchema.pre('validate', function (next) {
    if (this.name) {
        this.name = this.name.trim();
    }
    if (this.password) {
        this.password = this.password.trim();
    }
    next();
});
module.exports = new mongoose.model("User", userSchema);