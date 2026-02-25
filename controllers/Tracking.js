const axios = require("axios");
const TrackingSubscription = require("../models/TrackingSubscription");
const ContainerPosition = require("../models/ContainerPosition");

const HAPAG_BASE = process.env.HAPAG_API_BASE_URL;
const HAPAG_CLIENT_ID = process.env.HAPAG_CLIENT_ID;
const HAPAG_CLIENT_SECRET = process.env.HAPAG_CLIENT_SECRET;
const HAPAG_CALLBACK_API_KEY = process.env.HAPAG_CALLBACK_API_KEY;
const CALLBACK_URL = "https://grouping-node-raar.onrender.com/api/tracking/callback";

const EVENT_LABELS = {
  GTOT: "Gate Out",
  GTIN: "Gate In",
  LOAD: "Loaded on vessel",
  DISC: "Discharged from vessel",
  ARRI: "Arrival",
  DEPA: "Departure",
  TRSH: "Transshipment",
};

const TRANSPORT_MODES = {
  VESSEL: "Maritime",
  RAIL: "Rail",
  TRUCK: "Road",
  BARGE: "Barge",
};

function extractEventData(event) {
  const transportCall = event.transportCall || {};
  const location = transportCall.location || event.location || {};

  const latitude = location.latitude
    || event?.geoCoordinate?.latitude || null;
  const longitude = location.longitude
    || event?.geoCoordinate?.longitude || null;

  const locationName = location.locationName
    || location.facilityName
    || location.address?.name
    || null;

  const unLocationCode = location.UNLocationCode
    || location.unLocationCode
    || null;

  const eventTypeCode = event.transportEventTypeCode
    || event.equipmentEventTypeCode
    || event.eventType
    || null;

  const eventDescription = EVENT_LABELS[eventTypeCode] || eventTypeCode || "Position update";

  const modeCode = transportCall.modeOfTransport
    || event.modeOfTransport
    || null;
  const transportMode = TRANSPORT_MODES[modeCode] || modeCode || null;

  const vesselName = transportCall.vessel?.name
    || transportCall.vessel?.vesselName
    || event.vesselName
    || null;

  return {
    latitude: latitude != null ? parseFloat(latitude) : null,
    longitude: longitude != null ? parseFloat(longitude) : null,
    locationName,
    unLocationCode,
    eventType: eventTypeCode,
    eventDescription,
    transportMode,
    vesselName,
  };
}


exports.subscribe = async (req, res) => {
  try {
    const { carrierBookingReference } = req.body;
    if (!carrierBookingReference) {
      return res.status(400).json({ status: 1, message: "carrierBookingReference is required" });
    }

    const existing = await TrackingSubscription.findOne({
      carrierBookingReference,
      userId: req.auth.userId,
      status: { $in: ["pending", "active"] }
    });

    if (existing) {
      const events = await ContainerPosition.find({ carrierBookingReference })
        .sort({ eventDateTime: 1 })
        .select("eventDateTime locationName unLocationCode eventType eventDescription transportMode vesselName equipmentReference")
        .lean();
      return res.status(200).json({ status: 0, subscription: existing, events });
    }

    const subscription = new TrackingSubscription({
      carrierBookingReference,
      userId: req.auth.userId,
      status: "pending",
    });
    await subscription.save();

    try {
      const response = await axios.post(
        `${HAPAG_BASE}/v1/event-subscriptions`,
        {
          callbackUrl: CALLBACK_URL,
          callbackCredentials: {
            apiKeys: [
              {
                apiKeyName: "API-Key",
                apiKeyLocation: "header",
                apiKeyValue: HAPAG_CALLBACK_API_KEY
              }
            ]
          },
          eventType: "IOT",
          carrierBookingReference,
        },
        {
          headers: {
            "Content-Type": "application/json",
            "x-ibm-client-id": HAPAG_CLIENT_ID,
            "x-ibm-client-secret": HAPAG_CLIENT_SECRET,
          },
        }
      );

      subscription.subscriptionId = response.data.subscriptionID;
      subscription.status = "active";
      subscription.updatedAt = new Date();
      await subscription.save();

      res.status(201).json({ status: 0, subscription, events: [] });
    } catch (apiErr) {
      subscription.status = "error";
      subscription.errorMessage = apiErr.response?.data?.message || apiErr.message;
      subscription.updatedAt = new Date();
      await subscription.save();

      console.error("Hapag-Lloyd subscribe error:", apiErr.response?.data || apiErr.message);
      res.status(200).json({
        status: 2,
        message: "Subscription created but Hapag-Lloyd API call failed",
        subscription,
        events: [],
      });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 1, err });
  }
};


exports.callback = async (req, res) => {
  try {
    const apiKey = req.headers["api-key"];
    if (!HAPAG_CALLBACK_API_KEY || apiKey !== HAPAG_CALLBACK_API_KEY) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const events = Array.isArray(req.body) ? req.body : [req.body];

    for (const event of events) {
      const data = extractEventData(event);

      const position = new ContainerPosition({
        carrierBookingReference: event.carrierBookingReference || event.bookingReference,
        equipmentReference: event.equipmentReference || null,
        latitude: data.latitude,
        longitude: data.longitude,
        locationName: data.locationName,
        unLocationCode: data.unLocationCode,
        eventType: data.eventType,
        eventDescription: data.eventDescription,
        transportMode: data.transportMode,
        vesselName: data.vesselName,
        eventDateTime: event.eventDateTime ? new Date(event.eventDateTime) : new Date(),
        rawEvent: event,
      });

      await position.save();
    }

    res.status(200).json({ received: true });
  } catch (err) {
    console.error("Callback error:", err);
    res.status(500).json({ error: "Internal error" });
  }
};


exports.getLatestPosition = async (req, res) => {
  try {
    const { carrierBookingReference } = req.body;
    if (!carrierBookingReference) {
      return res.status(400).json({ status: 1, message: "carrierBookingReference is required" });
    }

    const [events, subscription] = await Promise.all([
      ContainerPosition.find({ carrierBookingReference })
        .sort({ eventDateTime: 1 })
        .select("eventDateTime locationName unLocationCode eventType eventDescription transportMode vesselName equipmentReference")
        .lean(),
      TrackingSubscription.findOne({ carrierBookingReference, userId: req.auth.userId }).lean(),
    ]);

    res.status(200).json({ status: 0, events, subscription });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 1, err });
  }
};


exports.getPositionHistory = async (req, res) => {
  try {
    const { carrierBookingReference } = req.body;
    if (!carrierBookingReference) {
      return res.status(400).json({ status: 1, message: "carrierBookingReference is required" });
    }

    const positions = await ContainerPosition.find({ carrierBookingReference })
      .sort({ eventDateTime: 1 })
      .limit(200)
      .select("latitude longitude eventDateTime locationName unLocationCode eventType eventDescription transportMode vesselName equipmentReference")
      .lean();

    res.status(200).json({ status: 0, positions });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 1, err });
  }
};
