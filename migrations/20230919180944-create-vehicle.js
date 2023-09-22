module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable("Vehicles", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      driverId: {
        type: Sequelize.INTEGER,
        references: {
          model: "Drivers",
          key: "id",
        },
        onDelete: "CASCADE",
        allowNull: false,
      },
      vehicleTypeId: {
        type: Sequelize.INTEGER,
        references: {
          model: "VehicleTypes",
          key: "id",
        },
        onDelete: "CASCADE",
        allowNull: false,
      },
      make: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      model: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      year: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      plateNumber: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      color: {
        type: Sequelize.STRING,
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

  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable("Vehicles");
  },
};
