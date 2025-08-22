import mongoose from "mongoose";

const CashoutHistorySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "OdinCircledb", required: true },
  amount: { type: Number, required: true },
  type: { type: String, enum: ["credit", "debit"], default: "credit" }, // credit = add, debit = withdraw
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("CashoutHistory", CashoutHistorySchema);
