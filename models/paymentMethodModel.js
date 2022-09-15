const mongoose = require('mongoose');

const paymentMethodSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
    },
    card: {
        type: String,
        required: [true, "Card number is required."]
    },
    network: {
        type: String,
        required: [true, "Card network is required."]
    },
    expiry: {
        type: String,
        required: [true, "Expiry date is required."]
    }

})

module.exports = mongoose.model("PaymentMethod", paymentMethodSchema);