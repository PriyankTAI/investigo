const mongoose = require('mongoose');

// blog schema
const blogSchema = mongoose.Schema({
    // category: {
    //     type: mongoose.Schema.ObjectId,
    //     ref: 'Category',
    //     required: true,
    // },
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
    content: {
        type: String,
        required: true,
    },
    tags: [{
        type: String
    }],
    date: {
        type: Date,
        default: Date.now,
        required: true
    }
});

module.exports = mongoose.model('Blog', blogSchema);