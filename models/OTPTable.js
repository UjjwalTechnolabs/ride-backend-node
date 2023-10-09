module.exports = (sequelize, DataTypes) => {
  const OTPTable = sequelize.define(
    "OTPTable",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      phoneNumber: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      verificationCode: {
        type: DataTypes.STRING(6), // assuming OTP is a 6 digit code
        allowNull: false,
      },
    },
    {
      timestamps: false,
    }
  );

  // Associations, if needed, can be added here in the future
  OTPTable.associate = (models) => {
    // e.g., OTPTable.belongsTo(models.User, {...});
  };

  return OTPTable;
};
