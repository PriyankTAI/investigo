const mongoose = require('mongoose');

const testSchema = new mongoose.Schema({
    en: {
        title: {
            type: String,
            required: [true, 'English title is required'],
        },
        content: String,
    },
    fr: {
        title: {
            type: String,
            required: [true, 'French title is required'],
        },
        content: String,
    },
    image: String
});

module.exports = mongoose.model("Test", testSchema);

// Test.create({
//     en: {
//         title: 'English title 2',
//         content: 'English content 2'
//     },
//     fr: {
//         title: 'Frech title 2',
//         content: 'Frech content 2'
//     },
//     image: 'image url'
// })
