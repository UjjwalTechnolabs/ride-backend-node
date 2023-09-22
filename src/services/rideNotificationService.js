const admin = require("firebase-admin");
const serviceAccount = require("../service-account-file.json");

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

exports.sendRideConfirmation = async (fcmToken) => {
  try {
    const message = {
      notification: {
        title: "Ride Booked!",
        body: "Your ride has been booked successfully! Waiting for a driver...",
      },
      token: fcmToken,
    };

    const response = await admin.messaging().send(message);
    console.log("Notification sent:", response);
    return true;
  } catch (error) {
    console.error("Error sending notification:", error);
    return false;
  }
};
