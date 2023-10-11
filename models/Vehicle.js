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

    energyTypeId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "EnergyTypes", // name of the table in the database
        key: "id",
      },
    },
    vehicleTypeId: {
      // New column
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "VehicleTypes",
        key: "id",
      },
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
    Vehicle.belongsTo(models.EnergyType, {
      foreignKey: "energyTypeId",
      as: "energySourceType", // changed alias name
    });
  };

  return Vehicle;
};
