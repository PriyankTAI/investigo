const mongoose = require('mongoose');

const withdrawSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User'
    },
    order: {
        type: mongoose.Schema.ObjectId,
        ref: 'Order',
        required: [true, 'Withdraw request must belong to a order.'],
        unique: true
    },
    amount: Number,
    date: {
        type: Date,
        default: Date.now()
    },
    paymentMethod: {
        type: mongoose.Schema.ObjectId,
        ref: 'PaymentMethod'
    }
});

module.exports = new mongoose.model("Withdraw", withdrawSchema);