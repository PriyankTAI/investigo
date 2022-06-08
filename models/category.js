const mongoose = require('mongoose');

// Category schema
const CategorySchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    featured: {
        type: Boolean,
        default: false
    },
    date: {
        type: Date,
        default: Date.now,
        required: true  
    }
});

module.exports = mongoose.model('Category', CategorySchema);