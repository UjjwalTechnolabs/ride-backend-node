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
  Vehicle,
  Currency,
} = require("../../models");
const { Op, Sequelize, Transaction } = require("sequelize");

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
const { sendRideConfirmationToDriver } = require("./rideNotificationService");
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
      console.log(driverId);
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
        console.log(
          `Processing rideCompleted for Driver ID: ${actualDriverId}, Ride ID: ${data.rideId}`
        );

        // Fetch the ride
        const ride = await Ride.findByPk(data.rideId);
        if (!ride) {
          console.error(`Ride not found for ID: ${data.rideId}`);
          return;
        }

        // Process location
        console.log(data);
        // const receivedLocationString = data.dropoffLocation;
        // const parsedLocation = parseLocation(receivedLocationString);
        const receivedDropoff = {
          type: "Point",
          coordinates: data.dropoffLocation.reverse(),
        };
        ride.dropoffLocation = receivedDropoff;

        const result = await calculateETAFinal(
          ride.pickupLocation.coordinates,
          ride.dropoffLocation.coordinates
        );

        if (!result || !result.distance) {
          console.error(`Failed to calculate ETA for Ride ID: ${data.rideId}`);
          return;
        }

        const vehicleType = await VehicleType.findOne({
          where: { id: ride.vehicleTypeKey },
        });

        if (!vehicleType) {
          console.error(
            `Vehicle type not found for ID: ${ride.vehicleTypeKey}`
          );
          return;
        }
        const serviceType = vehicleType.name;

        const user = await User.findByPk(ride.userId);
        if (!user) {
          console.error(`User not found for ID: ${ride.userId}`);
          return;
        }

        const location = await decideLocation(
          ride.pickupLocation,
          ride.dropoffLocation
        );
        const actualFare = await calculateFare(
          result.distance,
          ride.vehicleTypeKey,
          user.currency_code,
          serviceType,
          location
        );

        // Update Driver Earnings
        const earnings = calculateDriverEarnings(actualFare);
        await DriverEarnings.create({
          driverId: actualDriverId,
          rideId: data.rideId,
          earnings: earnings,
        });
        console.log(
          `Earnings updated for Driver ID: ${actualDriverId}, Ride ID: ${data.rideId}`
        );
        // This will come from your user's data
        const distanceUnit = getUnitByCurrency(user.currency_code);

        const currencyDetails = await Currency.findByPk(user.currency_code);
        if (!currencyDetails) {
          console.error(`Currency not found for code: ${user.currency_code}`);
          return;
        }
        console.log(result.distance);
        const formattedFare = formatAmount(actualFare, currencyDetails.symbol);
        const formattedDistance = formatDistance(
          parseFloat(result.distance),
          distanceUnit
        );

        // Calculate ETA and Update Ride table
        const etaString = `${result.eta} mins`;
        await Ride.update(
          {
            dropoffLocation: receivedDropoff,
            status: "COMPLETED",
            fare: actualFare,
            ETA: etaString,
            distance: result.distance,
            pickedUpAt: new Date(),
            fareFormatted: formattedFare,
            distanceFormatted: formattedDistance,
          },
          { where: { id: data.rideId } }
        );

        console.log(
          `Ride status updated to COMPLETED for Ride ID: ${data.rideId}`
        );

        // Update Loyalty Points
        const pointsToAdd = calculateLoyaltyPoints(actualFare);
        let loyaltyPoints = await LoyaltyPoints.findOne({
          where: { userId: ride.userId },
        });

        if (!loyaltyPoints) {
          loyaltyPoints = await LoyaltyPoints.create({
            userId: ride.userId,
            points: pointsToAdd,
          });
          console.log(`Loyalty points created for User ID: ${ride.userId}`);
        } else {
          loyaltyPoints.points += pointsToAdd;
          await loyaltyPoints.save();
          console.log(`Loyalty points updated for User ID: ${ride.userId}`);
        }

        // Update NotifiedDriver table and Driver status
        await NotifiedDriver.update(
          { status: "accepted" },
          { where: { rideRequestId: data.rideId, driverId: actualDriverId } }
        );
        console.log(
          `NotifiedDriver status updated for Driver ID: ${actualDriverId}, Ride ID: ${data.rideId}`
        );

        await Driver.update(
          { onlineStatus: "ONLINE" },
          { where: { id: actualDriverId } }
        );
        console.log(
          `Driver status set to ONLINE for Driver ID: ${actualDriverId}`
        );

        // Emit event to frontend
        io.to(data.rideId).emit("ride-completed", {
          rId: data.rideId,
          driverId: actualDriverId,
        });

        socket.leave(`chat:${data.rideId}`);
        console.log(
          `Driver ${actualDriverId} left chat room for Ride ID: ${data.rideId}`
        );
        console.log(
          `Driver ${actualDriverId} has completed ride ${data.rideId}`
        );
      } catch (error) {
        console.error(
          `Error processing rideCompleted for Ride ID: ${data.rideId}:`,
          error
        );
      }
    });

    socket.on("rideResponse", (response) => {
      // Send this response to Kafka or directly process it
      kafkaService.processDriverResponse(response); // This function can be in kafkaService or another service that deals with driver responses
    });

    // socket.on("driver-response", async (data) => {
    //   try {
    //     const driverId = driverSocketMap[socket.id];

    //     await updateDriverStatusForRide(
    //       data.rideId,
    //       data.driverId,
    //       data.status
    //     );

    //     if (data.status === "accepted") {
    //       console.log(
    //         `Driver ${data.driverId} is attempting to accept the ride.`
    //       );

    //       const result = await sequelize.transaction(async (t) => {
    //         const existingRide = await Ride.findOne({
    //           where: {
    //             id: data.rideId,
    //             driverId: null,
    //           },
    //           lock: Transaction.LOCK.UPDATE,
    //           transaction: t,
    //         });

    //         if (!existingRide) {
    //           console.log(
    //             `Ride ${data.rideId} was already accepted by another driver.`
    //           );
    //           io.to(socket.id).emit("ride-already-accepted", {
    //             rideId: data.rideId,
    //             message:
    //               "Sorry, this ride was already accepted by another driver.",
    //           });
    //           return;
    //         }

    //         const [updatedRows] = await Ride.update(
    //           { driverId: driverId },
    //           {
    //             where: { id: data.rideId },
    //             transaction: t,
    //           }
    //         );

    //         if (updatedRows > 0) {
    //           await NotifiedDriver.update(
    //             { status: "accepted" },
    //             {
    //               where: {
    //                 rideRequestId: data.rideId,
    //                 driverId: data.driverId,
    //               },
    //               transaction: t,
    //             }
    //           );

    //           await Driver.update(
    //             { onlineStatus: "ON_TRIP" },
    //             {
    //               where: { id: data.driverId },
    //               transaction: t,
    //             }
    //           );

    //           io.to(socket.id).emit("ride-accepted", {
    //             rideId: data.rideId,
    //             driverId: data.driverId,
    //             message: "Your ride has been accepted!",
    //           });

    //           handleDriverAcceptance(data.rideId);

    //           // Notify other drivers that the ride was accepted by another driver
    //           const notifiedDrivers = await getNotifiedDriversForRide(
    //             data.rideId
    //           );
    //           for (let otherDriver of notifiedDrivers) {
    //             if (otherDriver.id !== data.driverId) {
    //               io.to(otherDriver.id).emit("ride-accepted-by-other", {
    //                 rideId: data.rideId,
    //                 message: "ACCEPTED_BY_OTHER",
    //               });
    //             }
    //           }
    //         } else {
    //           console.log(
    //             `Driver ${data.driverId} attempted to accept the ride ${data.rideId}, but it was already accepted by another driver.`
    //           );
    //         }
    //       });
    //     } else if (data.status === "rejected") {
    //       console.log(`Driver ${data.driverId} has rejected the ride.`);
    //     }
    //   } catch (error) {
    //     console.error("Error processing driver-response:", error);
    //   }
    // });working 3
    // Ensure updateDriverStatusForRide uses a transaction instance.

    socket.on("driver-response", async (data) => {
      try {
        const driverId = driverSocketMap[socket.id];

        if (data.status === "accepted") {
          console.log(
            `Driver ${data.driverId} is attempting to accept the ride.`
          );

          await sequelize.transaction(async (t) => {
            // 1. Update driver's status for the ride within the transaction.
            await updateDriverStatusForRide(
              data.rideId,
              data.driverId,
              data.status,
              t // Pass the transaction instance to your function
            );

            const existingRide = await Ride.findOne({
              where: {
                id: data.rideId,
                driverId: null,
              },
              lock: Transaction.LOCK.UPDATE,
              transaction: t,
            });

            if (!existingRide) {
              console.log(
                `Ride ${data.rideId} was already accepted by another driver.`
              );
              io.to(socket.id).emit("ride-already-accepted", {
                rideId: data.rideId,
                message:
                  "Sorry, this ride was already accepted by another driver.",
              });
              return;
            }

            const [updatedRows] = await Ride.update(
              { driverId: driverId },
              {
                where: { id: data.rideId },
                transaction: t,
              }
            );

            if (updatedRows > 0) {
              await NotifiedDriver.update(
                { status: "accepted" },
                {
                  where: {
                    rideRequestId: data.rideId,
                    driverId: data.driverId,
                  },
                  transaction: t,
                }
              );

              await Driver.update(
                { onlineStatus: "ON_TRIP" },
                {
                  where: { id: data.driverId },
                  transaction: t,
                }
              );

              io.to(socket.id).emit("ride-accepted", {
                rideId: data.rideId,
                driverId: data.driverId,
                message: "Your ride has been accepted!",
              });

              handleDriverAcceptance(data.rideId);

              // Notify other drivers that the ride was accepted by another driver
              const notifiedDrivers = await getNotifiedDriversForRide(
                data.rideId
              );
              for (let otherDriver of notifiedDrivers) {
                if (otherDriver.id !== data.driverId) {
                  io.to(otherDriver.id).emit("ride-accepted-by-other", {
                    rideId: data.rideId,
                    message: "ACCEPTED_BY_OTHER",
                  });
                }
              }
            } else {
              console.log(
                `Driver ${data.driverId} attempted to accept the ride ${data.rideId}, but it was already accepted by another driver.`
              );
            }
          });
        } else if (data.status === "rejected") {
          console.log(`Driver ${data.driverId} has rejected the ride.`);
          // You might also want to handle the rejection within a transaction if necessary.
        }
      } catch (error) {
        console.error("Error processing driver-response:", error);
      }
    });

    // socket.on("driver-response", async (data) => {
    //   try {
    //     const driverId = driverSocketMap[socket.id];
    //     // Update the NotifiedDriver table status
    //     await updateDriverStatusForRide(
    //       data.rideId,
    //       data.driverId,
    //       data.status
    //     );

    //     if (data.status === "accepted") {
    //       // ... existing acceptance code ...
    //       console.log(`Driver ${data.driverId} has accepted the ride.`);
    //       // Notify the user about the driver's acceptance
    //       await NotifiedDriver.update(
    //         { status: "accepted" },
    //         {
    //           where: {
    //             rideRequestId: data.rideId,
    //             driverId: data.driverId,
    //           },
    //         }
    //       );
    //       await Driver.update(
    //         { onlineStatus: "ON_TRIP" },
    //         { where: { id: data.driverId } }
    //       );
    //       await Ride.update(
    //         { driverId: driverId },
    //         { where: { id: data.rideId } }
    //       );

    //       io.to("available-drivers").emit("ride-accepted", {
    //         rideId: data.rideId,
    //         driverId: data.driverId,
    //         message: "Your ride has been accepted!",
    //       });

    //       handleDriverAcceptance(data.rideId);
    //     } else if (data.status === "rejected") {
    //       console.log(`Driver ${data.driverId} has rejected the ride.`);
    //       // if (!driversAttempted[data.rideId]) {
    //       //   driversAttempted[data.rideId] = [];
    //       // }
    //       // driversAttempted[data.rideId].push(data.driverId);

    //       // Retry with another driver
    //       // assignDriver(data.rideId, data.pickupLocation);
    //     }
    //   } catch (error) {
    //     console.error("Error processing driver-response:", error);
    //   }
    // });

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

