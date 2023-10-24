"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert("Permissions", [
      {
        name: "dashboard_view",
        description: "Access to the dashboard",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "locations_view",
        description: "View all locations",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "trips_view_all",
        description: "View all trips",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "view_driver_management",
        description: "View Driver Management",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "view_driver_list",
        description: "View Driver list",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "view_vehicle_list",
        description: "View Vehicle list",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "view_driver_performance",
        description: "View Driver performance",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "view_user_management",
        description: "View User Management",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "view_user_list",
        description: "View User list",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "view_payment_records",
        description: "View Payment records",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "view_vehicle_management",
        description: "View Vehicle Management",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "view_all_vehicles",
        description: "View All Vehicles",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "view_vehicle_type",
        description: "View Vehicle Type",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "view_fare_management",
        description: "View Fare Management",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "view_communicationt",
        description: "View Communication",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "view_notification",
        description: "View Notification",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "view_email",
        description: "View Email",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "view_payments",
        description: "View Payments",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "view_driver_payout",
        description: "View Driver payout",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "view_payout_request",
        description: "View Payout request",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "view_wallet_transactions",
        description: "View Wallet transactions",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "view_coupon",
        description: "View Coupon",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "view_api_credentials",
        description: "View Api credentials",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "view_multi_setting",
        description: "View Multi Setting",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "view_report",
        description: "View Report",
        createdAt: new Date(),
        updatedAt: new Date(),
      },

      // ... (add other permissions similarly)
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete("Permissions", null, {});
  },
};
