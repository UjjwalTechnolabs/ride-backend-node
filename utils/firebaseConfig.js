const admin = require("firebase-admin");

// Initialize the app with a service account, granting admin privileges
admin.initializeApp({
  credential: admin.credential.cert("../service-account-file.json"),
});

// Fetch the FCM token for the user you want to send the notification to
const fcmToken = "user_token_from_database";

const payload = {
  notification: {
    title: "Ride Booking",
    body: "Your ride has been booked successfully! Waiting for a driver...",
  },
};

// Send a message to the device corresponding to the provided token.
admin
  .messaging()
  .sendToDevice(fcmToken, payload)
  .then((response) => {
    console.log("Successfully sent message:", response);
  })
  .catch((error) => {
    console.log("Error sending message:", error);
  });
