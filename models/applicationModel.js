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

module.exports = new mongoose.model("application", applicationSchema);