// migrations/YYYYMMDD-create-energy-type.js (Replace YYYYMMDD with the current date)
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("EnergyTypes", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      type: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
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
    await queryInterface.dropTable("EnergyTypes");
  },
};
