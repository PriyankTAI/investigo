const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
    en: {
        name: String,
        description: String,
    },
    fr: {
        name: String,
        description: String,
    },
    project: {
        type: mongoose.Schema.ObjectId,
        ref: 'Project',
    },
    forBenefits: {
        type: Boolean,
        default: false,
    },
    date: {
        type: Date,
        default: Date.now,
    }
});

module.exports = new mongoose.model("Event", eventSchema);