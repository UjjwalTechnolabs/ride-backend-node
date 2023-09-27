const express = require("express");
const router = express.Router();
const alertController = require("../controllers/alertController");

router.post("/panic-alert", alertController.sendPanicAlert);

router.post("/addEmergencyContact", alertController.addEmergencyContact);

module.exports = router;
