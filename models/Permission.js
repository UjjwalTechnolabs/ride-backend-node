// models/Permission.js

module.exports = (sequelize, DataTypes) => {
  const Permission = sequelize.define("Permission", {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  });

  Permission.associate = (models) => {
    Permission.belongsToMany(models.Role, {
      through: "RolePermissions",
      foreignKey: "permissionId",
      otherKey: "roleId",
    });
  };

  return Permission;
};
