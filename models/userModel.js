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
        lowercase: true,
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
    twofa: {
        type: Boolean,
        default: false,
    },
    phone: String,
    numberToVerify: String,
    phoneVerified: {
        type: Boolean,
        default: false,
    },
    youAre: {
        type: String,
        enum: ['business', 'retailer'],
        required: [true, 'validation.youAre'],
    },
    tvaNumber: String,
    enterprise: String,
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
    notifications: [{
        en: {
            title: String,
            message: String,
        },
        fr: {
            title: String,
            message: String,
        },
        date: {
            type: Date,
            default: Date.now,
        },
        read: {
            type: Boolean,
            default: false,
        },
    }],
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

// if phone / youAre is updated
userSchema.pre('findOneAndUpdate', async function (next) {
    if (this.getUpdate().phone || this.getUpdate().youAre) {
        const doc = await this.model.findOne(this.getQuery());
        if (this.getUpdate().phone) {
            if (this.getUpdate().phone !== doc.phone) doc.phoneVerified = false;
        }
        if (this.getUpdate().youAre) {
            if (
                this.getUpdate().youAre !== doc.youAre &&
                this.getUpdate().youAre == 'retailer'
            ) {
                doc.tvaNumber = undefined;
                doc.enterprise = undefined;
            }
        }
        await doc.save();
    }
    next();
});

// converting password into hash
userSchema.pre("save", async function (next) {
    if (this.isModified("password")) {
        if (this.password == undefined) {
            return next(createError.BadRequest('validation.pass'));
        }
        this.password = await bcrypt.hash(this.password, 10);
    }
    if (this.notifications.length == 0) {
        // add notifications
        this.notifications.push({
            en: {
                title: 'Greetings from investigo',
                message: 'We are delighted to have you join our community.',
            },
            fr: {
                title: 'Bienvenu chez Investigo',
                message: 'Nous sommes ravis que vous rejoigniez notre communauté.',
            }
        });
        this.notifications.push({
            en: {
                title: 'Please complete your profile',
                message: 'For security purposes, please keep your profile updated.',
            },
            fr: {
                title: 'Merci de compléter votre profil',
                message: 'Pour des raisons de sécurité, veuillez maintenir votre profil à jour.',
            },
        });
        this.notifications.push({
            en: {
                title: 'You are invited to verify your number',
                message: 'In order to keep your account secure, please confirm your number.',
            },
            fr: {
                title: 'Vous êtes invité à vérifier votre numéro de téléphone',
                message: 'Afin de sécuriser votre compte, veuillez confirmer votre numéro de téléphone.',
            },
        });
    }
    next();
});

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