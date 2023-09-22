module.exports = (sequelize, DataTypes) => {
  const Rating = sequelize.define("Rating", {
    ratingValue: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    comment: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    date: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  });

  Rating.associate = (models) => {
    Rating.belongsTo(models.Driver, {
      foreignKey: "driverId",
      as: "driver",
    });
    Rating.belongsTo(models.Ride, {
      foreignKey: "rideId",
      as: "ride",
    });
  };

  return Rating;
};
