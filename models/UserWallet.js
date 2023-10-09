module.exports = (sequelize, DataTypes) => {
  const UserWallet = sequelize.define("UserWallet", {
    balance: {
      type: DataTypes.FLOAT,
      defaultValue: 0.0,
    },
    userId: {
      type: DataTypes.INTEGER,
      references: {
        model: "users",
        key: "id",
      },
      allowNull: false,
    },
    currencyCode: {
      type: DataTypes.STRING,
      references: {
        model: "Currency",
        key: "code",
      },
      allowNull: false,
    },
  });

  UserWallet.associate = (models) => {
    UserWallet.belongsTo(models.User, {
      foreignKey: "userId",
      as: "user",
    });
    UserWallet.belongsTo(models.Currency, {
      foreignKey: "currencyCode",
      targetKey: "code",
      as: "currency",
      tableName: "Currencies",
    });
  };

  return UserWallet;
};
