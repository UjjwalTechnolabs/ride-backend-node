// models/Currency.js
module.exports = (sequelize, DataTypes) => {
  const Currency = sequelize.define(
    "Currency",
    {
      code: {
        type: DataTypes.STRING,
        primaryKey: true,
      },
      exchangeRate: {
        type: DataTypes.FLOAT,
        allowNull: false,
      },
      symbol: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      timestamps: false,
    }
  );
  Currency.associate = (models) => {
    Currency.hasMany(models.Pricing, {
      foreignKey: "currencyCode",
      sourceKey: "code",
    });
  };
  return Currency;
};
