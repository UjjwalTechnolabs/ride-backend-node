const {
  Ride,

  sequelize,
  Currency,
  NotifiedDriver,
  Transaction,
  Event,
} = require("../../models");

const axios = require("axios"); // You might need to install this package if not already installed

exports.RideRequestFrequency = async (req, res) => {
  //Ride Request Frequency

  try {
    // This is just a placeholder. Replace it with your actual logic to get data from the database.
    const data = await getRideRequestData();
    res.json(data);
  } catch (error) {
    res.status(500).send(error.message);
  }
};

async function getRideRequestData() {
  try {
    // Assuming you have a createdAt field in your Ride model
    const [results] = await Ride.sequelize.query(`
    SELECT 
    DATE("createdAt") as date, 
    COUNT(*) as requests
  FROM "Rides"
  GROUP BY DATE("createdAt")
  ORDER BY DATE("createdAt");
      `);

    return results.map((result) => ({
      date: result.date,
      requests: result.requests,
    }));
  } catch (error) {
    console.error("Error fetching ride request data:", error);
    throw error;
  }
}
exports.DriverResponseRates = async (req, res) => {
  try {
    const [results] = await NotifiedDriver.sequelize.query(`
    SELECT 
    "NotifiedDrivers"."driverId", 
    SUM(CASE WHEN "status" = 'accepted' THEN 1 ELSE 0 END) as accepted,
    SUM(CASE WHEN "status" = 'rejected' THEN 1 ELSE 0 END) as rejected
  FROM "NotifiedDrivers"
  GROUP BY "NotifiedDrivers"."driverId";
      `);

    res.status(200).json(results);
  } catch (error) {
    console.error("Error fetching driver response rates:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
exports.averageFareOverTime = async (req, res) => {
  try {
    const [results] = await Ride.sequelize.query(`
    SELECT 
    DATE("Rides"."createdAt") as date,
    AVG(fare) as averageFare
  FROM "Rides"
  GROUP BY DATE("Rides"."createdAt")
  ORDER BY date;
      `);

    res.status(200).json(results);
  } catch (error) {
    console.error("Error fetching average fare over time:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.earningsAnalysis = async (req, res) => {
  try {
    const earningsData = await sequelize.query(
      `
      SELECT date_trunc('day', "Rides"."createdAt") as date, SUM(fare) as earning
      FROM "Rides"
      WHERE status = 'COMPLETED'
      GROUP BY date
      ORDER BY date;
      `,
      {
        type: sequelize.QueryTypes.SELECT,
      }
    );
    res.json(earningsData);
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};

exports.userRatingsAnalysis = async (req, res) => {
  try {
    const ratingsData = await sequelize.query(
      `
      SELECT "Ratings"."ratingValue", COUNT(*) as count
      FROM "Ratings"
      GROUP BY "Ratings"."ratingValue";
      `,
      {
        type: sequelize.QueryTypes.SELECT,
      }
    );
    res.json(ratingsData);
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};

exports.activeDriversUsers = async (req, res) => {
  try {
    const [activeDrivers] = await sequelize.query(
      `
          SELECT COUNT(*) as count
          FROM "Drivers"
          WHERE "Drivers"."onlineStatus" = 'ONLINE';
        `,
      {
        type: sequelize.QueryTypes.SELECT,
      }
    );

    const [activeUsers] = await sequelize.query(
      `
          SELECT COUNT(*) as count
          FROM "users"
          WHERE status = 'ACTIVE';
        `,
      {
        type: sequelize.QueryTypes.SELECT,
      }
    );

    res.json({
      activeDrivers: activeDrivers.count,
      activeUsers: activeUsers.count,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};

exports.cancellationReasons = async (req, res) => {
  try {
    const reasons = await sequelize.query(
      `
      SELECT "Cancellations"."reason", COUNT(*) as count
      FROM "Cancellations"
      GROUP BY "Cancellations"."reason";
        `,
      {
        type: sequelize.QueryTypes.SELECT,
      }
    );

    const reasonLabels = reasons.map((r) => r.reason);
    const reasonCounts = reasons.map((r) => r.count);

    res.json({
      reasons: reasonLabels,
      counts: reasonCounts,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};
exports.popularRoutes = async (req, res) => {
  try {
    const routes = await sequelize.query(
      `
        SELECT 
            "Rides"."pickupLocation", "Rides"."dropoffLocation", 
            COUNT(*)::INTEGER as count
        FROM "Rides"
        GROUP BY "Rides"."pickupLocation", "Rides"."dropoffLocation"
        ORDER BY count DESC
        LIMIT 10;
          `,
      {
        type: sequelize.QueryTypes.SELECT,
      }
    );

    // Convert each route's points to user-friendly names
    const processedRoutes = await Promise.all(
      routes.map(async (r) => {
        const pickupName = await convertToPointName(r.pickupLocation);
        const dropoffName = await convertToPointName(r.dropoffLocation);
        return {
          route: `${pickupName} to ${dropoffName}`,
          count: r.count,
        };
      })
    );

    res.json({
      routes: processedRoutes.map((r) => r.route),
      counts: processedRoutes.map((r) => r.count),
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};
exports.averageWaitingTime = async (req, res) => {
  try {
    const times = await sequelize.query(
      `
      SELECT date_trunc('hour', "Rides"."requestedAt") as interval, 
      AVG(EXTRACT(EPOCH FROM ("Rides"."pickedUpAt" - "Rides"."requestedAt")) / 60) as average_waiting_time
FROM "Rides"
GROUP BY interval
ORDER BY interval;
        `,
      {
        type: sequelize.QueryTypes.SELECT,
      }
    );

    const timeIntervals = times.map((t) => t.interval);
    const averageTimes = times.map((t) => t.average_waiting_time);

    res.json({
      intervals: timeIntervals,
      times: averageTimes,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};

async function convertToPointName(point) {
  try {
    const { coordinates } = point;
    const lat = coordinates[0];
    const lng = coordinates[1];
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;

    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`;

    const response = await axios.get(url);

    if (
      response.status === 200 &&
      response.data &&
      response.data.results &&
      response.data.results.length > 0
    ) {
      const address = response.data.results[0].formatted_address; // This line will give you full human-readable address.
      return address;
    } else {
      return "Route not found";
    }
  } catch (error) {
    //console.error("Error converting point to name:", error);
    return "Route not found";
  }
}
exports.fuelConsumption = async (req, res) => {
  try {
    const consumptions = await sequelize.query(
      `
      SELECT "vt".name as vehicle_type, AVG("vt"."fuelConsumption") as avg_consumption
      FROM "Rides" r
      JOIN "VehicleTypes" vt ON r."vehicleTypeKey" = vt.id
      GROUP BY vt.name
      ORDER BY avg_consumption DESC;
        `,
      {
        type: sequelize.QueryTypes.SELECT,
      }
    );
    const vehicleTypes = consumptions.map((c) => c.vehicle_type);
    const avgConsumptions = consumptions.map((c) => c.avg_consumption);
    res.json({
      vehicleTypes: vehicleTypes,
      consumptions: avgConsumptions,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};
exports.loyaltyPointsDistribution = async (req, res) => {
  try {
    // Replace with actual logic to fetch data from the database
    const distributions = await sequelize.query(
      `
          SELECT 
            CASE 
              WHEN points BETWEEN 0 AND 100 THEN '0-100'
              WHEN points BETWEEN 101 AND 200 THEN '101-200'
              ELSE '201+' 
            END as range,
            COUNT(*) as count 
          FROM loyalty_points 
          GROUP BY range
          ORDER BY range;
        `,
      {
        type: sequelize.QueryTypes.SELECT,
      }
    );

    const ranges = distributions.map((d) => d.range);
    const counts = distributions.map((d) => d.count);

    res.json({
      ranges: ranges,
      distributions: counts,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};
exports.peakHoursAnalysis = async (req, res) => {
  try {
    // Replace with actual logic to fetch data from the database
    const peakHours = await sequelize.query(
      `
      SELECT 
      EXTRACT(HOUR FROM "Rides"."createdAt") as hour,
      COUNT(*) as count 
    FROM "Rides" 
    GROUP BY hour
    ORDER BY hour;
        `,
      {
        type: sequelize.QueryTypes.SELECT,
      }
    );

    const hours = peakHours.map((ph) => `${ph.hour}:00 - ${ph.hour + 1}:00`);
    const counts = peakHours.map((ph) => ph.count);

    res.json({
      hours: hours,
      counts: counts,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};
exports.dashboard = async (req, res) => {
  try {
    const { currencyCode } = req.query;
    const currency = await Currency.findByPk(currencyCode);

    if (!currency) return res.status(404).json({ error: "Currency not found" });

    const transactions = await Transaction.findAll({ where: { currencyCode } });
    const convertedTransactions = transactions.map((transaction) => {
      transaction.amount *= currency.exchangeRate;
      return transaction;
    });

    // For total revenue and total earnings, you can use Sequelize's sum method.
    const totalRevenue =
      (await Transaction.sum("amount", { where: { currencyCode } })) *
      currency.exchangeRate;
    const totalEarnings =
      (await Transaction.sum("earnings", { where: { currencyCode } })) *
      currency.exchangeRate; // assuming earnings is a column in your Transaction model

    res.json({
      convertedTransactions,
      totalRevenue,
      totalEarnings,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};

exports.trackEvent = async (req, res) => {
  try {
    const { userId, eventType, eventData } = req.body;
    const event = await Event.create({ userId, eventType, eventData });
    res.status(201).json(event);
  } catch (error) {
    console.error("Error tracking event:", error);
    res.status(500).send("Error tracking event");
  }
};

exports.getUserEvents = async (req, res) => {
  try {
    const userId = req.params.userId;
    const events = await Event.findAll({ where: { userId } });
    res.status(200).json(events);
  } catch (error) {
    console.error("Error fetching user events:", error);
    res.status(500).send("Error fetching user events");
  }
};
exports.getUserSpecificEventAnalytics = async (req, res) => {
  try {
    const userId = req.params.userId; // Getting User ID from parameters
    const eventType = req.params.eventType; // Getting Event Type from parameters

    // const events = await Event.findAll({ where: { userId, eventType } });
    // const summary = events.map((event) => event.eventData); // Extracting only eventData for each event
    const summary = await Event.findAll({
      where: { userId, eventType },
      attributes: ["eventType", "eventData"],
    });

    // Fetching Graph Data
    const graphData = await Event.findAll({
      where: { userId, eventType },
      attributes: [
        "eventType",
        [sequelize.fn("COUNT", sequelize.col("eventType")), "eventCount"],
      ],
      group: ["eventType"],
    });

    res.status(200).json({ summary, graphData });
  } catch (error) {
    res
      .status(500)
      .json({ error: "An error occurred while fetching analytics data" });
  }
};
