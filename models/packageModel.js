var mongoose = require('mongoose');

//package schema
var packageSchema = mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Title is required'],
        unique: true,
    },
    description: {
        type: String,
        required: [true, 'Description is required'],
    },
    price: {
        type: Number,
        required: [true, 'Price is required'],
    },
    dailyReturn: {
        type: Number,
        required: [true, 'Daily return is required']
    },
    monthlyReturn: {
        type: Number,
        required: [true, 'Monthly return is required']
    },
    annualReturn: {
        type: Number,
        required: [true, 'Annual return is required']
    },
    term: {
        type: Number,
        required: [true, 'Term is required']
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

module.exports = new mongoose.model("Package", packageSchema);
