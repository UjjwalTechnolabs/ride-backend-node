// migrations/xxxx-xx-xx-create-currency.js
"use strict";
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("Currencies", {
      code: {
        type: Sequelize.STRING,
        primaryKey: true,
      },
      exchangeRate: {
        type: Sequelize.FLOAT,
        allowNull: false,
      },
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("Currencies");
  },
};
