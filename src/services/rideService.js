// services/rideService.js
const { NotifiedDriver } = require("../../models");

exports.logNotifiedDriver = async (rideRequestId, driverId) => {
  try {
    return await NotifiedDriver.create({ rideRequestId, driverId });
  } catch (error) {
    console.error("Error logging notified driver:", error);
    throw error;
  }
};

exports.updateDriverStatusForRide = async (rideRequestId, driverId, status) => {
  try {
    console.log(rideRequestId, driverId, status);
    const record = await NotifiedDriver.findOne({
      where: { rideRequestId, driverId },
    });

    if (!record) {
      throw new Error("Driver-Ride record not found.");
    }

    return await record.update({ status });
  } catch (error) {
    console.error("Error updating driver status for ride:", error);
    throw error;
  }
};
