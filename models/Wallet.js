// models/Wallet.js
module.exports = (sequelize, DataTypes) => {
  const Wallet = sequelize.define("Wallet", {
    balance: {
      type: DataTypes.FLOAT,
      defaultValue: 0.0,
    },
    driverId: {
      type: DataTypes.INTEGER,
      references: {
        model: "Drivers",
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

  Wallet.associate = (models) => {
    Wallet.belongsTo(models.Driver, {
      foreignKey: "driverId",
      as: "driver",
    });
    Wallet.belongsTo(models.Currency, {
      foreignKey: "currencyCode",
      targetKey: "code",
      as: "currency",
      tableName: "Currencies",
    });
  };

  return Wallet;
};
