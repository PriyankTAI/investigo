const mongoose = require('mongoose');
const validator = require("validator");

const messageSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        validate(value) {
            if (!validator.isEmail(value)) {
                throw new Error("email is invalid")
            }
        }
    },
    address: {
        type: String,
        required: [true, 'Address is required'],
    },
    phone: {
        type:String,
        required: [true, 'Number is required'],
    },
    message: {
        type: String,
        required: [true, 'Message is required'],
    },
    date: {
        type: Date,
        default: Date.now()
    }
})

module.exports = new mongoose.model("Message", messageSchema);