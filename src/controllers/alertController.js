const { EmergencyContacts } = require("../../models");
const twilio = require("twilio");
const { getUserLocation } = require("../services/socketService");

const ACCOUNT_SID = "AC8798befe38bb49e7b976a7a9375c0e7a"; // Replace with your Twilio Account SID
const AUTH_TOKEN = "7f8ef81800adce8ee70e56d89969adb9"; // Replace with your Twilio Auth Token
const TWILIO_PHONE_NUMBER = "+12518423880"; // Replace with your Twilio phone number
const TWILIO_WHATSAPP_SANDBOX_NUMBER = "whatsapp:+12518423880"; // Replace with your Twilio WhatsApp Sandbox Number"+12518423880"; // Replace with your Twilio WhatsApp Sandbox Number

const client = new twilio(ACCOUNT_SID, AUTH_TOKEN);

exports.sendPanicAlert = async (req, res) => {
  const { userId } = req.body;

  const userLocation = getUserLocation(userId);
  console.log(userLocation);
  if (!userLocation) {
    return res.status(400).send({ message: "User location not available" });
  }

  // Fetch the emergency contacts for this user from the database
  const contacts = await EmergencyContacts.findAll({ where: { userId } });

  // Send an alert/notification to all emergency contacts
  contacts.forEach((contact) => {
    // Send SMS
    const message = `User ${contact.contactName} is in danger! Location: https://www.google.com/maps?q=${userLocation.latitude},${userLocation.longitude}`;
    // sendSMS(contact.contactNumber, message);

    // Send WhatsApp Message//contactWhatsAppNumber
    //sendWhatsAppMessage(contact.contactNumber, message);
  });

  res.status(200).send({ message: "Alert sent successfully" });
};
exports.sendSMS = (to, message) => {
  client.messages
    .create({
      body: message,
      to: to,
      from: TWILIO_PHONE_NUMBER,
    })
    .then((message) => console.log(message.sid))
    .catch((error) => console.error(error));
};

function sendWhatsAppMessage(to, message) {
  client.messages
    .create({
      body: message,
      to: "whatsapp:" + to, // WhatsApp number format
      from: TWILIO_WHATSAPP_SANDBOX_NUMBER,
    })
    .then((message) => console.log(message.sid))
    .catch((error) => console.error(error));
}

// You can now use sendSMS and sendWhatsAppMessage functions as demonstrated earlier.
exports.addEmergencyContact = async (req, res) => {
  try {
    // const { userId, contactName, contactNumber, contactWhatsAppNumber } =
    //   req.body;

    const newContact = await EmergencyContacts.create(req.body);
    res.status(201).json({
      message: "Emergency contact added successfully.",
      data: newContact,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
};
