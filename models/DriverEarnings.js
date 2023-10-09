module.exports = (sequelize, DataTypes) => {
  const DriverEarnings = sequelize.define("DriverEarnings", {
    driverId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "Driver",
        key: "id",
      },
    },
    rideId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "Ride",
        key: "id",
      },
    },
    earnings: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
  });

  DriverEarnings.associate = (models) => {
    DriverEarnings.belongsTo(models.Driver, {
      foreignKey: "driverId",
      as: "driver",
    });
    DriverEarnings.belongsTo(models.Ride, {
      foreignKey: "rideId",
      as: "ride",
    });
  };

  return DriverEarnings;
};
