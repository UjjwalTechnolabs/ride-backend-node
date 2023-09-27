const {
  Ride,
  User,
  VehicleType,
  Driver,
  sequelize,
  LoyaltyPoints,
  Location,
} = require("../../models");
const { calculateFare, calculateETA } = require("../utils/fareUtils");
const { getDistance } = require("geolib");
const rideNotificationService = require("../services/rideNotificationService");
const { assignDriver } = require("../services/driverService");
const { getDriverDetails } = require("../services/userNotificationService");
const {
  emitRideUpdate,
  broadcastRideCreation,
} = require("../services/socketService");
//const PayBrazil = require("paybrazil");

exports.bookRide = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { userId, pickupLocation, dropoffLocation, vehicleTypeId } = req.body;

    const vehicleType = await VehicleType.findOne(
      {
        where: { id: vehicleTypeId },
      },
      { transaction }
    );

    if (!vehicleType) {
      await transaction.rollback();
      return res.status(400).json({
        status: "fail",
        message: "Vehicle type does not exist.",
      });
    }

    const user = await User.findByPk(userId, { transaction });
    if (!user) {
      await transaction.rollback();
      return res.status(400).json({
        status: "fail",
        message: "User does not exist.",
      });
    }
    const userCurrencyCode = user.currency_code;
    const distance =
      getDistance(
        { latitude: pickupLocation[0], longitude: pickupLocation[1] },
        { latitude: dropoffLocation[0], longitude: dropoffLocation[1] }
      ) / 1000;

    const eta = await calculateETA(pickupLocation, dropoffLocation);
    if (isNaN(eta)) {
      await transaction.rollback();
      return res.status(500).json({
        status: "error",
        message: "Failed to calculate ETA.",
      });
    }

    //const fare = await calculateFare(distance, vehicleTypeId);
    const serviceType = vehicleType.name; // Assuming that 'name' is the field containing the service type in VehicleType model

    const location = await decideLocation(pickupLocation, dropoffLocation); // Using await to wait for the decideLocation function

    const fare = await calculateFare(
      distance,
      vehicleTypeId,
      userCurrencyCode,
      serviceType,
      location
    );

    const pointsToAdd = Math.floor(fare / 10); // ₹100 की राइड पर 10 पॉइंट्स मिलेंगे, इसलिए fare को 10 से डिवाइड करते हैं।
    let loyaltyPoints = await LoyaltyPoints.findOne(
      {
        where: { userId },
      },
      { transaction }
    );

    if (!loyaltyPoints) {
      loyaltyPoints = await LoyaltyPoints.create(
        { userId, points: pointsToAdd },
        { transaction }
      );
    } else {
      loyaltyPoints.points += pointsToAdd;
      await loyaltyPoints.save({ transaction });
    }

    const newRide = await Ride.create(
      {
        userId,
        pickupLocation: { type: "Point", coordinates: pickupLocation },
        dropoffLocation: { type: "Point", coordinates: dropoffLocation },
        vehicleTypeKey: vehicleType.id,
        fare: fare,
        ETA: `${eta} mins`,
        requestedAt: new Date(),
        fuelConsumption: distance * vehicleType.fuelConsumption,
      },
      { transaction }
    );

    const userFcmToken = "..."; // This should ideally be fetched from the user's record or another source.

    // const notificationSent = await rideNotificationService.sendRideConfirmation(
    //   userFcmToken
    // );

    // if (!notificationSent) {
    //   console.warn("Failed to send confirmation notification.");
    //   // Depending on your requirements, you might want to rollback the transaction here.
    // }

    await transaction.commit();
    await assignDriver(newRide.id, pickupLocation);
    //broadcastRideCreation(newRide.id);
    res.status(201).json({
      status: "success",
      data: {
        ride: {
          id: newRide.id,
          pickupLocation: newRide.pickupLocation.coordinates,
          dropoffLocation: newRide.dropoffLocation.coordinates,
          vehicleType: vehicleType.name,
          fare: newRide.fare,
          ETA: newRide.ETA,
          status: newRide.status,
        },
      },
    });
  } catch (err) {
    await transaction.rollback();
    res.status(500).json({
      status: "fail",
      message: "An error occurred while booking the ride.",
    });
  }
};

exports.acceptRide = async (req, res) => {
  const { rideId, driverId } = req.body;

  try {
    // Update the ride status in the database
    const ride = await Ride.findByPk(rideId);
    ride.status = "Driver Accepted";
    ride.driverId = driverId;
    await ride.save();

    const driverDetails = await getDriverDetails(driverId); // Get driver details from your models or services

    // Notify the rider with driver details
    emitRideUpdate(rideId, "driver-accepted", driverDetails);

    // Firebase notification to the rider
    const riderToken = await getRiderFirebaseToken(ride.riderId); // You need to implement this
    sendNotification(
      riderToken,
      "Driver Accepted!",
      `Your driver is ${driverDetails.name}`
    );

    res.sendStatus(200);
  } catch (error) {
    console.error("Error accepting ride:", error);
    res.status(500).send("Error accepting ride");
  }
};
exports.updateDriverLocation = (req, res) => {
  const { rideId, location } = req.body;

  try {
    // Send real-time location updates to the rider
    emitRideUpdate(rideId, "driver-location-update", location);

    res.sendStatus(200);
  } catch (error) {
    console.error("Error updating driver location:", error);
    res.status(500).send("Error updating driver location");
  }
};
exports.endRide = async (req, res) => {
  const { rideId, paymentMethod, paymentDetails } = req.body;

  try {
    const ride = await Ride.findByPk(rideId);
    ride.status = "Completed";
    await ride.save();

    let paymentSuccess = false;

    switch (paymentMethod) {
      case "Cash":
        paymentSuccess = await processCashPayment(ride);
        break;
      case "Boleto":
        paymentSuccess = await processBoletoPayment(ride, paymentDetails);
        break;
      case "Pix":
        paymentSuccess = await processPixPayment(ride, paymentDetails);
        break;
      default:
        console.error("Unknown payment method");
    }

    if (!paymentSuccess) {
      res.status(500).send("Payment failed");
      return;
    }

    // Notify the rider that the ride is completed
    emitRideUpdate(rideId, "ride-status-update", "Completed");

    // Firebase notification to the rider
    const riderToken = await getRiderFirebaseToken(ride.riderId);
    sendNotification(
      riderToken,
      "Ride Completed!",
      `Thank you for choosing our service.`
    );

    res.sendStatus(200);
  } catch (error) {
    console.error("Error ending the ride:", error);
    res.status(500).send("Error ending the ride");
  }
};

