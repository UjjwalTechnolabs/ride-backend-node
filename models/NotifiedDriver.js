// models/NotifiedDriver.js

module.exports = (sequelize, DataTypes) => {
  const NotifiedDriver = sequelize.define("NotifiedDriver", {
    status: {
      type: DataTypes.ENUM("notified", "accepted", "rejected", "no-response"),
      allowNull: false,
      defaultValue: "notified",
    },
  });

  NotifiedDriver.associate = (models) => {
    NotifiedDriver.belongsTo(models.Ride, {
      foreignKey: "rideRequestId",
      as: "rideRequest",
    });

    NotifiedDriver.belongsTo(models.Driver, {
      foreignKey: "driverId",
      as: "driver",
    });
  };

  return NotifiedDriver;
};
