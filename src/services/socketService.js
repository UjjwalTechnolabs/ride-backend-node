const {
  Ride,
  Driver,
  NotifiedDriver,
  LoyaltyPoints,
  EmergencyContacts,
  DriverEarnings,
  Wallet,
  DriverFeedback,
  UserFeedback,
  RideHistory,
  User,
  VehicleType,
  sequelize,
  Location,
  UserWallet,
} = require("../../models");
const { Op, Sequelize } = require("sequelize");
const { handleDriverAcceptance, assignDriver } = require("./driverService");
const {
  updateDriverStatusForRide,
  logNotifiedDriver,
} = require("./rideService");
const {
  calculateFare,
  calculateETA,
  calculateETAFinal,
} = require("../utils/fareUtils");
const { sendSMS } = require("../controllers/alertController");
const app = require("../app");
const Redis = require("ioredis");
const redis = new Redis();
let io;
let driversAttempted = {};
let driverSocketMap = {}; // Outside the connection listener

let locations = {}; // This will store the last sent location

exports.initializeSocketIO = (socketIOInstance) => {
  io = socketIOInstance;

  io.on("connection", (socket) => {
    console.log(`User connected with socket ID: ${socket.id}`);

    socket.on("driver-online", (data) => {
      const driverId = data.driverId;
      driverSocketMap[socket.id] = driverId;

      console.log(
        `Driver ${driverId} is now online with socket id ${socket.id}`
      );
    });
    socket.on("updateDriverLocation", (data) => {
      // Extract driverId and location from data
      const { driverId, latitude, longitude } = data;

      // Emit the location update event to the frontend
      io.emit("driverLocationUpdated", { latitude, longitude });
    });
    socket.on("updateLocation", async (data) => {
      console.log(data);

      // Check if userId is present in the data
      if (data && data.userId) {
        const userId = data.userId;

        // Fetch the emergency contacts for this user from the database
        const contacts = await EmergencyContacts.findAll({ where: { userId } });

        // Send an alert/notification to all emergency contacts
        contacts.forEach((contact) => {
          // Send SMS
          const message = `User ${contact.contactName} is in danger! Location: https://rider-backend.ngrok.io/alert/${userId}`;
          // sendSMS(contact.contactNumber, message);

          // Send WhatsApp Message
          // sendWhatsAppMessage(contact.contactNumber, message);
        });

        // Store user's location
        locations[userId] = {
          latitude: data.latitude,
          longitude: data.longitude,
        };

        // Emit location update for that specific user
        io.emit(`showLocation:${userId}`, locations[userId]);
      }
    });

    socket.on("getDriverLocationWhenOnline", (data) => {
      const { driverId, location } = data;

      // Set driver location in Redis with a prefix 'driver:'
      redis.set(`driver:${driverId}:location`, JSON.stringify(location));
    });

    socket.on("joinChatRoom", (rideId) => {
      socket.join(`chat:${rideId}`);
      console.log(`Joined chat room for ride: ${rideId}`);
    });
    socket.on("sendMessage", (data) => {
      console.log(data);
      const { rideId, message, senderType } = data;
      io.to(`chat:${rideId}`).emit("receiveMessage", {
        message,
        senderType,
        timestamp: new Date(),
      });
    });
    socket.on("disconnect", (reason) => {
      if (driverSocketMap[socket.id]) {
        console.log(
          `Driver with ID ${driverSocketMap[socket.id]} disconnected.`
        );
        delete driverSocketMap[socket.id];
      }
      console.log(`Client ${socket.id} disconnected due to: ${reason}`);
    });
    socket.on("goOffline", () => {
      console.log(`Driver with socket ID ${socket.id} is going offline`);

      // Update the driver's status in the database
      const driverId = driverSocketMap[socket.id];
      if (driverId) {
        Driver.update({ onlineStatus: "OFFLINE" }, { where: { id: driverId } });
        delete driverSocketMap[socket.id];
      }
    });

    socket.on("identifyDriver", (driverId) => {
      socket.join(driverId);
      driverSocketMap[socket.id] = driverId;
      console.log(`Driver ${driverId} identified.`);
    });
    socket.on("addFunds", async (data) => {
      const userId = data.userId;
      const amount = data.amount;

      const userWallet = await Wallet.findOne({ where: { userId: userId } });
      userWallet.balance += amount;
      await userWallet.save();
    });
    socket.on("userFeedback", async (data) => {
      const userId = data.userId;
      const driverId = data.driverId;
      const feedback = data.feedback;
      await UserFeedback.create({
        driverId: driverId,
        userId: userId,
        feedback: feedback,
      });
    });
    socket.on("joinRideRoom", (rideId) => {
      socket.join(rideId);
      console.log(`Joined ride room: ${rideId}`);
      io.to(rideId).emit("test-event", { message: "Test event received" });
    });

    socket.on("joinAvailableDrivers", () => {
      socket.join("available-drivers");
      console.log(`Joined available drivers.`);
    });

    socket.on("toggleAvailability", (status) => {
      console.log(
        `Driver ${socket.id} is now ${status ? "available" : "unavailable"}`
      );
    });

    socket.on("enRoute", (data) => {
      console.log(data);
      const { rideId } = data;
      const actualDriverId = driverSocketMap[socket.id]; // Get actual driver ID

      console.log(
        `Emitting driver-enroute for rideId: ${rideId} and driverId: ${socket.id}`
      );
      io.emit("debug-driver-enroute", {
        rideId,
        driverId: actualDriverId,
        debug: "Just for testing",
      });
      console.log("actualDriverId Deepak nagar");
      io.to(rideId).emit("driver-enroute", {
        rideId,
        driverId: actualDriverId,
      });
      console.log(`Driver ${socket.id} is en route for ride ${rideId}`);
    });

    socket.on("arrived", (data) => {
      const { rideId } = data;
      const actualDriverId = driverSocketMap[socket.id]; // Get actual driver ID

      io.to(rideId).emit("driver-arrived", {
        rideId,
        driverId: actualDriverId,
      });
      console.log(`Driver ${socket.id} has arrived for ride ${rideId}`);
    });

    socket.on("rideStarted", (data) => {
      const { rideId } = data;
      const actualDriverId = driverSocketMap[socket.id]; // Get actual driver ID

      io.to(rideId).emit("ride-started", { rideId, driverId: actualDriverId });
      console.log(`Driver ${socket.id} has started ride ${rideId}`);
    });
    socket.on("send-driver-location", (data) => {
      const { rideId, location } = data;
      console.log(data);
      io.to(rideId).emit("update-driver-location", location);
    });
    socket.on("driverFeedback", async (data) => {
      const userId = data.userId;
      const driverId = data.driverId;
      const feedback = data.feedback;
      await DriverFeedback.create({
        driverId: driverId,
        userId: userId,
        feedback: feedback,
      });
    });

    socket.on("rideCompleted", async (data) => {
      console.log(data);
      try {
        const actualDriverId = driverSocketMap[socket.id];
        // Update the Ride table status to 'COMPLETED'
        //await Ride.update({ status: "COMPLETED" }, { where: { id: rideId } });
        // वास्तविक दूरी और वाहन के प्रकार से किराया की गणना
        const ride = await Ride.findByPk(data.rideId);

        const vehicleType = await VehicleType.findOne({
          where: { id: ride.vehicleTypeKey },
        });

        if (!vehicleType) {
          await transaction.rollback();
          return res.status(400).json({
            status: "fail",
            message: "Vehicle type does not exist.",
          });
        }
        const serviceType = vehicleType.name;
        const user = await User.findByPk(ride.userId);
        if (!user) {
          return res.status(400).json({
            status: "fail",
            message: "User does not exist.",
          });
        }
        const location = await decideLocation(
          ride.pickupLocation,
          ride.dropoffLocation
        ); // Using await to wait for the decideLocation function
        console.log(
          "datas",
          data.actualDistance,
          ride.vehicleTypeKey,
          user.userCurrencyCode,
          serviceType,
          location
        );
        const actualFare = await calculateFare(
          data.actualDistance,
          ride.vehicleTypeKey,

          user.currency_code,
          serviceType,
          // Assuming that 'name' is the field containing the service type in VehicleType model

          location
        );

        const earnings = calculateDriverEarnings(actualFare);
        await DriverEarnings.create({
          driverId: actualDriverId,
          rideId: data.rideId,
          earnings: earnings,
        });
        const driver = await Driver.findByPk(actualDriverId);
        const driverWallet = await Wallet.findOne({
          where: { driverId: actualDriverId },
        });
        if (driverWallet) {
          driverWallet.balance += earnings; // Increment the wallet balance by the earnings
          await driverWallet.save();
        } else {
          // If the driver doesn't have a wallet, create a new one with the earnings as initial balance
          await Wallet.create({
            driverId: actualDriverId,
            balance: earnings,
            currencyCode: driver.preferredCurrency,
          });
        }
        // this should be implement

        const userWallet = await UserWallet.findOne({
          where: { userId: ride.userId },
        });

        if (userWallet) {
          userWallet.balance -= actualFare; // Decrement the wallet balance by the fare amount
          await userWallet.save();
        } else {
          // If the user doesn't have a wallet, create a new one with a negative balance equal to the fare.
          // However, this scenario might be problematic in real-world applications - you typically don't want users to have negative balances.
          await UserWallet.create({
            userId: ride.userId,
            balance: -actualFare,
            currencyCode: user.currency_code,
          });
        }
        // ETA की गणना
        const receivedDropoff = {
          type: "Point",
          coordinates: data.dropoffLocation, // यह आपके एप्लिकेशन से प्राप्त डेटा होगा
        };
        ride.dropoffLocation = receivedDropoff;

        const updatedEta = await calculateETAFinal(
          ride.pickupLocation.coordinates,
          ride.dropoffLocation.coordinates
        );
        const etaString = `${updatedEta} mins`;

        // Update the Ride table with status, actual fare, ETA, and actual distance
        // Add loyalty points for the user based on fare
        const pointsToAdd = calculateLoyaltyPoints(actualFare);

        let loyaltyPoints = await LoyaltyPoints.findOne({
          where: { userId: ride.userId },
        });

        if (!loyaltyPoints) {
          loyaltyPoints = await LoyaltyPoints.create({
            userId: ride.userId,
            points: pointsToAdd,
          });
        } else {
          loyaltyPoints.points += pointsToAdd;
          await loyaltyPoints.save();
        }

        await Ride.update(
          {
            dropoffLocation: receivedDropoff,
            status: "COMPLETED",
            fare: actualFare,
            ETA: etaString,
            pickedUpAt: new Date(),
          },
          { where: { id: data.rideId } }
        );
        // await RideHistory.create({
        //   userId: ride.userId,
        //   driverId: actualDriverId,
        //   rideId: data.rideId,
        //   fare: actualFare,
        //   distance: data.actualDistance,
        //   pickupLocation: data.pickupLocation, // Assuming data contains pickupLocation
        //   dropoffLocation: data.dropoffLocation, // Assuming data contains dropoffLocation
        //   startTime: data.startTime, // Assuming data contains startTime
        //   endTime: data.endTime, // Assuming data contains endTime
        //   vehicleDetails: data.vehicleDetails, // Assuming data contains vehicleDetails
        //   feedback: data.feedback, // Assuming data contains feedback
        //   rating: data.rating, // Assuming data contains rating
        // });

        // Update the NotifiedDriver table status for this driver to 'accepted' for this ride
        // This assumes your ride requests to drivers are stored with a status like 'notified' or 'accepted'
        await NotifiedDriver.update(
          { status: "accepted" },
          { where: { rideRequestId: data.rideId, driverId: actualDriverId } }
        );
        await Driver.update(
          { onlineStatus: "ONLINE" },
          { where: { id: actualDriverId } } // Assuming the socket ID corresponds to the driver's ID
        );
        var rId = data.rideId;
        io.to(data.rideId).emit("ride-completed", {
          rId,
          driverId: actualDriverId,
        });
        socket.leave(`chat:${data.rideId}`);
        //delete driverSocketMap[socket.id];
        console.log(
          `Driver ${actualDriverId} has completed ride ${data.rideId}`
        );
      } catch (error) {
        console.error(
          `Error updating status for completed ride ${data.rideId}:`,
          error
        );
      }
    });

    socket.on("rideResponse", (response) => {
      // Send this response to Kafka or directly process it
      kafkaService.processDriverResponse(response); // This function can be in kafkaService or another service that deals with driver responses
    });
    socket.on("driver-response", async (data) => {
      try {
        const driverId = driverSocketMap[socket.id];
        // Update the NotifiedDriver table status
        await updateDriverStatusForRide(
          data.rideId,
          data.driverId,
          data.status
        );

        if (data.status === "accepted") {
          // ... existing acceptance code ...
          console.log(`Driver ${data.driverId} has accepted the ride.`);
          // Notify the user about the driver's acceptance
          await NotifiedDriver.update(
            { status: "accepted" },
            {
              where: {
                rideRequestId: data.rideId,
                driverId: data.driverId,
              },
            }
          );
          await Driver.update(
            { onlineStatus: "ON_TRIP" },
            { where: { id: data.driverId } }
          );
          await Ride.update(
            { driverId: driverId },
            { where: { id: data.rideId } }
          );

          io.to("available-drivers").emit("ride-accepted", {
            rideId: data.rideId,
            driverId: data.driverId,
            message: "Your ride has been accepted!",
          });

          handleDriverAcceptance(data.rideId);
        } else if (data.status === "rejected") {
          console.log(`Driver ${data.driverId} has rejected the ride.`);
          // if (!driversAttempted[data.rideId]) {
          //   driversAttempted[data.rideId] = [];
          // }
          // driversAttempted[data.rideId].push(data.driverId);

          // Retry with another driver
          // assignDriver(data.rideId, data.pickupLocation);
        }
      } catch (error) {
        console.error("Error processing driver-response:", error);
      }
    });

    socket.on("driver-no-response", async (data) => {
      try {
        console.log(
          `Driver ${data.driverId} did not respond to the ride request`
        );
        console.log();
        // Update the NotifiedDriver table status
        await updateDriverStatusForRide(
          data.rideId,
          data.driverId,
          "no-response"
        );

        // Your existing logic to keep track of attempted drivers
        // if (!driversAttempted[data.rideId]) {
        //   driversAttempted[data.rideId] = [];
        // }
        // driversAttempted[data.rideId].push(data.driverId);

        // // Retry with another driver
        // assignDriver(data.rideId, data.pickupLocation);
      } catch (error) {
        console.error("Error processing driver-no-response:", error);
      }
    });

    // Add additional socket logic if needed
  });
};
exports.notifyDriver = async (driverId, rideDetails) => {
  if (!io) {
    console.error("Socket.io is not initialized!");
    return;
  }
  await logNotifiedDriver(rideDetails.rideId, driverId);
  io.to(driverId).emit("ride-request", rideDetails);
};

