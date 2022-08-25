const mongoose = require('mongoose');

// page schema
const pageSchema = mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Title is required'],
        unique: true,
    },
    content: {
        type: String,
        // required:true
    },
});

module.exports = new mongoose.model("Page", pageSchema);
