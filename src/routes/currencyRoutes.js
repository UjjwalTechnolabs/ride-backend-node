const express = require("express");
const router = express.Router();
const currencyController = require("../controllers/currencyContoller");

router.post("/transactions", currencyController.transactions);

module.exports = router;
