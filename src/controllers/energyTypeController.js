// controllers/energyTypeController.js
const { EnergyType } = require("../../models");

exports.getAll = async (req, res) => {
  try {
    const energyTypes = await EnergyType.findAll();
    res.status(200).send(energyTypes);
  } catch (error) {
    res.status(500).send({ message: "Error retrieving energy types!" });
  }
};

exports.create = async (req, res) => {
  try {
    console.log(req.body);
    const type = await EnergyType.create({ type: req.body.type });
    res.status(201).send(type);
  } catch (error) {
    console.error("Error while creating energy type:", error);
    res.status(500).send({ message: "Error creating energy type!" });
  }
};

// Add update and delete operations as required.
