require("dotenv").config();

const bcrypt = require("bcrypt");

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Insert Super Admin into Admins table
    await queryInterface.bulkInsert("Admins", [
      {
        username: process.env.SUPER_ADMIN_USERNAME,
        email: process.env.SUPER_ADMIN_EMAIL,
        password: bcrypt.hashSync(process.env.SUPER_ADMIN_PASSWORD, 10),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    // Fetch the ID of the admin with the given username
    const admins = await queryInterface.sequelize.query(
      `SELECT id FROM "Admins" WHERE username = ?`,
      {
        replacements: [process.env.SUPER_ADMIN_USERNAME],
        type: queryInterface.sequelize.QueryTypes.SELECT,
      }
    );

    const admin = admins[0];

    if (!admin) {
      throw new Error("Failed to retrieve the Super Admin's ID.");
    }

    // Fetch the role ID for Super Admin. If you're sure it's 1, you can skip this.
    const roles = await queryInterface.sequelize.query(
      `SELECT id FROM "Roles" WHERE name = 'SuperAdmin'`,
      {
        type: queryInterface.sequelize.QueryTypes.SELECT,
      }
    );

    const superAdminRole = roles[0];

    if (!superAdminRole) {
      throw new Error("Failed to retrieve the Super Admin role ID.");
    }

    // Insert into AdminRoles table to associate the Super Admin role with this admin
    return queryInterface.bulkInsert("AdminRoles", [
      {
        adminId: admin.id,
        roleId: superAdminRole.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    // First, delete the association
    await queryInterface.bulkDelete(
      "AdminRoles",
      { adminId: admin.id, roleId: superAdminRole.id },
      {}
    );
    // Then, delete the admin entry
    return queryInterface.bulkDelete(
      "Admins",
      { username: process.env.SUPER_ADMIN_USERNAME },
      {}
    );
  },
};
