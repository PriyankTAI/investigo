var mongoose = require('mongoose');

//package schema
var packageSchema = mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Title is required'],
        unique: true,
    },
    description: {
        type: String
    },
    price: {
        type: String,
        required: [true, 'Price is required'],
    },
    image: {
        type: String
    },
    date: {
        type: Date,
        default: Date.now,
        required: true
    }
});

module.exports = new mongoose.model("Package", packageSchema);
