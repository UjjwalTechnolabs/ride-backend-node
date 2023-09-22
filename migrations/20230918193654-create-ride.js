"use strict";
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("Rides", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      userId: {
        type: Sequelize.INTEGER,
        references: {
          model: "users", // lowercase "users" here
          key: "id",
        },
        allowNull: false,
      },
      pickupLocation: {
        type: Sequelize.GEOMETRY("POINT"),
        allowNull: false,
      },
      dropoffLocation: {
        type: Sequelize.GEOMETRY("POINT"),
        allowNull: false,
      },
      vehicleType: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      fare: {
        type: Sequelize.FLOAT,
        allowNull: false,
      },
      status: {
        type: Sequelize.STRING,
        defaultValue: "PENDING",
      },
      ETA: {
        type: Sequelize.STRING,
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
    await queryInterface.dropTable("Rides");
  },
};
