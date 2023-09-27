const express = require("express");
const router = express.Router();
const analyticsController = require("../controllers/analyticsController"); // Assuming your handlers are in 'controllers/authController.js'.

router.get(
  "/analytics/ride-requests",
  analyticsController.RideRequestFrequency
);
router.get(
  "/analytics/driver-response-rates",
  analyticsController.DriverResponseRates
);
router.get(
  "/analytics/average-fare-over-time",
  analyticsController.averageFareOverTime
);
router.get(
  "/analytics/earnings-analysis",
  analyticsController.earningsAnalysis
);
router.get(
  "/analytics/user-ratings-analysis",
  analyticsController.userRatingsAnalysis
);
router.get(
  "/analytics/active-drivers-users",
  analyticsController.activeDriversUsers
);
router.get(
  "/analytics/cancellation-reasons",
  analyticsController.cancellationReasons
);
router.get("/analytics/popular-routes", analyticsController.popularRoutes);
router.get(
  "/analytics/average-waiting-time",
  analyticsController.averageWaitingTime
);
router.get("/analytics/fuel-consumption", analyticsController.fuelConsumption);
router.get(
  "/analytics/loyalty-points-distribution",
  analyticsController.loyaltyPointsDistribution
);
router.get(
  "/analytics/peak-hours-analysis",
  analyticsController.peakHoursAnalysis
);
router.post("/events", analyticsController.trackEvent);
router.get("/users/:userId/events", analyticsController.getUserEvents);

router.get(
  "/analytics/:userId/:eventType",
  analyticsController.getUserSpecificEventAnalytics
);
router.get("/dashboard", analyticsController.dashboard);
module.exports = router;
