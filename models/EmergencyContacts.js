"use strict";
const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const EmergencyContacts = sequelize.define(
    "EmergencyContacts",
    {
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "users", // Assuming 'users' is the table name for the User model
          key: "id",
        },
      },
      contactName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      contactNumber: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      contactWhatsAppNumber: {
        type: DataTypes.STRING, // Agar aap alag se WhatsApp number bhi store karna chahte hain
        allowNull: true, // Making this optional in case it's the same as contactNumber
      },
    },
    {
      // tableName: "emergency_contacts",
      timestamps: true, // Assuming you want createdAt and updatedAt timestamps
    }
  );

  return EmergencyContacts;
};
