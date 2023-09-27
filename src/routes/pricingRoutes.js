const express = require("express");
const PricingController = require("../controllers/PricingController");

const router = express.Router();

router.post("/add-pricing", PricingController.createPricing);
router.put("/update-pricing/:id", PricingController.updatePricing);
router.delete("/delete-pricing/:id", PricingController.deletePricing);
router.get("/get-pricing/:id", PricingController.getPricing);
module.exports = router;
