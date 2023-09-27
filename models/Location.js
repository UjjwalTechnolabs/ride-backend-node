// models/Location.js

"use strict";

module.exports = (sequelize, DataTypes) => {
  const Location = sequelize.define(
    "Location",
    {
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      geometry: {
        type: DataTypes.GEOMETRY("POLYGON"),
        allowNull: false,
      },
    },
    {
      // other options
    }
  );

  Location.associate = function (models) {
    // associations can be defined here
  };

  return Location;
};
