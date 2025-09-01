// models/ToggleModel.ts

const mongoose = require('mongoose');

const ToggleSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true }, // e.g. "showContent"
  value: { type: Boolean, default: true },             // toggle state
}, { timestamps: true });

const ToggleModel = mongoose.model('Toggle', ToggleSchema);

module.exports = ToggleModel;
