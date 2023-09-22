const driverResponseHandler = async (response, drivers) => {
  if (response.rideId === rideId && response.accepted) {
    driverHasAccepted = true;
    const driver = drivers.find((d) => d.id === response.driverId);
    if (!driver) return;
    await updateDriverAndRide(driver, rideId);
  }
};

module.exports = {
  driverResponseHandler,
};
