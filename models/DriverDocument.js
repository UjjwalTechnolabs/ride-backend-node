module.exports = (sequelize, DataTypes) => {
  const DriverDocument = sequelize.define("DriverDocument", {
    documentType: {
      type: DataTypes.ENUM("LICENSE", "INSURANCE", "VEHICLE_REGISTRATION"),
      allowNull: false,
    },
    documentLink: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    expiryDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    verificationStatus: {
      type: DataTypes.ENUM("VERIFIED", "PENDING", "REJECTED"),
      defaultValue: "PENDING",
    },
  });

  DriverDocument.associate = (models) => {
    DriverDocument.belongsTo(models.Driver, {
      foreignKey: "driverId",
      as: "driver",
    });
  };

  return DriverDocument;
};
