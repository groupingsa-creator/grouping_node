const express = require("express");
const router = express.Router();
const trackingCtrl = require("../controllers/Tracking");
const auth = require("../middleware/auth");

router.post("/subscribe", auth, trackingCtrl.subscribe);
router.post("/position", auth, trackingCtrl.getLatestPosition);
router.post("/history", auth, trackingCtrl.getPositionHistory);
router.post("/callback", trackingCtrl.callback);

module.exports = router;
