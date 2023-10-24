const express = require("express");
const router = express.Router();

const {
  bookRide,
  acceptRide,
  updateDriverLocation,
  endRide,
  getCurrentRide,
  getAllTrips,
} = require("../controllers/rideController");

router.post("/book", bookRide);
router.post("/accept", acceptRide);
router.post("/driver/location/update", updateDriverLocation);
router.get("/currentRide/:userId", getCurrentRide);
router.get("/rides", getAllTrips);
router.post("/end", endRide);
module.exports = router;
