const mongoose = require('mongoose');

// Category schema
const categorySchema = mongoose.Schema({
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


// pre validate trim value
categorySchema.pre('validate', function (next) {
    if (this.name) {
        this.name = this.name.trim();
    }
    next();
});

module.exports = mongoose.model('Category', categorySchema);