"use strict";
const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const User = sequelize.define(
    "User",
    {
      phoneNumber: {
        type: DataTypes.STRING,
        allowNull: false,
      },

      verificationCode: {
        type: DataTypes.STRING,
      },
      //   createdAt: {
      //     type: DataTypes.DATE,
      //     allowNull: false,
      //     field: "created_at", // Example: if the column is named "created_at" in the database
      //   },
      //   updatedAt: {
      //     type: DataTypes.DATE,
      //     allowNull: false,
      //     field: "updated_at", // Example: if the column is named "updated_at" in the database
      //   },
    },
    {
      tableName: "users",
      timestamps: false,
      // Here, we specify the table name explicitly.
    }
  );

  return User;
};
