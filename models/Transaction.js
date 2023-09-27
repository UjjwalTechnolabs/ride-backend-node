// models/Transaction.js
module.exports = (sequelize, DataTypes) => {
  const Transaction = sequelize.define("Transaction", {
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    amount: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    currencyCode: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    earnings: {
      type: DataTypes.FLOAT, // or whatever the appropriate data type is
      allowNull: false, // or true, if it can be null
    },
  });
  return Transaction;
};
