const mongoose = require('mongoose');

const BetQuizSchema = new mongoose.Schema({
   userId: { type: mongoose.Schema.Types.ObjectId, ref: "OdinCircledbModel", required: true },
  batchId: { type: mongoose.Schema.Types.ObjectId, ref: "BatchModel", required: true },
  type: { type: String, enum: ["triviaBet", "win", "lost"], default: "triviaBet" },
  amount: { type: Number, required: true },
  balanceAfter: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now }
});

const BetModelQuiz = mongoose.model('BetQuiz', BetQuizSchema);

module.exports = BetModelQuiz;
