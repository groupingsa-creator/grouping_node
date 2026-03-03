const mongoose = require("mongoose");

const subscriberSchema = mongoose.Schema({
  email: { type: String, required: true, unique: true },
  subscribedAt: { type: Date, default: Date.now },
  active: { type: Boolean, default: true },
});

module.exports = mongoose.model("NewsletterSubscriber", subscriberSchema);
