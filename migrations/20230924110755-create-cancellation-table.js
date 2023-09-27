// migrations/YYYYMMDDHHmmss-create-cancellation.js

"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("Cancellations", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      reason: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      rideId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "Rides", // name of the table, case-sensitive
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
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
    await queryInterface.dropTable("Cancellations");
  },
};
