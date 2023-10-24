// models/Admin.js

module.exports = (sequelize, DataTypes) => {
  const Admin = sequelize.define("Admin", {
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    password: {
      type: DataTypes.STRING, // This will store the hashed password
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  });

  Admin.associate = (models) => {
    Admin.belongsToMany(models.Role, {
      through: "AdminRoles",
      foreignKey: "adminId",
      otherKey: "roleId",
    });
  };

  return Admin;
};
