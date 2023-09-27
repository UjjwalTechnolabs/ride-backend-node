// routes/driverRoutes.js

const express = require("express");
const router = express.Router();
const multer = require("multer");
const DriverController = require("../controllers/driverController");
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

router.post("/", DriverController.createDriver);
router.get("/", DriverController.getDriverList);
router.get("/:driverId", DriverController.getDriverDetails);
router.put("/:id", DriverController.updateDriver);
router.delete("/:id", DriverController.deleteDriver);
router.post(
  "/:id/documents",
  upload.single("document"),
  DriverController.uploadDriverDocument
); // Here we are using multer middleware
router.get("/:id/ratings", DriverController.getDriverRatings);
router.get("/:id/vehicle", DriverController.getDriverVehicle);

router.post("/reviews", reviewController.addReview);
router.get("/:driverId/earnings", DriverController.getDriverEarnings);

module.exports = router;
