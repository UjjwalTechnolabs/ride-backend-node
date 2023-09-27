module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("EmergencyContacts", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      userId: {
        type: Sequelize.INTEGER,
      },
      contactName: {
        type: Sequelize.STRING,
      },
      contactNumber: {
        type: Sequelize.STRING,
      },
      contactWhatsAppNumber: {
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
    await queryInterface.dropTable("EmergencyContacts");
  },
};
