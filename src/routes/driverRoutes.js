// routes/driverRoutes.js

const express = require("express");
const router = express.Router();
const multer = require("multer");
const driverController = require("../controllers/driverController");
const reviewController = require("../controllers/reviewController"); // Adjust the path as necessary

const path = require("path");
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // 'uploads/' is the directory where you'd like to save uploaded files.
  },
  filename: (req, file, cb) => {
    cb(
      null,
      `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`
    );
  },
});

const upload = multer({ storage });

router.post("/", driverController.createDriver);
router.get("/", driverController.getDriverList);
router.get("/:driverId", driverController.getDriverDetails);

router.delete("/:id", driverController.deleteDriver);
router.post(
  "/:id/documents",
  upload.single("document"),
  driverController.uploadDriverDocument
); // Here we are using multer middleware
router.get("/:id/ratings", driverController.getDriverRatings);
router.get("/:id/vehicle", driverController.getDriverVehicle);

router.post("/reviews", reviewController.addReview);
router.get("/:driverId/earnings", driverController.getDriverEarnings);
router.get("/dashboard/:driverId", driverController.getDriverDashboardData);
router.get(
  "/:driverId/with-documents",
  driverController.getDriverWithDocuments
);
router.put("/:driverId", driverController.updateDriverOrVehicle);

module.exports = router;
