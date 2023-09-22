// routes/driverRoutes.js

const express = require("express");
const router = express.Router();
const multer = require("multer");
const DriverController = require("../controllers/driverController");
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
router.get("/", DriverController.getAllDrivers);
router.get("/:id", DriverController.getDriver);
router.put("/:id", DriverController.updateDriver);
router.delete("/:id", DriverController.deleteDriver);
router.post(
  "/:id/documents",
  upload.single("document"),
  DriverController.uploadDriverDocument
); // Here we are using multer middleware
router.get("/:id/ratings", DriverController.getDriverRatings);
router.get("/:id/vehicle", DriverController.getDriverVehicle);

module.exports = router;
