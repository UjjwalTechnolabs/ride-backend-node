module.exports = (sequelize, DataTypes) => {
  const UserFeedback = sequelize.define("UserFeedback", {
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

  UserFeedback.associate = (models) => {
    UserFeedback.belongsTo(models.Driver, {
      foreignKey: "driverId",
      as: "driver",
    });
    UserFeedback.belongsTo(models.User, {
      foreignKey: "userId",
      as: "user",
    });
  };

  return UserFeedback;
};
