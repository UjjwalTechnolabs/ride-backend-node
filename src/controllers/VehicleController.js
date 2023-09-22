// controllers/VehicleController.js

const { Vehicle } = require("../../models");

exports.createVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.create(req.body);
    res.status(201).send(vehicle);
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Error creating vehicle!" });
  }
};

exports.getAllVehicles = async (req, res) => {
  try {
    const vehicles = await Vehicle.findAll();
    res.send(vehicles);
  } catch (error) {
    res.status(500).send({ message: "Error fetching vehicles!" });
  }
};

exports.getVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findByPk(req.params.id);
    if (!vehicle) {
      return res.status(404).send({ message: "Vehicle not found!" });
    }
    res.send(vehicle);
  } catch (error) {
    res.status(500).send({ message: "Error fetching vehicle!" });
  }
};

exports.updateVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findByPk(req.params.id);
    if (!vehicle) {
      return res.status(404).send({ message: "Vehicle not found!" });
    }
    await vehicle.update(req.body);
    res.send(vehicle);
  } catch (error) {
    res.status(500).send({ message: "Error updating vehicle!" });
  }
};

exports.deleteVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findByPk(req.params.id);
    if (!vehicle) {
      return res.status(404).send({ message: "Vehicle not found!" });
    }
    await vehicle.destroy();
    res.send({ message: "Vehicle deleted successfully!" });
  } catch (error) {
    res.status(500).send({ message: "Error deleting vehicle!" });
  }
};
