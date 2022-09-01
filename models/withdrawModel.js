const mongoose = require('mongoose');

const withdrawSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User'
    },
    order: {
        type: mongoose.Schema.ObjectId,
        ref: 'Order'
    },
    amount: Number,
    date: {
        type: Date,
        default: Date.now()
    },
    paymentMethod: String // change as requirement
})

module.exports = new mongoose.model("Withdraw", withdrawSchema);