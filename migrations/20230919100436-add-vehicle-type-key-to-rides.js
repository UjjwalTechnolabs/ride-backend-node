module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("Rides", "vehicleTypeKey", {
      type: Sequelize.INTEGER,
      allowNull: true, // Note this change
      references: {
        model: "VehicleTypes",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn("Rides", "vehicleTypeKey");
  },
};
