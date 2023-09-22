// Load environment variables first
const dotenv = require("dotenv");
dotenv.config();

const express = require("express");

const authRoutes = require("./routes/authRoutes");
const rideRoutes = require("./routes/rideRoutes");
const vehicleTypeRoutes = require("./routes/vehicleTypeRoutes");
const driverRoutes = require("./routes/driverRoutes");
const vehicleRoutes = require("./routes/vehicleRoutes");
const cors = require("cors");
const app = express();

// Middleware to parse JSON requests
app.use(express.json());
app.use(express.static("frontend"));
app.use(cors());
// Set up routes
app.use("/auth", authRoutes);
app.use("/api/v1/rides", rideRoutes);
app.use("/api/v1/vehicle-types", vehicleTypeRoutes);
app.use("/api/v1/drivers", driverRoutes);
app.use("/api/v1/vehicles", vehicleRoutes);
// Test route
app.get("/", (req, res) => {
  res.send("Uber Clone Backend");
});

module.exports = app;
