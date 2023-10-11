// routes/energyTypeRoutes.js
const express = require("express");
const router = express.Router();
const energyTypeController = require("../controllers/energyTypeController");

router.get("/energyTypes/", energyTypeController.getAll);
router.post("/energyTypes/", energyTypeController.create);
// Add routes for update and delete as required.

module.exports = router;
