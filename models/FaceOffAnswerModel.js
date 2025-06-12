const mongoose = require('mongoose');

const faceOffAnswerSchema = new mongoose.Schema({
  
    batchId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Batch',
    },
    batchName: {
      type: String,
      required: true,
    },
    totalBetAmount: {
      type: String,
      required: true,
    },
   userAnswers: [
      {
        userId: { type: String, required: true },
        answers: [
          {
            question: { type: String, required: true },
            selectedAnswer: { type: String, required: true },
            correctAnswer: { type: String, required: true },
          }
        ],
        correctAnswers: { type: Number, required: true },
        timestamp: {
          type: Date,
          default: Date.now,
        },
      }
    ],
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

const FaceOffAnswer = mongoose.model('FaceOffAnswer', faceOffAnswerSchema);
module.exports = FaceOffAnswer;

