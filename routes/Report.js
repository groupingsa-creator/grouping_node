const express = require("express");
const router = express.Router();
const reportCtrl = require("../controllers/Report");
const auth = require("../middleware/auth");

router.post("/submit",        auth, reportCtrl.submitReport);
router.get("/all",            auth, reportCtrl.getReports);
router.get("/unseen",         auth, reportCtrl.countUnseen);
router.post("/updatestatus",  auth, reportCtrl.updateReportStatus);

module.exports = router;
