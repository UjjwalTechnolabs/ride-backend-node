// routes/vehicleRoutes.js

const express = require("express");
const router = express.Router();
const VehicleController = require("../controllers/VehicleController");

router.post("/", VehicleController.createVehicle);
router.get("/", VehicleController.getAllVehicles);
router.get("/:id", VehicleController.getVehicle);
router.put("/:id", VehicleController.updateVehicle);
router.delete("/:id", VehicleController.deleteVehicle);

module.exports = router;
