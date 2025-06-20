
// models/AddTimeLog.js
const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({
  text: String,
  senderId: String,
  receiverId: String,
  roomId: String,
  timestamp: { type: Date, default: Date.now },

  // ✅ Status tracking
  status: {
    type: String,
    enum: ['sent', 'delivered', 'read'],
    default: 'sent'
  },
  readAt: Date
});

module.exports = mongoose.model('ChatMessage', chatMessageSchema);
