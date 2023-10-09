// routes/userRoutes.js
const express = require("express");
const router = express.Router();
const {
  getUserList,
  getUserDetails,
  updateUser,
} = require("../controllers/userController");

router.get("/users", getUserList);
router.get("/users/:userId", getUserDetails);
router.put("/users/:userId", updateUser);
module.exports = router;
