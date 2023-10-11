const { Driver, Ride } = require("../../models");
const { Op, Sequelize } = require("sequelize");
const kafkaService = require("./kafkaService");
const socketService = require("./socketService");

const MAX_RETRIES = 3;
let driverHasAccepted = false; // At the top of your service, near your other variables
let driversAttempted = {}; // Keeping track of drivers who've been notified for a particular ride

exports.assignDriver = async (rideId, pickupLocation, dropoffLocation) => {
  let retryCount = 0;

  const initiateDriverSearchAndNotification = async () => {
    // const drivers = await getAvailableDrivers(pickupLocation);
    const drivers = await getAvailableDrivers(
      pickupLocation,
      driversAttempted[rideId]
    );

    if (!drivers || drivers.length === 0) {
      console.warn("No available drivers near the pickup location.");
      return null;
    }

    await kafkaService.notifyAllDriversViaKafka(drivers, {
      rideId,
      pickupLocation,
      dropoffLocation,
    });
    // console.log("Found drivers:", drivers);
    return drivers; // Return drivers list
  };

  const retryFindingDriver = async () => {
    if (!driverHasAccepted && retryCount < MAX_RETRIES) {
      retryCount++;
      console.log(
        `Retry count: ${retryCount}. Trying to find another driver...`
      );
      await initiateDriverSearchAndNotification();

      // Check if driverHasAccepted is still false before scheduling next retry
      if (!driverHasAccepted) {
        setTimeout(retryFindingDriver, 10000);
      }
    } else if (!driverHasAccepted && retryCount >= MAX_RETRIES) {
      console.error(
        "No drivers accepted the ride request after maximum retries."
      );
      socketService.emitRideUpdate(rideId, {
        status: "No Drivers Available",
        message:
          "We are sorry, but no drivers are available at the moment. Please try again later.",
      });
    }
  };

  try {
    await initiateDriverSearchAndNotification();

    // kafkaService.listenForDriverResponses(driverResponseHandler);

    // setTimeout(retryFindingDriver, 10000);
  } catch (error) {
    console.error("Error assigning driver:", error);
    return null;
  }
};

const updateDriverAndRide = async (driver, rideId) => {
  await driver.update({ isAvailable: false });
  await Ride.update({ driverId: driver.id }, { where: { id: rideId } });

  // Notifying the user that a driver has been assigned using Socket.io.
  socketService.emitRideUpdate(rideId, { status: "Driver Assigned", driver });
};
const getAvailableDrivers = async (pickupLocation, excludeDriverIds = []) => {
  return Driver.findAll({
    where: {
      id: { [Op.notIn]: excludeDriverIds },
      isAvailable: true,
      // onlineStatus: {
      //   [Op.not]: "ON_TRIP",
      // },
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
    limit: 10,
  });
};
// ...
// let energyTypeFilter = {};
// if (userPreference === 'eco-friendly') {
//   energyTypeFilter.energyType = { [Op.in]: ['electric', 'hybrid'] };
// }

// return Driver.findAll({
//   where: {
//     isAvailable: true,
//     onlineStatus: {
//       [Op.not]: "ON_TRIP",
//     },
//     [Op.and]: [
//       Sequelize.where(
//         Sequelize.fn(
//           'ST_DWithin',
//           Sequelize.col('location'),
//           Sequelize.fn(
//             'ST_SetSRID',
//             Sequelize.fn(
//               'ST_MakePoint',
//               pickupLocation[0],
//               pickupLocation[1]
//             ),
//             4326
//           ),
//           radius
//         ),
//         true
//       ),
//     ],
//   },
//   include: [{
//     model: Vehicle,
//     as: 'vehicle',
//     include: [{
//       model: VehicleType,
//       as: 'vehicleType',
//       where: energyTypeFilter
//       }
//     }],
//   }],
//   limit: 5,
// });

exports.handleDriverAcceptance = (rideId) => {
  driverHasAccepted = true;
};
