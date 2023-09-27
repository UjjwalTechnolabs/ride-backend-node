// models/cancellation.js

module.exports = (sequelize, DataTypes) => {
  const Cancellation = sequelize.define("Cancellation", {
    reason: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    rideId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  });

  Cancellation.associate = (models) => {
    Cancellation.belongsTo(models.Ride, {
      foreignKey: "rideId",
      as: "ride",
    });
  };

  return Cancellation;
};
