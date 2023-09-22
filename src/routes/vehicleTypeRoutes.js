const express = require("express");
const vehicleTypeController = require("../controllers/vehicleTypeController");

const router = express.Router();

router
  .route("/")
  .get(vehicleTypeController.getAllVehicleTypes)
  .post(vehicleTypeController.createVehicleType);

router
  .route("/:id")
  .get(vehicleTypeController.getVehicleType)
  .patch(vehicleTypeController.updateVehicleType)
  .delete(vehicleTypeController.deleteVehicleType);

module.exports = router;
