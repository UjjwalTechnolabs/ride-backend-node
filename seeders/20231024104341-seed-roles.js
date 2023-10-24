module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert("Roles", [
      {
        name: "SuperAdmin",
        description: "Has full control over the system",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Admin",
        description: "Has access to specific functionalities",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },
  down: async (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete("Roles", null, {});
  },
};
