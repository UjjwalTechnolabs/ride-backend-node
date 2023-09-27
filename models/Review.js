module.exports = (sequelize, DataTypes) => {
  const Review = sequelize.define("Review", {
    rating: {
      type: DataTypes.FLOAT,
      allowNull: false,
      validate: {
        min: 1,
        max: 5,
      },
    },
    comment: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  });

  Review.associate = (models) => {
    Review.belongsTo(models.Driver, {
      foreignKey: "driverId",
      as: "driver",
    });
    Review.belongsTo(models.User, {
      foreignKey: "userId",
      as: "users",
    });
  };

  return Review;
};