exports.emitRideUpdate = (rideId, data) => {
  if (!io) {
    console.error("Socket.io is not initialized!");
    return;
  }
  io.to(rideId).emit("ride-update", data);
};

exports.broadcastRideCreation = (rideId) => {
  if (!io) {
    console.error("Socket.io is not initialized!");
    return;
  }
  io.emit("ride-created", rideId);
};

// exports.broadcastRideRequestToAvailableDrivers = (rideDetails) => {
//   if (!io) {
//     console.error("Socket.io is not initialized!");
//     return;
//   }
//   console.log("Broadcasting ride request to available drivers:", rideDetails);
//   io.to("available-drivers").emit("ride-request", rideDetails);
// };
exports.broadcastRideRequestToAvailableDrivers = async (rideDetails) => {
  if (!io) {
    console.error("Socket.io is not initialized!");
    return;
  }

  // Fetch available drivers based on the pickup location.
  const availableDrivers = await getAvailableDrivers(
    rideDetails.pickupLocation
  );

  // Extract the driver IDs from the result.
  const driverIds = availableDrivers.map((driver) => driver.id);

  console.log("Broadcasting ride request to available drivers:", rideDetails);

  // Emitting the request to each driver individually
  for (let driverId of driverIds) {
    io.to(driverId).emit("ride-request", rideDetails);
    await logNotifiedDriver(rideDetails.rideId, driverId);
  }
};

