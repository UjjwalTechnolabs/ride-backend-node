module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable("DriverDocuments", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      documentType: {
        type: Sequelize.ENUM("LICENSE", "INSURANCE", "VEHICLE_REGISTRATION"),
        allowNull: false,
      },
      documentLink: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      expiryDate: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      verificationStatus: {
        type: Sequelize.ENUM("VERIFIED", "PENDING", "REJECTED"),
        defaultValue: "PENDING",
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable("DriverDocuments");
  },
};
