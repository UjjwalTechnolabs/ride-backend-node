module.exports = (sequelize, DataTypes) => {
  const Vehicle = sequelize.define("Vehicle", {
    make: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    model: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    year: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    color: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    licensePlateNumber: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    energyType: {
      type: DataTypes.STRING, // electric, hybrid, petrol, etc.
      allowNull: false,
    },
  });

  Vehicle.associate = (models) => {
    Vehicle.belongsTo(models.Driver, {
      foreignKey: "driverId",
      as: "driver",
    });
    Vehicle.belongsTo(models.VehicleType, {
      foreignKey: "vehicleTypeId",
      as: "vehicleType",
    });
  };

  return Vehicle;
};
