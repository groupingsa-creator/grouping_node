const mongoose = require("mongoose");

const reportSchema = mongoose.Schema({
  reporterId:     { type: String, required: true },
  reportedUserId: { type: String, required: true },
  annonceId:      { type: String, required: true },
  date:           { type: Date, default: Date.now },
  status:         { type: String, default: "pending" }, // pending | reviewed | dismissed
  seen:           { type: Boolean, default: false },
});

module.exports = mongoose.model("Report", reportSchema);
