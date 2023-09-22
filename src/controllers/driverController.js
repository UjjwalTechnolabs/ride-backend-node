const { Driver, DriverDocument, Vehicle, Rating } = require("../../models");

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

exports.getDriver = async (req, res) => {
  try {
    const driver = await Driver.findByPk(req.params.id);
    if (!driver) {
      return res.status(404).send({ message: "Driver not found!" });
    }
    res.send(driver);
  } catch (error) {
    res.status(500).send({ message: "Error fetching driver!" });
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
