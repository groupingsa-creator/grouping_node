const express = require("express");
const router = express.Router();
const likeCtrl = require("../controllers/Like");
const auth = require("../middleware/auth");

router.post("/toggle", auth, likeCtrl.toggleLike);
router.post("/status", auth, likeCtrl.getLikeStatus);
router.post("/counts", auth, likeCtrl.getLikeCounts);

module.exports = router;