exports.broadcastRideRequestToAvailableDrivers = async (rideDetails) => {
  if (!io) {
    console.error("Socket.io is not initialized!");
    return;
  }

  const availableDrivers = await getAvailableDrivers(
    rideDetails.pickupLocation,
    rideDetails.vehicleTypeId
  );
  delete rideDetails.drivers;

  console.log("Broadcasting ride request to available drivers:", rideDetails);

  // Use Promise.all to send notifications in parallel
  await Promise.all(
    availableDrivers.map(async (driver) => {
      try {
        const isNotificationSent = await sendRideConfirmationToDriver(
          driver.fcmToken
        );

        if (isNotificationSent) {
          const dataToEmit = {
            rideId: rideDetails.rideId,
            pickupLocation: rideDetails.pickupLocation,
            dropoffLocation: rideDetails.dropoffLocation,
            pickupAddress: rideDetails.pickupAddress,
            dropoffAddress: rideDetails.dropoffAddress,
            pickupAddress: rideDetails.pickupAddress,
            withCurrencySybolFare: rideDetails.withCurrencySybolFare,
            timing: rideDetails.timing,
            distance: rideDetails.distance,
            profileImageUrl: rideDetails.profileImageUrl, // Added this
            userRating: rideDetails.userRating,
            userName: rideDetails.userName,
            // ... other fields as needed
          };

          io.to(driver.id).emit("ride-request", dataToEmit);
          await logNotifiedDriver(rideDetails.rideId, driver.id);
        } else {
          console.warn(
            `Failed to send notification to driver with ID: ${driver.id}`
          );
        }
      } catch (error) {
        console.error(
          `Error while processing driver with ID: ${driver.id}`,
          error
        );
      }
    })
  );
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

// const getAvailableDrivers = async (pickupLocation, excludeDriverIds = []) => {
//   return Driver.findAll({
//     attributes: ["id", "fcmToken"],
//     where: {
//       id: { [Op.notIn]: excludeDriverIds },
//       isAvailable: true,
//       // onlineStatus: {
//       //   [Op.not]: "ON_TRIP",
//       // },
//       [Op.and]: [
//         Sequelize.where(
//           Sequelize.fn(
//             "ST_DWithin",
//             Sequelize.col("location"),
//             Sequelize.fn(
//               "ST_SetSRID",
//               Sequelize.fn(
//                 "ST_MakePoint",
//                 pickupLocation[0],
//                 pickupLocation[1]
//               ),
//               4326
//             ),
//             10000
//           ),
//           true
//         ),
//       ],
//     },
//     limit: 30,
//   });
// };
const getAvailableDrivers = async (
  pickupLocation,
  vehicleTypeId,
  excludeDriverIds = []
) => {
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
    include: [
      {
        model: Vehicle, // Assuming you have the vehicle model initialized and available
        as: "vehicle", // You may need to check the actual alias you have in your setup.
        where: {
          vehicleTypeId: vehicleTypeId,
        },
      },
    ],
    limit: 30,
  });
};
async function getNotifiedDriversForRide(rideId) {
  try {
    const notifiedDrivers = await NotifiedDriver.findAll({
      where: {
        rideRequestId: rideId,
      },
      include: [
        {
          model: Driver, // Assuming you've imported the Driver model at the top
          as: "driver",
        },
      ],
    });

    return notifiedDrivers.map((notification) => notification.driver);
  } catch (error) {
    console.error("Error fetching notified drivers:", error);
    return [];
  }
}
function calculateLoyaltyPoints(fare) {
  // For example, 1 point for every 10 rupees spent
  return Math.floor(fare / 10);
}
function calculateDriverEarnings(actualFare) {
  // Driver gets 80% of the fare
  const driverPercentage = 0.8;
  return actualFare * driverPercentage;
}
function formatAmount(amount, symbol) {
  return `${symbol}${amount.toFixed(2)}`; // assuming you want two decimal places
}
function getUnitByCurrency(currencyCode) {
  const milesCurrencies = ["USD", "GBP"];
  return milesCurrencies.includes(currencyCode) ? "miles" : "km";
}
function formatDistance(distance, unit = "km") {
  console.log(typeof distance, distance);
  if (unit === "miles") {
    distance = distance * 0.621371; // Convert kilometers to miles
    return `${distance.toFixed(2)} miles`;
  }
  // Default to kilometers
  return `${distance.toFixed(2)} km`;
}

const parseLocation = (locationString) => {
  const matches = locationString.match(/\((-?\d+\.\d+),\s*(-?\d+\.\d+)\)/);
  if (matches && matches.length === 3) {
    return [parseFloat(matches[2]), parseFloat(matches[1])]; // Note that we're switching the order to [long, lat]
  } else {
    throw new Error("Invalid location format");
  }
};
async function removeInvalidTokenFromDatabase(fcmToken) {
  try {
    await Driver.destroy({
      where: {
        fcmToken: fcmToken,
      },
    });
    console.log(`Removed invalid FCM token: ${fcmToken}`);
  } catch (error) {
    console.error(`Error removing FCM token ${fcmToken} from database:`, error);
  }
}
app.get("/last-location/:userId", (req, res) => {
  res.json(locations[req.params.userId] || {});
});
