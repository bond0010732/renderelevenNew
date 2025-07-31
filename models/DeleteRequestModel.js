const mongoose = require('mongoose');

const DeleteSchema = new mongoose.Schema({
    userId: {
        type: String,
    },
    fullName: {
        type: String,
    },
    email: {
        type: String,
        required: true,
    },
    confirmationText: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const DeleteRequestModel = mongoose.model('Delete', DeleteSchema);

module.exports = DeleteRequestModel;
