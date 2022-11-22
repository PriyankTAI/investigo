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
    date: {
        type: Date,
        default: Date.now,
    },
    image: String,
});

module.exports = new mongoose.model('Event', eventSchema);
