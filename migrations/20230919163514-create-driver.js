"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("Drivers", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      location: {
        type: Sequelize.GEOMETRY("POINT"),
        allowNull: false,
      },
      isAvailable: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      onlineStatus: {
        type: Sequelize.ENUM("ONLINE", "OFFLINE"),
        defaultValue: "OFFLINE",
      },
      experience: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      profilePhoto: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      bankDetails: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      verificationStatus: {
        type: Sequelize.ENUM("VERIFIED", "PENDING", "REJECTED"),
        defaultValue: "PENDING",
      },
      address: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      notificationSettings: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("Drivers");
  },
};
