const { VehicleType } = require("../../models");
const { Client } = require("@googlemaps/google-maps-services-js");
const client = new Client({});

exports.calculateFare = async function (distance, vehicleTypeName) {
  const vehicleType = await VehicleType.findOne({
    where: { name: vehicleTypeName },
  });

  if (!vehicleType) {
    console.log("Error: No vehicle type found for", vehicleTypeName);
    return null;
  }

  console.log("Base Fare:", vehicleType.dataValues.baseFare);

  const ratePerKm = 0.5; // As discussed before
  const fare = vehicleType.dataValues.baseFare + distance * ratePerKm;

  console.log("Calculated Fare:", fare);

  return fare;
};

exports.calculateETA = async function (pickupLocation, dropoffLocation) {
  try {
    const response = await client.distancematrix({
      params: {
        origins: [`${pickupLocation[0]},${pickupLocation[1]}`],
        destinations: [`${dropoffLocation[0]},${dropoffLocation[1]}`],
        mode: "driving",
        traffic_model: "best_guess",
        departure_time: "now",
        key: "AIzaSyBLmcwFlQ68ZbfyQXTQql8Im8AO-aofTy4",
      },
    });

    if (
      response.data &&
      response.data.rows[0] &&
      response.data.rows[0].elements[0]
    ) {
      const etaSeconds =
        response.data.rows[0].elements[0].duration_in_traffic.value;
      const etaMins = etaSeconds / 60;
      return Math.round(etaMins);
    } else {
      console.error("Unexpected Google Maps API response:", response.data);
      return NaN;
    }
  } catch (error) {
    console.error("Error fetching ETA from Google Maps:", error);
    if (error.response) {
      console.error("Error response data:", error.response.data);
    }
    return NaN;
  }
};
