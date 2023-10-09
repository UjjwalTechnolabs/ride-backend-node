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
      // Additional Fields
      first_name: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      last_name: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true,
      },
      profile_image: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      date_of_birth: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      address_line_1: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      address_line_2: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      city: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      state: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      postal_code: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      country: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      is_email_verified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      last_login_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      privacy_settings: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      notification_settings: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      app_settings: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      referral_code: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      fcmToken: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      isNewUser: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      currency_code: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "USD", // or any other default currency
      },
      language_code: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "en", // English as default language
      },
    },
    {
      tableName: "users",
      timestamps: false, // Updated timestamps to true to have createdAt and updatedAt
    }
  );

  User.associate = (models) => {
    User.hasOne(models.LoyaltyPoints, {
      foreignKey: "userId",
      as: "loyaltyPoints",
    });
    // ... any other associations ...
  };

  return User;
};
