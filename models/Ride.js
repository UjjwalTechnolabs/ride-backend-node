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
    distance: {
      type: DataTypes.FLOAT,
      allowNull: true, // Allow NULL if you think the distance might not always be provided
      defaultValue: 0,
    },

    pickupAddress: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    dropoffAddress: {
      type: DataTypes.STRING,
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
    paymentMode: {
      type: DataTypes.STRING,
      defaultValue: "CASH",
    },
    fareFormatted: {
      type: DataTypes.STRING,
      allowNull: true, // Allow null initially, you can set this value after fare calculation
    },
    distanceFormatted: {
      type: DataTypes.STRING,
      allowNull: true, // Allow null initially, you can set this value after distance calculation
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
    requestedAt: {
      // Added this column
      type: DataTypes.DATE,
      allowNull: false,
    },
    pickedUpAt: {
      // Added this column
      type: DataTypes.DATE,
      allowNull: true, // This can be null if the driver hasn't picked up the user yet
    },
    fuelConsumption: {
      type: DataTypes.FLOAT,
      allowNull: true, // You might allow this to be NULL if the value can be absent or not known at the time of ride creation.
    },
    version: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
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
