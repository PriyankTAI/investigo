const mongoose = require('mongoose');

// blog schema
const blogSchema = mongoose.Schema({
    category: {
        type: String,
        required: true
    },
    title: {
        type: String,
        required: true,
    },
    image: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    contentFr: String,
    content: {
        type: String,
        required: true,
    },
    tags: [{
        type: String
    }],
    creator: {
        type: mongoose.Schema.ObjectId,
        ref: 'Admin',
        required: true
    },
    date: {
        type: Date,
        default: Date.now,
        required: true
    }
});

module.exports = mongoose.model('Blog', blogSchema);