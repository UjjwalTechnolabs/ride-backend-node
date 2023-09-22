// migrations/YYYYMMDDHHmmSS-create-notified-driver.js

"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("NotifiedDrivers", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      status: {
        type: Sequelize.ENUM("notified", "accepted", "rejected", "no-response"),
        allowNull: false,
        defaultValue: "notified",
      },
      rideRequestId: {
        type: Sequelize.INTEGER,
        references: {
          model: "Rides",
          key: "id",
        },
        allowNull: false,
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },
      driverId: {
        type: Sequelize.INTEGER,
        references: {
          model: "Drivers",
          key: "id",
        },
        allowNull: false,
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("NotifiedDrivers");
  },
};
