// models/Event.js
module.exports = (sequelize, DataTypes) => {
  const Event = sequelize.define("Event", {
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    eventType: {
      type: DataTypes.STRING, // e.g. page_view, click, conversion
      allowNull: false,
    },
    eventData: {
      type: DataTypes.JSON, // To store additional data related to the event
    },
  });

  Event.associate = (models) => {
    Event.belongsTo(models.User, { foreignKey: "userId", as: "user" });
  };

  return Event;
};
