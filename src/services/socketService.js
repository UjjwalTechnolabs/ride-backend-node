const { Ride, Driver, NotifiedDriver } = require("../../models");
const { Op, Sequelize } = require("sequelize");
const { handleDriverAcceptance, assignDriver } = require("./driverService");
const {
  updateDriverStatusForRide,
  logNotifiedDriver,
} = require("./rideService");

let io;
let driversAttempted = {};
let driverSocketMap = {}; // Outside the connection listener

exports.initializeSocketIO = (socketIOInstance) => {
  io = socketIOInstance;

  io.on("connection", (socket) => {
    console.log(`User connected with socket ID: ${socket.id}`);

    socket.on("disconnect", (reason) => {
      delete driverSocketMap[socket.id];
      console.log(`Client ${socket.id} disconnected due to: ${reason}`);
    });

    socket.on("identifyDriver", (driverId) => {
      socket.join(driverId);
      driverSocketMap[socket.id] = driverId;
      console.log(`Driver ${driverId} identified.`);
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
      const { rideId } = data;
      const actualDriverId = driverSocketMap[socket.id]; // Get actual driver ID

      console.log(
        `Emitting driver-enroute for rideId: ${rideId} and driverId: ${socket.id}`
      );
      console.log(actualDriverId);
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

    socket.on("rideCompleted", async (rideId) => {
      try {
        const actualDriverId = driverSocketMap[socket.id];
        // Update the Ride table status to 'COMPLETED'
        await Ride.update({ status: "COMPLETED" }, { where: { id: rideId } });

        // Update the NotifiedDriver table status for this driver to 'accepted' for this ride
        // This assumes your ride requests to drivers are stored with a status like 'notified' or 'accepted'
        await NotifiedDriver.update(
          { status: "accepted" },
          { where: { rideRequestId: rideId, driverId: actualDriverId } }
        );
        await Driver.update(
          { onlineStatus: "ONLINE" },
          { where: { id: actualDriverId } } // Assuming the socket ID corresponds to the driver's ID
        );

        io.to(rideId).emit("ride-completed", {
          rideId,
          driverId: actualDriverId,
        });
        delete driverSocketMap[socket.id];
        console.log(`Driver ${actualDriverId} has completed ride ${rideId}`);
      } catch (error) {
        console.error(
          `Error updating status for completed ride ${rideId}:`,
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
