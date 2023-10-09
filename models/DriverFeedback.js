module.exports = (sequelize, DataTypes) => {
  const DriverFeedback = sequelize.define("DriverFeedback", {
    driverId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    feedback: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
  });

  DriverFeedback.associate = (models) => {
    DriverFeedback.belongsTo(models.Driver, {
      foreignKey: "driverId",
      as: "driver",
    });
    DriverFeedback.belongsTo(models.User, {
      foreignKey: "userId",
      as: "user",
    });
  };

  return DriverFeedback;
};
