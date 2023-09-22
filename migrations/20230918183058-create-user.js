"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("users", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      phoneNumber: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      verificationCode: {
        type: Sequelize.STRING,
      },
      // Uncomment if you wish to add timestamps
      // created_at: {
      //   allowNull: false,
      //   type: Sequelize.DATE,
      // },
      // updated_at: {
      //   allowNull: false,
      //   type: Sequelize.DATE,
      // },
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("users");
  },
};
