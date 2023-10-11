// models/EnergyType.js
module.exports = (sequelize, DataTypes) => {
  const EnergyType = sequelize.define("EnergyType", {
    type: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
  });

  EnergyType.associate = (models) => {
    EnergyType.hasMany(models.Vehicle, {
      foreignKey: "energyTypeId",
      as: "vehicles",
    });
  };

  return EnergyType;
};