exports.removeDriverFromAvailable = (driverId) => {
  const socket = io.sockets.connected[driverId];
  if (socket) {
    socket.leave("available-drivers");
    console.log(`Driver ${driverId} is no longer available.`);
  }
};
async function decideLocation(pickupLocation, dropoffLocation) {
  console.log("decode", pickupLocation);
  console.log("decode", dropoffLocation);

  const pickupCoordinates = pickupLocation.coordinates;
  const dropoffCoordinates = dropoffLocation.coordinates;

  const pickupPoint = { type: "Point", coordinates: pickupCoordinates };
  const dropoffPoint = { type: "Point", coordinates: dropoffCoordinates };

  try {
    const pickupLocationResult = await Location.findOne({
      where: sequelize.literal(
        `ST_Contains(geometry, ST_GeomFromGeoJSON('${JSON.stringify(
          pickupPoint
        )}'))`
      ),
    });

    const dropoffLocationResult = await Location.findOne({
      where: sequelize.literal(
        `ST_Contains(geometry, ST_GeomFromGeoJSON('${JSON.stringify(
          dropoffPoint
        )}'))`
      ),
    });

    if (pickupLocationResult || dropoffLocationResult) {
      return pickupLocationResult
        ? pickupLocationResult.name
        : dropoffLocationResult.name;
    }
  } catch (error) {
    console.error("Error deciding location:", error);
  }

  return "Other";
}

const getAvailableDrivers = async (pickupLocation, excludeDriverIds = []) => {
  return Driver.findAll({
    where: {
      id: { [Op.notIn]: excludeDriverIds },
      isAvailable: true,
      onlineStatus: {
        [Op.not]: "ON_TRIP",
      },
      [Op.and]: [
        Sequelize.where(
          Sequelize.fn(
            "ST_DWithin",
            Sequelize.col("location"),
            Sequelize.fn(
              "ST_SetSRID",
              Sequelize.fn(
                "ST_MakePoint",
                pickupLocation[0],
                pickupLocation[1]
              ),
              4326
            ),
            10000
          ),
          true
        ),
      ],
    },
    limit: 5,
  });
};
function calculateLoyaltyPoints(fare) {
  // For example, 1 point for every 10 rupees spent
  return Math.floor(fare / 10);
}
function calculateDriverEarnings(actualFare) {
  // Driver gets 80% of the fare
  const driverPercentage = 0.8;
  return actualFare * driverPercentage;
}
app.get("/last-location/:userId", (req, res) => {
  res.json(locations[req.params.userId] || {});
});
