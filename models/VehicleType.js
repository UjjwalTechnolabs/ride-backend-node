module.exports = (sequelize, DataTypes) => {
  const VehicleType = sequelize.define("VehicleType", {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    baseFare: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    averageSpeed: {
      type: DataTypes.INTEGER, // Speed in km/h
      allowNull: false,
    },
    fuelConsumption: {
      // Added this field
      type: DataTypes.FLOAT, // Fuel consumption per km
      allowNull: false,
    },
    // ... any other configurations/attributes
  });

  VehicleType.associate = (models) => {
    VehicleType.hasMany(models.Ride, {
      foreignKey: "vehicleTypeId",
      as: "rides",
    });
  };

  return VehicleType;
};
