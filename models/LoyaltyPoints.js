// models/LoyaltyPoints.js

"use strict";
const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const LoyaltyPoints = sequelize.define(
    "LoyaltyPoints",
    {
      userId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        references: {
          model: "users",
          key: "id",
        },
      },
      points: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
    },
    {
      tableName: "loyalty_points",
      timestamps: false,
    }
  );

  LoyaltyPoints.associate = (models) => {
    LoyaltyPoints.belongsTo(models.User, {
      foreignKey: "userId",
      as: "user",
    });
  };

  return LoyaltyPoints;
};
