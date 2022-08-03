const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
    },
    package: {
        type: mongoose.Schema.ObjectId,
        ref: 'Package',
        required: [true, 'Order must have a package']
    },
    project: {
        type: mongoose.Schema.ObjectId,
        ref: 'Project',
        required: [true, 'Order must have a project']
    },
    orderDate: {
        type: Date,
        default: Date.now()
    },
    endDate: Date,
    paymentType: String,
    amount: Number,
    paymentId: String,
})

module.exports = new mongoose.model("Order", orderSchema);