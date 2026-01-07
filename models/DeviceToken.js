const mongoose = require('mongoose');

const deviceTokenSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  token: { type: String, required: true, unique: true },
  platform: { type: String, enum: ['android', 'ios'], required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('DeviceToken', deviceTokenSchema);
