const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { User, OTPTable, Driver } = require("../../models");
const twilio = require("twilio");
const SuccessResponse = require("../../utils/successResponse");
const ErrResponse = require("../../utils/errorResponse");
const APP_HASH = "ahELDm9mnOx";
const APP_HASH_USER = "SoqMFYWBsvO";
const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const generateOTP = () => {
  return Math.floor(1000 + Math.random() * 9000).toString(); // Generates a 4-digit OTP
};

exports.registerRequestOTP = async (req, res) => {
  try {
    const { phoneNumber, countryCode } = req.body;
    const fullNumber = countryCode + phoneNumber;

    const otp = generateOTP();

    await client.messages.create({
      body: `<#> RolaRide OTP: ${otp} for account safety ${APP_HASH}. Remember, it's important not to share your OTP to prevent potential security breaches.`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: fullNumber,
    });

    // Store the OTP in the OTPTable temporarily for verification.
    await OTPTable.upsert({ phoneNumber: fullNumber, verificationCode: otp });

    new SuccessResponse(200, "OTP sent. Please verify.").send(res);
  } catch (error) {
    new ErrResponse(500, "Internal server error", error.message).send(res);
  }
};
exports.registerRequestOTPUser = async (req, res) => {
  try {
    const { phoneNumber, countryCode } = req.body;
    const fullNumber = countryCode + phoneNumber;

    const otp = generateOTP();

    await client.messages.create({
      body: `<#> RolaRide OTP: ${otp} for account safety ${APP_HASH_USER}. Remember, it's important not to share your OTP to prevent potential security breaches.`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: fullNumber,
    });

    // Store the OTP in the OTPTable temporarily for verification.
    await OTPTable.upsert({ phoneNumber: fullNumber, verificationCode: otp });

    new SuccessResponse(200, "OTP sent. Please verify.").send(res);
  } catch (error) {
    new ErrResponse(500, "Internal server error", error.message).send(res);
  }
};

exports.registerVerifyOTP = async (req, res) => {
  const { phoneNumber, otp } = req.body;

  const user = await User.findOne({ where: { phoneNumber } });

  if (!user || user.verificationCode !== otp) {
    return new ErrResponse(400, "Invalid OTP.").send(res); // Notice the 'return' here
  }

  // Clear verificationCode after successful registration
  user.verificationCode = null;
  await user.save();
  new SuccessResponse(200, "User registered successfully.").send(res);
};

exports.loginRequestOTP = async (req, res) => {
  const { phoneNumber } = req.body;

  const user = await User.findOne({ where: { phoneNumber } });

  if (!user) {
    new ErrResponse(400, "User not found.").send(res);
  }

  const otp = generateOTP();

  await client.messages.create({
    body: `<#> RolaRide OTP: ${otp} account safety ${APP_HASH}. Remember, it's important not to share your OTP to prevent potential security breaches.`,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: fullNumber,
  });

  // Store the OTP in the DB temporarily for verification.
  user.verificationCode = otp;
  await user.save();

  new SuccessResponse(200, "OTP sent. Please verify.").send(res);
};

// exports.loginVerifyOTP = async (req, res) => {
//   const { phoneNumber, otp } = req.body;

//   const user = await User.findOne({ where: { phoneNumber } });

//   if (!user || user.verificationCode !== otp) {
//     new ErrResponse(400, "Invalid OTP.").send(res);
//     return;
//   }

//   // Clear verificationCode after successful login
//   user.verificationCode = null;
//   await user.save();

//   // Generate JWT token
//   const tokenPayload = { id: user.id, phoneNumber: user.phoneNumber };
//   const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, {
//     expiresIn: "24h",
//   });

//   res.json({
//     token,
//     userId: user.id,
//     phoneNumber: user.phoneNumber,
//   });

exports.loginVerifyOTPForUser = async (req, res) => {
  console.log(req.body);
  try {
    const {
      phoneNumber,
      otp,
      language_code,
      preferredCurrency,
      location,
      fcmToken,
    } = req.body;

    // Check the OTP against the OTPTable
    const otpEntry = await OTPTable.findOne({ where: { phoneNumber } });

    // If OTP entry does not exist or the OTPs don't match, send an error
    if (!otpEntry || otpEntry.verificationCode !== otp) {
      new ErrResponse(400, "Invalid OTP.").send(res);
      return;
    }

    // Check if user exists in the main User table
    let user = await User.findOne({ where: { phoneNumber } });

    let message = "OTP validated successfully.";

    if (!user) {
      // If no user exists with the given phone number, register a new user
      user = await User.create({
        phoneNumber,
        language_code,
        preferredCurrency,
        location,
        isNewUser: true,
        fcmToken,
      });

      message = "Registered successfully.";
    } else {
      // If the driver already exists, update the fcmToken
      await user.update({ fcmToken });
    }

    // Clear the OTP entry from the OTPTable after successful verification
    await otpEntry.destroy();

    // Generate JWT token
    const tokenPayload = { id: user.id, phoneNumber: user.phoneNumber };
    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, {
      expiresIn: "365d",
    });

    res.json({
      success: true,
      status: true,
      token,
      isNewUser: user.isNewUser,
      message,
      user: {
        userID: user.id,
        email: user.email || "newuser@example.com", // Default email for illustration, change based on your logic.
      },
    });
  } catch (error) {
    new ErrResponse(500, "Internal server error", error.message).send(res);
  }
};

exports.loginVerifyOTPForDriver = async (req, res) => {
  try {
    const {
      phoneNumber,
      otp,
      language_code,
      preferredCurrency,
      location,
      fcmToken,
    } = req.body;

    // Check the OTP against the OTPTable
    const otpEntry = await OTPTable.findOne({ where: { phoneNumber } });

    // If OTP entry does not exist or the OTPs don't match, send an error
    if (!otpEntry || otpEntry.verificationCode !== otp) {
      new ErrResponse(400, "Invalid OTP.").send(res);
      return;
    }

    // Check if user exists in the main User table
    let driver = await Driver.findOne({ where: { phoneNumber } });

    let message = "OTP validated successfully.";

    if (!driver) {
      // If no user exists with the given phone number, register a new user
      driver = await Driver.create({
        phoneNumber,
        language_code,
        preferredCurrency,
        location,
        isNewDriver: true,
        fcmToken,
      });

      message = "Registered successfully.";
    } else {
      // If the driver already exists, update the fcmToken
      await driver.update({ fcmToken });
    }

    // Clear the OTP entry from the OTPTable after successful verification
    await otpEntry.destroy();

    // Generate JWT token
    const tokenPayload = { id: driver.id, phoneNumber: driver.phoneNumber };
    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, {
      expiresIn: "365d",
    });

    res.json({
      success: true,
      status: true,
      token,
      isNewDriver: driver.isNewDriver,
      message,
      driver: {
        driverID: driver.id,
        email: driver.email || "newuser@example.com", // Default email for illustration, change based on your logic.
      },
    });
  } catch (error) {
    new ErrResponse(500, "Internal server error", error.message).send(res);
  }
};
