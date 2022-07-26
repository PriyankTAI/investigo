const mongoose = require('mongoose');
const validator = require("validator");

const applicationSchema = new mongoose.Schema({
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
        validate(value) {
            if (!validator.isEmail(value)) {
                throw new Error("Email is invalid")
            }
        }
    },
    phone: {
        type: String,
        required: [true, 'Phone is required'],
    },
    resume: {
        type: String
    },
    date: {
        type: Date,
        default: Date.now()
    }
})

// pre validate trim value
applicationSchema.pre('validate', function (next) {
    if (this.fname) {
        this.fname = this.fname.trim();
    }
    if (this.lname) {
        this.lname = this.lname.trim();
    }
    if (this.phone) {
        this.phone = this.phone.trim();
    }
    next();
});

module.exports = new mongoose.model("application", applicationSchema);