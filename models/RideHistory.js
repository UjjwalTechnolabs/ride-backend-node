module.exports = (sequelize, DataTypes) => {
  const RideHistory = sequelize.define("RideHistory", {
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    driverId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    rideId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    fare: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    distance: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    // Add other ride details columns here
  });

  RideHistory.associate = (models) => {
    RideHistory.belongsTo(models.User, {
      foreignKey: "userId",
      as: "user",
    });
    RideHistory.belongsTo(models.Driver, {
      foreignKey: "driverId",
      as: "driver",
    });
    RideHistory.belongsTo(models.Ride, {
      foreignKey: "rideId",
      as: "ride",
    });
  };

  return RideHistory;
};
