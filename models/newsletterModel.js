const mongoose = require("mongoose");
const validator = require("validator");

const newsletterSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, "Please provide email."],
        unique: true,
        validate(value) {
            if (!validator.isEmail(value)) {
                throw new Error("Email is invalid")
            }
        }
    },
    date: {
        type: Date,
        default: Date.now,
    },
});

module.exports = new mongoose.model("Newsletter", newsletterSchema);
