module.exports = (sequelize, DataTypes) => {
  const Driver = sequelize.define("Driver", {
    name: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
    },
    phoneNumber: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    fcmToken: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    isNewDriver: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    location: {
      type: DataTypes.GEOMETRY("POINT", 4326),
      allowNull: false,
    },
    isAvailable: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    onlineStatus: {
      type: DataTypes.ENUM("ONLINE", "OFFLINE", "ON_BREAK", "ON_TRIP"),
      defaultValue: "OFFLINE",
    },
    experience: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    profilePhoto: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    bankDetails: {
      type: DataTypes.STRING, // Consider using more secure methods if storing sensitive info.
      allowNull: true,
    },
    verificationStatus: {
      type: DataTypes.ENUM("VERIFIED", "PENDING", "REJECTED"),
      defaultValue: "PENDING",
    },
    address: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    notificationSettings: {
      type: DataTypes.JSONB, // Can store settings as JSON. E.g., { sms: true, email: false }
      allowNull: true,
    },
    language_code: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: "en", // English as default language
    },
    preferredCurrency: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "USD",
    },
  });

  Driver.associate = (models) => {
    Driver.hasOne(models.Wallet, {
      foreignKey: "driverId",
      as: "wallet",
    });
    Driver.hasMany(models.Rating, {
      foreignKey: "driverId",
      as: "ratings",
    });
    Driver.hasMany(models.Ride, {
      foreignKey: "driverId",
      as: "rides",
    });
    Driver.hasOne(models.Vehicle, {
      foreignKey: "driverId",
      as: "vehicle",
    });
    Driver.hasMany(models.DriverActivity, {
      foreignKey: "driverId",
      as: "driverActivities",
    });
    Driver.hasMany(models.DriverDocument, {
      foreignKey: "driverId",
      as: "documents", // using "documents" as the alias for clarity
    });
  };
  return Driver;
};
