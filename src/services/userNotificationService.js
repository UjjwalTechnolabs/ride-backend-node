const io = require("../server");
const { Driver, Ride } = require("../../models"); // Ensure you have an index.js in the models folder that exports all models

exports.notifyUser = async (rideId, driverDetails) => {
  try {
    // Assume the user's socket connection has a room named after their userId or rideId for simplicity
    io.to(rideId).emit("driverAssigned", driverDetails);
  } catch (error) {
    console.error("Error notifying user:", error);
    throw error; // propagate the error, so caller can handle or log it
  }
};

exports.getDriverDetails = async (driverId) => {
  try {
    const driver = await Driver.findOne({
      where: { id: driverId },
      attributes: ["id", "name", "location", "isAvailable", "onlineStatus"], // Select the fields you need
      include: [
        {
          model: Ride,
          as: "rides",
          attributes: ["id", "status", "pickupLocation", "dropoffLocation"], // Add other ride attributes if necessary
        },
      ],
    });

    if (!driver) {
      throw new Error("Driver not found");
    }

    return driver;
  } catch (error) {
    console.error("Error fetching driver details:", error);
    throw error; // propagate the error, so caller can handle or log it
  }
};
