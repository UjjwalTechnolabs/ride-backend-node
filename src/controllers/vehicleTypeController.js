const { VehicleType } = require("../../models");

exports.getAllVehicleTypes = async (req, res) => {
  try {
    const vehicleTypes = await VehicleType.findAll();
    res.status(200).json({
      status: "success",
      data: {
        vehicleTypes,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

exports.createVehicleType = async (req, res) => {
  try {
    const newVehicleType = await VehicleType.create(req.body);
    res.status(201).json({
      status: "success",
      data: {
        vehicleType: newVehicleType,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

exports.getVehicleType = async (req, res) => {
  try {
    const vehicleType = await VehicleType.findByPk(req.params.id);
    if (!vehicleType) {
      return res.status(404).json({
        status: "fail",
        message: "VehicleType not found",
      });
    }
    res.status(200).json({
      status: "success",
      data: {
        vehicleType,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

exports.updateVehicleType = async (req, res) => {
  try {
    const vehicleType = await VehicleType.update(req.body, {
      where: { id: req.params.id },
    });
    res.status(200).json({
      status: "success",
      data: {
        vehicleType,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

exports.deleteVehicleType = async (req, res) => {
  try {
    await VehicleType.destroy({
      where: { id: req.params.id },
    });
    res.status(204).json({
      status: "success",
      data: null,
      message: "VehicleType deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};
