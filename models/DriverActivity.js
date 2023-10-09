// models/DriverActivity.js
module.exports = (sequelize, DataTypes) => {
  const DriverActivity = sequelize.define("DriverActivity", {
    type: {
      type: DataTypes.STRING, // "ONLINE", "OFFLINE", "CANCELLED", "ACCEPTED"
      allowNull: false,
    },
    timestamp: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    driverId: {
      type: DataTypes.INTEGER,
      references: {
        model: "Drivers",
        key: "id",
      },
      allowNull: false,
    },
  });

  DriverActivity.associate = (models) => {
    DriverActivity.belongsTo(models.Driver, {
      foreignKey: "driverId",
      as: "driver",
    });
  };

  return DriverActivity;
};
