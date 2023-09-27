const { Location } = require("../../models");
exports.createLocation = async (req, res) => {
  try {
    const { name, geometry } = req.body;
    const location = await Location.create({ name, geometry });
    res.status(201).json({ success: true, data: location });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};
exports.updateLocation = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, geometry } = req.body;

    const location = await Location.findByPk(id);
    if (!location)
      return res
        .status(404)
        .json({ success: false, message: "Location not found" });

    location.name = name;
    location.geometry = geometry;
    await location.save();

    res.status(200).json({ success: true, data: location });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};
exports.deleteLocation = async (req, res) => {
  try {
    const { id } = req.params;

    const location = await Location.findByPk(id);
    if (!location)
      return res
        .status(404)
        .json({ success: false, message: "Location not found" });

    await location.destroy();

    res
      .status(200)
      .json({ success: true, message: "Location deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};
exports.getLocations = async (req, res) => {
  try {
    const locations = await Location.findAll();
    res.status(200).json({ success: true, data: locations });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};
