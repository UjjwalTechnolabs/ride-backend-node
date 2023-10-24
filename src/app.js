// Load environment variables first
const dotenv = require("dotenv");
dotenv.config();

const express = require("express");
const cors = require("cors");
const app = express();

require("./utils/cronJob"); // Import and execute the cron job file

const i18next = require("i18next");
const Backend = require("i18next-fs-backend");
const middleware = require("i18next-http-middleware");

i18next
  .use(Backend)
  .use(middleware.LanguageDetector)
  .init({
    backend: {
      loadPath: __dirname + "/locales/{{lng}}.json",
    },
    fallbackLng: "en", // Use English as fallback language
    preload: ["en", "hi"], // Preload English and Hindi languages
    //ns: ["translation"],
    //defaultNS: "translation",
    debug: true,
    interpolation: {
      escapeValue: false, // not needed for react as it escapes by default
    },
    detection: {
      order: ["querystring", "cookie"],
      caches: ["cookie"],
    },
  });

// Middleware to use i18next in Express.js
app.use(middleware.handle(i18next));

const authRoutes = require("./routes/authRoutes");
const rideRoutes = require("./routes/rideRoutes");
const vehicleTypeRoutes = require("./routes/vehicleTypeRoutes");
const driverRoutes = require("./routes/driverRoutes");
const vehicleRoutes = require("./routes/vehicleRoutes");
const loyaltyRoutes = require("./routes/loyaltyRoutes");
const alertRoutes = require("./routes/alertRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");
const currencyRoutes = require("./routes/currencyRoutes");
const pricingRoutes = require("./routes/pricingRoutes");
const locationRoutes = require("./routes/locationRoutes");
const paymentRoutes = require("./routes/paymentRoutes"); // adjust the path accordingly
const transactionRoutes = require("./routes/transactionRoutes"); // adjust the path accordingly
const userRoutes = require("./routes/userRoutes");
const energyTypeRoutes = require("./routes/energyTypeRoutes");
const adminRoutes = require("./routes/adminRoutes");
const roleRoutes = require("./routes/roleRoutes");

// This should print: उपयोगकर्ता आईडी
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
app.use("/api/v1/loyalty", loyaltyRoutes);
app.use("/api/v1", alertRoutes);
app.use("/api/v1", analyticsRoutes);
app.use("/api/v1", currencyRoutes);
app.use("/api/v1", pricingRoutes);
app.use("/api/v1", locationRoutes);
app.use("/api/v1", paymentRoutes); // register the router
app.use("/api/v1", transactionRoutes); // register the router
app.use("/api/v1", userRoutes);
app.use("/api/v1", energyTypeRoutes);
app.use("/api/v1", adminRoutes);
app.use("/api/v1/role", roleRoutes);

// Test route
app.get("/", (req, res) => {
  res.send("Uber Clone Backend");
});
app.get("/alert/:userId", (req, res) => {
  res.sendFile(__dirname + "/alert.html");
});

module.exports = app;
