const mongoose = require("mongoose");

const trackingSubscriptionSchema = mongoose.Schema({
  carrierBookingReference: { type: String, required: true },
  subscriptionId: { type: String, default: null },
  userId: { type: String, required: true },
  status: { type: String, default: "pending", enum: ["pending", "active", "error", "cancelled"] },
  errorMessage: { type: String, default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

trackingSubscriptionSchema.index({ carrierBookingReference: 1, userId: 1 });
trackingSubscriptionSchema.index({ subscriptionId: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model("TrackingSubscription", trackingSubscriptionSchema);
