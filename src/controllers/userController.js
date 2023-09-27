// controllers/userController.js
const { User } = require("../../models");

exports.getUserList = async (req, res) => {
  try {
    const selectedCurrency = req.query.currency || "USD"; // Default to USD
    const selectedLanguage = req.query.lang || "en"; // Default to English
    const users = await User.findAll();
    res.status(200).json({
      users,
      selectedCurrency,
      selectedLanguage,
    });
  } catch (error) {
    console.error("Error getting user list:", error);
    res.status(500).send("Error getting user list");
  }
};
exports.getUserDetails = async (req, res) => {
  try {
    const userId = req.params.userId;
    const user = await User.findOne({ where: { id: userId } });
    if (!user) return res.status(404).send("User not found");
    res.status(200).json(user);
  } catch (error) {
    console.error("Error getting user details:", error);
    res.status(500).send("Error getting user details");
  }
};
