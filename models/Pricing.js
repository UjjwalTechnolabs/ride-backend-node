"use strict";
const { DataTypes } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  const Pricing = sequelize.define("Pricing", {
    currencyCode: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    serviceType: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    location: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    peakMultiplier: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 1.0, // 1.0 means no extra charge during peak times
    },
    taxPercent: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
    },
    dynamicPricingEnabled: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    discountPercent: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
    },
    baserate: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.0,
    },
    rateperkm: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.0,
    },
  });
  Pricing.associate = (models) => {
    Pricing.belongsTo(models.Currency, {
      foreignKey: "currencyCode",
      targetKey: "code",
    });
  };
  // Add more fields as per your requirements
  return Pricing;
};