async function getRiderFirebaseToken(riderId) {
  const user = await User.findByPk(riderId);
  return user ? user.firebaseToken : null;
}
async function processCashPayment(ride) {
  // Update ride payment status
  ride.paymentStatus = "Cash";
  await ride.save();

  // Notify the driver
  emitRideUpdate(rideId, "payment-method-update", "Cash");

  return true;
}

async function processBoletoPayment(ride, boletoDetails) {
  const paymentResponse = await PayBrazil.createBoleto(boletoDetails);

  if (paymentResponse.success) {
    ride.paymentStatus = "Boleto";
    await ride.save();
    return true;
  } else {
    console.error(`Boleto payment failed for Ride ID: ${ride.id}`);
    return false;
  }
}

async function processPixPayment(ride, pixDetails) {
  const paymentResponse = await PayBrazil.createPix(pixDetails);

  if (paymentResponse.success) {
    ride.paymentStatus = "Pix";
    await ride.save();
    return true;
  } else {
    console.error(`Pix payment failed for Ride ID: ${ride.id}`);
    return false;
  }
}

exports.getCurrentRide = async (req, res) => {
  try {
    const userId = req.params.userId; // Assuming you're passing userId as a parameter
    const currentRide = await Ride.findOne({
      where: {
        userId: userId,
        status: "PENDING", // or whichever status you use for ongoing rides
      },
      include: [
        {
          model: Driver,
          as: "driver",
        },
        {
          model: VehicleType,
          as: "vehicleType",
        },
      ],
    });

    if (!currentRide) {
      return res
        .status(404)
        .send({ message: "No ongoing ride found for the user" });
    }

    res.send(currentRide);
  } catch (error) {
    console.error("Error fetching current ride:", error);
    res.status(500).send({ message: "Server error" });
  }
};

exports.updateFareAfterRideCompletion = async (rideId, actualDistance) => {
  try {
    const ride = await Ride.findByPk(rideId);
    if (!ride) {
      throw new Error("Ride does not exist.");
    }

    const newFare = await calculateFare(actualDistance, ride.vehicleTypeKey);
    ride.fare = newFare;
    await ride.save();

    return ride;
  } catch (err) {
    throw err;
  }
};

exports.completeRide = async (req, res) => {
  try {
    const { rideId, actualDistance } = req.body;

    const updatedRide = await this.updateFareAfterRideCompletion(
      rideId,
      actualDistance
    );

    const updatedEta = await calculateETA(
      {
        lat: updatedRide.pickupLocation.coordinates[1],
        lng: updatedRide.pickupLocation.coordinates[0],
      },
      {
        lat: updatedRide.dropoffLocation.coordinates[1],
        lng: updatedRide.dropoffLocation.coordinates[0],
      }
    );
    updatedRide.ETA = `${updatedEta} mins`;
    await updatedRide.save();

    // Add loyalty points for the user based on fare
    const pointsToAdd = calculateLoyaltyPoints(updatedRide.fare);

    let loyaltyPoints = await LoyaltyPoints.findOne({
      where: { userId: updatedRide.userId },
    });

    if (!loyaltyPoints) {
      loyaltyPoints = await LoyaltyPoints.create({
        userId: updatedRide.userId,
        points: pointsToAdd,
      });
    } else {
      loyaltyPoints.points += pointsToAdd;
      await loyaltyPoints.save();
    }

    res.status(200).json({
      status: "success",
      data: {
        ride: {
          id: updatedRide.id,
          pickupLocation: updatedRide.pickupLocation.coordinates,
          dropoffLocation: updatedRide.dropoffLocation.coordinates,
          vehicleType: updatedRide.vehicleTypeKey,
          fare: updatedRide.fare,
          ETA: updatedRide.ETA,
          status: updatedRide.status,
        },
        loyaltyPoints: loyaltyPoints.points, // Including the updated loyalty points in the response
      },
    });
  } catch (error) {
    res.status(500).json({
      status: "fail",
      message: error.message,
    });
  }
};
function calculateLoyaltyPoints(fare) {
  // For example, 1 point for every 10 rupees spent
  return Math.floor(fare / 10);
}

async function decideLocation(pickupLocation, dropoffLocation) {
  const pickupPoint = { type: "Point", coordinates: pickupLocation };
  const dropoffPoint = { type: "Point", coordinates: dropoffLocation };

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
