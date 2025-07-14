const mongoose = require('mongoose');

const TopUpSchema = new mongoose.Schema({
     userId: {
    type: mongoose.Schema.Types.ObjectId, // use ObjectId instead of String
    ref: 'User',
    required: true,
  },
    amount: {
        type: Number,
        required: true,
    },
    txRef: {
        type: String,
        required: true,
    },
    transactionId: {
        type: String, // Paystack sometimes returns as string
        required: true,
    },
    type: {
    type: String,
    enum: ['user_topup', 'referral_bonus'],
    default: 'user_topup',
  },
  causedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null, // Used when type is 'referral_bonus' to know which referral triggered the bonus
  },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    // customer: {
    //     email: String,
    //     phone: String,
    //     name: String,
    // },
});

const TopUpModel = mongoose.model('TopUp', TopUpSchema);

module.exports = TopUpModel;
