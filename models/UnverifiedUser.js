const mongoose = require('mongoose');

const UnverifiedUserSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
    trim: true,
  },

  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },

  password: {
    type: String,
    required: true,
  },

  image: {
    type: String, // Cloudinary image URL
    required: true,
  },

  otp: {
    type: String,
    required: true,
  },

  referralCode: {
    type: String,
    default: null,
  },

  expoPushToken: {
    type: String,
    default: null,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },

  expiresAt: {
    type: Date,
    required: true, // Set to 15 minutes after creation
  },
});

module.exports = mongoose.model('UnverifiedUser', UnverifiedUserSchema);
