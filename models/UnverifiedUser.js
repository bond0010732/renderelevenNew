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
  },

  otp: {
    type: String,
    required: true,
  },
  
unlockedCount: {
  type: Number,
  default: 10,
},

  referralCode: {
    type: String,
    default: null,
  },
codeUsed: String,     // code used during sign-up (from referrer)

  expoPushToken: {
    type: String,
    default: null,
  },
   apnsToken: {
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
