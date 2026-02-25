const mongoose = require("mongoose");

const containerPositionSchema = mongoose.Schema({
  carrierBookingReference: { type: String, required: true },
  equipmentReference: { type: String, default: null },
  latitude: { type: Number, default: null },
  longitude: { type: Number, default: null },
  locationName: { type: String, default: null },
  unLocationCode: { type: String, default: null },
  eventType: { type: String, default: null },
  eventDescription: { type: String, default: null },
  transportMode: { type: String, default: null },
  vesselName: { type: String, default: null },
  eventDateTime: { type: Date, required: true },
  rawEvent: { type: Object },
  receivedAt: { type: Date, default: Date.now },
});

containerPositionSchema.index({ carrierBookingReference: 1, eventDateTime: -1 });

module.exports = mongoose.model("ContainerPosition", containerPositionSchema);
