const mongoose = require('mongoose');

const DebitsSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
    },
    amount: {
        type: Number,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    WithdrawStatus: {
        type: String,
        default: 'pending', // Add a default status of "pending"
    },
});

const DebitModelToo = mongoose.model('Debit', DebitsSchema);

module.exports = DebitModelToo;
