const mongoose = require("mongoose");

const likeSchema = mongoose.Schema({
  announcementId: { type: String, required: true },
  userId: { type: String, required: true },
  date: { type: Date, default: Date.now },
});

likeSchema.index({ announcementId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model("Like", likeSchema);
