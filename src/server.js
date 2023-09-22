const http = require("http");
const socketService = require("./services/socketService");
const kafkaService = require("./services/kafkaService"); // Assuming kafkaService is in the services folder

const app = require("./app");
const { driverResponseHandler } = require("./services/driverService");
const driverNotificationService = require("./services/driverNotificationService");

const server = http.createServer(app);
const io = require("socket.io")(server, {
  cors: {
    origin: "*", // Address of your React frontend
    methods: ["GET", "POST"],
  },
});

socketService.initializeSocketIO(io);

const start = async () => {
  await kafkaService.connectProducer();
  await driverNotificationService.initialize();

  server.listen(3000, "0.0.0.0", () => {
    console.log("listening on *:3000");
  });
};
start().catch((err) => {
  console.error("Error starting the server:", err);
});
module.exports = io; // export the socket.io instance
