const mongoose = require("mongoose");

const newsletterSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, "Please provide email."],
        unique: true,
    },
    date: {
        type: Date,
        default: Date.now,
    },
});

module.exports = new mongoose.model("Newsletter", newsletterSchema);
