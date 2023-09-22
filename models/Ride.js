// models/Ride.js
module.exports = (sequelize, DataTypes) => {
  const Ride = sequelize.define("Ride", {
    pickupLocation: {
      type: DataTypes.GEOMETRY("POINT"),
      allowNull: false,
    },
    dropoffLocation: {
      type: DataTypes.GEOMETRY("POINT"),
      allowNull: false,
    },
    vehicleTypeKey: {
      type: DataTypes.INTEGER,
      allowNull: true, // Temporarily allow null
      references: {
        model: "VehicleTypes",
        key: "id",
      },
    },
    fare: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    status: {
      type: DataTypes.STRING,
      defaultValue: "PENDING", // or 'COMPLETED', 'CANCELLED', etc.
    },
    ETA: {
      type: DataTypes.STRING, // e.g. "5 mins"
    },
  });

  Ride.associate = (models) => {
    Ride.belongsTo(models.User, {
      foreignKey: "userId",
      as: "user",
    });
    Ride.belongsTo(models.VehicleType, {
      foreignKey: {
        name: "vehicleTypeKey",
        allowNull: false,
      },
      as: "vehicleType",
    });
    Ride.belongsTo(models.Driver, {
      foreignKey: "driverId",
      as: "driver",
    });
  };
  return Ride;
};
