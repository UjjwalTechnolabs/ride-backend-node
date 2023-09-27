const express = require("express");
const router = express.Router();
const {
  addPoints,
  redeemPoints,
} = require("../controllers/loyaltyPointsController");

router.post("/add", addPoints);
router.post("/redeem", redeemPoints);
module.exports = router;
