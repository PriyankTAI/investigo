var mongoose = require('mongoose');

//page schema
var pageSchema = mongoose.Schema({
    title: {
        type: String,
        required: true,
        unique: true,
    },
    content: {
        type: String,
        // required:true
    },
});

module.exports = new mongoose.model("Page", pageSchema);
