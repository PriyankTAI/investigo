var mongoose = require('mongoose');

//project schema
var projectSchema = mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Title is required'],
    },
    sector: {
        type: mongoose.Schema.ObjectId,
        ref: 'Sector',
        required: true,
    },
    description: {
        type: String,
        required: [true, 'Description is required'],
    },
    locations: [{
        type: String
    }],
    totalAmount: {
        type: Number,
        // required: [true, 'Total amount is required'],
    },
    invested: {
        type: Number,
        default: 0
    },
    image: {
        type: String,
        required: [true, 'Image is required'],
    },
    date: {
        type: Date,
        default: Date.now,
        required: true
    }
});

module.exports = new mongoose.model("Project", projectSchema);
