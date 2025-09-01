// models/ToggleModel.ts
import mongoose from "mongoose";

const ToggleSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true }, // e.g. "showContent"
  value: { type: Boolean, default: true },             // toggle state
}, { timestamps: true });

export const ToggleModel = mongoose.model("Toggle", ToggleSchema);
