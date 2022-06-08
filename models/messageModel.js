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
        validate(value) {
            if (!validator.isEmail(value)) {
                throw new Error("Email is invalid")
            }
        }
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

// pre validate trim value
messageSchema.pre('validate', function (next) {
    if (this.name) {
        this.name = this.name.trim();
    }
    if (this.message) {
        this.message = this.message.trim();
    }
    next();
});
module.exports = new mongoose.model("Message", messageSchema);