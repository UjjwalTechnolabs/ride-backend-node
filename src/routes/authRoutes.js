const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController"); // Assuming your handlers are in 'controllers/authController.js'.

router.post("/register/request-otp", authController.registerRequestOTP);
router.post("/register/verify-otp", authController.registerVerifyOTP);
router.post("/login/request-otp", authController.loginRequestOTP);
router.post("/login/verify-otp", authController.loginVerifyOTP);

module.exports = router;
