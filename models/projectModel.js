var mongoose = require('mongoose');

// project schema
var projectSchema = mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Title is required'],
    },
    description: {
        type: String,
        required: [true, 'Description is required'],
    },
    category: {
        type: String,
        required: [true, 'Catogory is required'],
    },
    property: {
        type: String,
        required: [true, 'Property type is required'],
    },
    totalAmount: {
        type: Number,
        required: [true, 'Total amount is required'],
    },
    invested: {
        type: Number,
        default: 0
    },
    investors: {
        type: Number,
        default: 0
    },
    image: {
        type: String,
        required: [true, 'Image is required'],
    },
    location: {
        type: String,
        required: [true, 'Location is required'],
    },
    // lat long
    date: {
        type: Date,
        default: Date.now,
        required: true
    }
});

module.exports = new mongoose.model("Project", projectSchema);
