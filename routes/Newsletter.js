const express = require("express");
const router = express.Router();
const newsletterCtrl = require("../controllers/Newsletter");
const auth = require("../middleware/auth");

router.post("/subscribe", newsletterCtrl.subscribe);
router.get("/subscribers", auth, newsletterCtrl.getSubscribers);
router.post("/send", auth, newsletterCtrl.sendNewsletter);

module.exports = router;
