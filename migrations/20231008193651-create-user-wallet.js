module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("UserWallets", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      balance: {
        type: Sequelize.FLOAT,
        defaultValue: 0.0,
      },
      userId: {
        type: Sequelize.INTEGER,
        references: {
          model: "users",
          key: "id",
        },
        allowNull: false,
      },
      currencyCode: {
        type: Sequelize.STRING,
        references: {
          model: "Currencies", // Note the pluralized table name
          key: "code",
        },
        allowNull: false,
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
    await queryInterface.dropTable("UserWallets");
  },
};
