// routes/paymentRoutes.js

const express = require("express");
const router = express.Router();

const paymentController = require("../controllers/PaymentController"); // adjust the path accordingly

router.post("/pay-driver", paymentController.payDriver);

module.exports = router;
