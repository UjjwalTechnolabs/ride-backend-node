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

  //try {
  const {
    userId,
    pickupLocation,
    dropoffLocation,
    vehicleTypeId,
    pickupAddress,
    dropoffAddress,
  } = req.body;

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
  const rawDistance =
    getDistance(
      { latitude: pickupLocation[0], longitude: pickupLocation[1] },
      { latitude: dropoffLocation[0], longitude: dropoffLocation[1] }
    ) / 1000;

  let distance;
  let unit;

  const eta = await calculateETA(pickupLocation, dropoffLocation);

  //const fare = await calculateFare(rawDistance, vehicleTypeId);
  const serviceType = vehicleType.name; // Assuming that 'name' is the field containing the service type in VehicleType model

  const location = await decideLocation(pickupLocation, dropoffLocation); // Using await to wait for the decideLocation function

  const fare = await calculateFare(
    rawDistance,
    vehicleTypeId,
    userCurrencyCode,
    serviceType,
    location
  );
  console.log(fare);

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
      fuelConsumption: rawDistance * vehicleType.fuelConsumption,
      pickupAddress: pickupAddress,
      dropoffAddress: dropoffAddress,
    },
    { transaction }
  );
  var withCurrencySybolFare = userCurrencyCode + ":" + fare;
  var timing = `${eta} mins`;
  // This should ideally be fetched from the user's record or another source.
  // const userFcmToken = user.fcmToken;
  // const notificationSent = await rideNotificationService.sendRideConfirmation(
  //   userFcmToken
  // );

  // if (!notificationSent) {
  //   console.warn("Failed to send confirmation notification.");
  //   // Depending on your requirements, you might want to rollback the transaction here.
  // }

  //const settings = countrySettings[userCurrencyCode];
  const settings = userCurrencyCode || countrySettings[userCountry].currency;
  if (!settings) {
    console.error("No country settings found for:", userCurrencyCode);
    // handle this scenario, e.g., default to metric or throw an error
    return;
  }

  if (settings.unit === "imperial") {
    // Convert meters to miles for distance > 1000 meters.
    // For distance < 1000 meters, keep it in meters.
    if (rawDistance < 1000) {
      distance = rawDistance;
      unit = "meter";
    } else {
      distance = (rawDistance / 1000) * 0.621371;
      unit = distance === 1 ? "mile" : "miles"; // Singular vs Plural
    }
  } else {
    // metric
    if (rawDistance < 1000) {
      distance = rawDistance;
      unit = "meter";
    } else {
      distance = rawDistance / 1000;
      unit = distance === 1 ? "km" : "kms"; // Singular vs Plural
    }
  }
  var dis = distance + " " + unit;

  const BASE_IMAGE_URL = "https://yourserver.com/images/";
  let userName = "";
  if (user.first_name && user.last_name) {
    userName = `${user.first_name} ${user.last_name}`;
  } else if (user.first_name) {
    userName = user.first_name;
  } else if (user.last_name) {
    userName = user.last_name;
  }

  // Fetch the profile image URL
  const profileImageUrl = user.profile_image
    ? BASE_IMAGE_URL + user.profile_image
    : null;

  // Mock fetching user rating
  // TODO: Replace with your actual method of fetching user rating when implemented
  const getUserRating = (userId) => {
    // This is a mock function, replace it with your actual logic.
    return 4.5; // Example: returning a static 4.5 rating for now.
  };
  const userRating = getUserRating(userId);

  await transaction.commit();
  await assignDriver(
    newRide.id,
    vehicleTypeId,
    pickupLocation,
    dropoffLocation,
    pickupAddress,
    dropoffAddress,
    withCurrencySybolFare,
    timing,
    dis,
    profileImageUrl, // Added this
    userRating,
    userName
  );

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
  // } catch (err) {
  //   await transaction.rollback();
  //   res.status(500).json({
  //     status: "fail",
  //     message: "An error occurred while booking the ride.",
  //   });
  // }
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
const countrySettings = {
  US: {
    unit: "imperial", // Most measurements in the US are in imperial units.
    currency: "USD",
    language: "en-US",
  },
  FR: {
    unit: "metric", // European countries mostly use metric units.
    currency: "EUR",
    language: "fr-FR",
  },
  IN: {
    unit: "metric", // India uses metric units for most measurements.
    currency: "INR",
    language: "hi-IN", // Note: India has multiple languages, Hindi being the most spoken.
  },
  GB: {
    unit: "imperial", // The UK uses a mix, but miles for distances.
    currency: "GBP",
    language: "en-GB",
  },
  CA: {
    unit: "metric",
    currency: "CAD",
    language: "en-CA",
  },
  DE: {
    unit: "metric",
    currency: "EUR",
    language: "de-DE",
  },
  AU: {
    unit: "metric",
    currency: "AUD",
    language: "en-AU",
  },
  BR: {
    unit: "metric",
    currency: "BRL",
    language: "pt-BR",
  },
  RU: {
    unit: "metric",
    currency: "RUB",
    language: "ru-RU",
  },
  CN: {
    unit: "metric",
    currency: "CNY",
    language: "zh-CN",
  },
  JP: {
    unit: "metric",
    currency: "JPY",
    language: "ja-JP",
  },
  ZA: {
    unit: "metric",
    currency: "ZAR",
    language: "en-ZA",
  },
  MX: {
    unit: "metric",
    currency: "MXN",
    language: "es-MX",
  },
  // ... you can continue to add more countries as needed.
};
exports.getAllTrips = async (req, res) => {
  try {
    const rides = await Ride.findAll({
      include: [
        {
          model: User,
          as: "user",
          attributes: ["first_name", "last_name"], // Only fetch the necessary fields
        },
        {
          model: Driver,
          as: "driver",
          attributes: ["name"],
        },
      ],
      order: [
        ["createdAt", "DESC"], // Order by most recent first
      ],
    });
    const formatDate = (dateString) => {
      const months = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      const dateObj = new Date(dateString);
      return `${dateObj.getUTCDate()} ${
        months[dateObj.getUTCMonth()]
      } ${dateObj.getUTCFullYear()}`;
    };
    const formattedRides = rides.map((ride) => {
      return {
        orderId: ride.id,
        created: formatDate(ride.createdAt),
        driverName: ride.driver ? ride.driver.name : "Unknown Driver",
        userName: ride.user
          ? `${ride.user.first_name} ${ride.user.last_name}`
          : "Unknown User",

        distance: ride.distanceFormatted || ride.distance, // Use formatted distance or default to raw value
        amount: ride.fareFormatted || ride.fare, // Use formatted fare or default to raw value

        // Add this if you have discounts in your DB
        status: ride.status,
        paymentMode: ride.paymentMode, // Add this if you have payment modes in your DB
        // Add other necessary fields
      };
    });

    return res.status(200).json(formattedRides);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
