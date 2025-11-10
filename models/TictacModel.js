const mongoose = require('mongoose');

const TictacSchema = new mongoose.Schema({
  roomId: {
    type: String,
    required: true,
  },
  title: {
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
});

// module.exports = mongoose.model('Batch', BatchSchema);

const TictacModel = mongoose.model('Tictac', TictacSchema);

module.exports = TictacModel;
