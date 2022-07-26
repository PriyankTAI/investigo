const mongoose = require('mongoose');

const sectorSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    date: {
        type: Date,
        default: Date.now
    }
});


// pre validate trim value
sectorSchema.pre('validate', function (next) {
    if (this.name) {
        this.name = this.name.trim();
    }
    next();
});

module.exports = mongoose.model('sector', sectorSchema);