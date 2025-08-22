const mongoose = require('mongoose');

const CashoutHistorySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "OdinCircledbModel", required: true },
  amount: { type: Number, required: true },
  type: { type: String, enum: ["credit", "debit"], default: "credit" }, // credit = add, debit = withdraw
  createdAt: { type: Date, default: Date.now }
});


module.exports = mongoose.model('CashoutHistory', CashoutHistorySchema);
