module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("RideHistories", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      userId: {
        type: Sequelize.INTEGER,
        references: {
          model: "users",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      driverId: {
        type: Sequelize.INTEGER,
        references: {
          model: "Drivers",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      rideId: {
        type: Sequelize.INTEGER,
        references: {
          model: "Rides",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      fare: {
        type: Sequelize.FLOAT,
        allowNull: false,
      },
      distance: {
        type: Sequelize.FLOAT,
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
    await queryInterface.dropTable("RideHistories");
  },
};
