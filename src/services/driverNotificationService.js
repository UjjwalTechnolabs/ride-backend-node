const kafkaService = require("./kafkaService");
const socketService = require("./socketService");

const rideRequestHandler = async ({ topic, partition, message }) => {
  // console.log("Received a ride request message from Kafka:", message.value);
  const receivedPayload = JSON.parse(message.value);
  socketService.broadcastRideRequestToAvailableDrivers(receivedPayload);
};
exports.initialize = async () => {
  await kafkaService.initializeConsumer("ride-request", rideRequestHandler);
};
