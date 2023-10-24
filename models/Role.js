// models/Role.js

module.exports = (sequelize, DataTypes) => {
  const Role = sequelize.define("Role", {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  });

  Role.associate = (models) => {
    Role.belongsToMany(models.Admin, {
      through: "AdminRoles",
      foreignKey: "roleId",
      otherKey: "adminId",
    });
    Role.belongsToMany(models.Permission, {
      through: "RolePermissions",
      foreignKey: "roleId",
      otherKey: "permissionId",
    });
  };

  return Role;
};
