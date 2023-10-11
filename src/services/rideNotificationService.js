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
exports.sendRideConfirmationToDriver = async (fcmToken) => {
  if (!fcmToken) {
    console.warn(
      "FCM token is missing or empty. Skipping sending notification."
    );
    return false;
  }
  try {
    const message = {
      notification: {
        title: "New Ride Request!",
        body: "A passenger is waiting for you. Tap to accept and start your journey!",
        // sound: "notification_sound"
      },
      token: fcmToken,
    };

    const response = await admin.messaging().send(message);
    console.log("Notification sent:", response);
    return true;
  } catch (error) {
    // Handle the specific error when FCM token is not registered
    if (
      error.errorInfo &&
      error.errorInfo.code === "messaging/registration-token-not-registered"
    ) {
      // Silently handle this error without printing
      return false;
    }

    // For other errors, print the error
    console.error("Error sending notification:", error);
    return false;
  }
};
