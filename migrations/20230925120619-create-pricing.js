"use strict";
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("Pricings", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      fare: {
        type: Sequelize.FLOAT,
        allowNull: false,
      },
      currencyCode: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      serviceType: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      location: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      peakMultiplier: {
        type: Sequelize.FLOAT,
        allowNull: false,
        defaultValue: 1.0,
      },
      taxPercent: {
        type: Sequelize.FLOAT,
        allowNull: false,
        defaultValue: 0,
      },
      dynamicPricingEnabled: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      discountPercent: {
        type: Sequelize.FLOAT,
        allowNull: false,
        defaultValue: 0,
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
    await queryInterface.dropTable("Pricings");
  },
};
