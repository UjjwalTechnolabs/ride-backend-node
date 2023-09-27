const {
  Driver,
  DriverDocument,
  Vehicle,
  Rating,
  Review,
  Currency,
  Ride,
} = require("../../models");
const { Op } = require("sequelize");
exports.createDriver = async (req, res) => {
  try {
    const driver = await Driver.create(req.body);
    res.status(201).send(driver);
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Error creating driver!" });
  }
};

exports.getAllDrivers = async (req, res) => {
  try {
    const drivers = await Driver.findAll();
    res.send(drivers);
  } catch (error) {
    res.status(500).send({ message: "Error fetching drivers!" });
  }
};

exports.getDriverDetails = async (req, res) => {
  try {
    const driverId = req.params.driverId; // Extracting driverId from the URL

    if (!driverId) return res.status(400).send("Driver ID is required");

    const driver = await Driver.findByPk(driverId, {
      include: [
        { model: Vehicle, as: "vehicle" },
        { model: DriverDocument, as: "documents" },
        // Include other associated models as needed
      ],
    });

    if (!driver) return res.status(404).send("Driver not found");

    // Fetching reviews separately. It could also be included in the above query depending on your model associations
    const reviews = await Review.findAll({ where: { driverId } });

    res.status(200).json({ driver, reviews });
  } catch (error) {
    console.error("Error fetching driver details:", error);
    res.status(500).send("Internal Server Error");
  }
};

exports.updateDriver = async (req, res) => {
  try {
    const driver = await Driver.findByPk(req.params.id);
    if (!driver) {
      return res.status(404).send({ message: "Driver not found!" });
    }
    await driver.update(req.body);
    res.send(driver);
  } catch (error) {
    res.status(500).send({ message: "Error updating driver!" });
  }
};

exports.deleteDriver = async (req, res) => {
  try {
    const driver = await Driver.findByPk(req.params.id);
    if (!driver) {
      return res.status(404).send({ message: "Driver not found!" });
    }
    await driver.destroy();
    res.send({ message: "Driver deleted successfully!" });
  } catch (error) {
    res.status(500).send({ message: "Error deleting driver!" });
  }
};
exports.uploadDriverDocument = async (req, res) => {
  try {
    const driverId = req.params.id;
    const documentDetails = {
      driverId,
      documentType: req.body.documentType,
      documentLink: req.file.path, // assuming `req.file.path` contains the path where multer has stored the file.
      expiryDate: req.body.expiryDate,
      verificationStatus: req.body.verificationStatus || "PENDING",
    };

    const document = await DriverDocument.create(documentDetails);
    res.status(201).send(document);
  } catch (error) {
    res.status(500).send({ message: "Error uploading document!" });
  }
};

exports.getDriverRatings = async (req, res) => {
  try {
    const driverId = req.params.id;
    const ratings = await Rating.findAll({ where: { driverId } });
    res.send(ratings);
  } catch (error) {
    res.status(500).send({ message: "Error fetching ratings!" });
  }
};

exports.getDriverVehicle = async (req, res) => {
  try {
    const driverId = req.params.id;
    const vehicle = await Vehicle.findOne({ where: { driverId } });
    if (!vehicle) {
      return res
        .status(404)
        .send({ message: "Vehicle not found for this driver!" });
    }
    res.send(vehicle);
  } catch (error) {
    res.status(500).send({ message: "Error fetching vehicle!" });
  }
};
exports.getDriverList = async (req, res) => {
  try {
    const { status, sortBy, order, page = 1, limit = 10 } = req.query;

    const offset = (page - 1) * limit; // Calculating the offset

    const drivers = await Driver.findAll({
      where: status ? { onlineStatus: status } : {},
      order: sortBy && order ? [[sortBy, order]] : [],
      limit: parseInt(limit), // Making sure limit is a number
      offset: parseInt(offset), // Making sure offset is a number
      include: [
        { model: Vehicle, as: "vehicle" },
        { model: DriverDocument, as: "documents" },
      ],
    });

    const totalDrivers = await Driver.count({
      where: status ? { onlineStatus: status } : {},
    });
    const totalPages = Math.ceil(totalDrivers / limit);

    res
      .status(200)
      .json({ drivers, totalDrivers, totalPages, currentPage: page });
  } catch (error) {
    console.error("Error fetching driver list:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
async function calculateEarnings(driverId, interval, currency) {
  const currentTime = new Date();
  let startTime;

  switch (interval) {
    case "daily":
      startTime = new Date(currentTime.getTime() - 24 * 60 * 60 * 1000); // 1 day ago
      break;
    case "weekly":
      startTime = new Date(currentTime.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
      break;
    case "monthly":
      startTime = new Date(
        currentTime.getFullYear(),
        currentTime.getMonth() - 1,
        currentTime.getDate(),
        currentTime.getHours(),
        currentTime.getMinutes(),
        currentTime.getSeconds(),
        currentTime.getMilliseconds()
      );
      break;
    case "yearly":
      startTime = new Date(
        currentTime.getFullYear() - 1,
        currentTime.getMonth(),
        currentTime.getDate(),
        currentTime.getHours(),
        currentTime.getMinutes(),
        currentTime.getSeconds(),
        currentTime.getMilliseconds()
      );
      break;
    default:
      throw new Error("Invalid interval");
  }

  console.log("Start Time:", startTime.toISOString());
  console.log("Current Time:", currentTime.toISOString());

  // Reset the time part of startTime to 00:00:00
  startTime.setHours(0, 0, 0, 0);

  console.log("Start Time:", startTime);
  console.log("Current Time:", new Date());

  const rides = await Ride.findAll({
    where: {
      driverId: driverId,
      status: "COMPLETED",
      requestedAt: {
        [Op.between]: [startTime, currentTime],
      },
    },
  });

  const totalEarnings = rides.reduce((sum, ride) => sum + ride.fare, 0);

  const currencyDetails = await Currency.findOne({ where: { code: currency } });
  if (!currencyDetails) throw new Error("Invalid Currency");

  return totalEarnings * currencyDetails.exchangeRate;
}

exports.getDriverEarnings = async (req, res) => {
  try {
    const driverId = req.params.driverId;
    const { interval, currency } = req.query;

    const earnings = await calculateEarnings(driverId, interval, currency);

    res.status(200).json({
      success: true,
      data: {
        earnings,
        currency,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};
