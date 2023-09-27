// routes/userRoutes.js
const express = require("express");
const router = express.Router();
const {
  getUserList,
  getUserDetails,
} = require("../controllers/userController");

router.get("/users", getUserList);
router.get("/users/:userId", getUserDetails);

module.exports = router;
