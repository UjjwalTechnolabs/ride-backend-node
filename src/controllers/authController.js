const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { User } = require("../../models");
const twilio = require("twilio");
const SuccessResponse = require("../../utils/successResponse");
const ErrResponse = require("../../utils/errorResponse");

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const generateOTP = () => {
  return Math.floor(1000 + Math.random() * 9000).toString(); // Generates a 4-digit OTP
};

exports.registerRequestOTP = async (req, res) => {
  try {
    const { phoneNumber } = req.body;

    const existingUser = await User.findOne({ where: { phoneNumber } });
    if (existingUser) {
      new ErrResponse(400, "User with this phone number already exists.").send(
        res
      );
      return;
    }

    const otp = generateOTP();

    // await client.messages.create({
    //   body: `Your registration OTP is: ${otp}`,
    //   from: process.env.TWILIO_PHONE_NUMBER,
    //   to: phoneNumber,
    // });

    // Store the OTP in the DB temporarily for verification.
    await User.create({
      phoneNumber: phoneNumber,
      verificationCode: otp,
    });

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
    body: `Your login OTP is: ${otp}`,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: phoneNumber,
  });

  // Store the OTP in the DB temporarily for verification.
  user.verificationCode = otp;
  await user.save();

  new SuccessResponse(200, "OTP sent. Please verify.").send(res);
};

exports.loginVerifyOTP = async (req, res) => {
  const { phoneNumber, otp } = req.body;

  const user = await User.findOne({ where: { phoneNumber } });

  if (!user || user.verificationCode !== otp) {
    new ErrResponse(400, "Invalid OTP.").send(res);
    return;
  }

  // Clear verificationCode after successful login
  user.verificationCode = null;
  await user.save();

  // Generate JWT token
  const tokenPayload = { id: user.id, phoneNumber: user.phoneNumber };
  const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });

  res.json({
    token,
    userId: user.id,
    phoneNumber: user.phoneNumber,
  });
};
