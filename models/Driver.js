module.exports = (sequelize, DataTypes) => {
  const Driver = sequelize.define("Driver", {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
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
      allowNull: false,
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
  });

  Driver.associate = (models) => {
    Driver.hasMany(models.Ride, {
      foreignKey: "driverId",
      as: "rides",
    });
    Driver.hasMany(models.DriverDocument, {
      foreignKey: "driverId",
      as: "documents",
    });
    Driver.hasOne(models.Vehicle, {
      foreignKey: "driverId",
      as: "vehicle",
    });
    Driver.hasMany(models.Rating, {
      foreignKey: "driverId",
      as: "ratings",
    });
  };

  return Driver;
};
