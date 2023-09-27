// routes/transactionRoutes.js
const express = require("express");
const router = express.Router();
const {
  getTransactionHistory,
  getMonthlyReports,
  getEarningsAnalytics,
  downloadReport,
} = require("../controllers/transactionController");

router.get("/transactions/:userId", getTransactionHistory); // Assuming you are passing userId as a route parameter
router.get("/transactions/:userId/reports", getMonthlyReports);
router.get("/transactions/:userId/analytics", getEarningsAnalytics);
router.get("/transactions/:userId/reports/download", downloadReport);
getEarningsAnalytics;
module.exports = router;
