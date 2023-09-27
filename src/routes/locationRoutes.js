const express = require("express");
const router = express.Router();
const locationController = require("../controllers/LocationController"); // Assuming your handlers are in 'controllers/authController.js'.

router.post("/locations", locationController.createLocation);
router.put("/locations/:id", locationController.updateLocation);
router.delete("/locations/:id", locationController.deleteLocation);
router.get("/locations", locationController.getLocations);

module.exports = router;
