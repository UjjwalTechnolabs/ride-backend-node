// controllers/userController.js
const { User, Sequelize } = require("../../models");

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

exports.updateUser = async (req, res) => {
  const userId = req.params.userId;
  const updateData = req.body;

  try {
    const [updated] = await User.update(updateData, {
      where: { id: userId },
    });

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "User not found",
        data: null,
      });
    }

    const updatedUser = await User.findOne({ where: { id: userId } });
    return res.status(200).json({
      success: true,
      message: "User updated successfully",
      data: updatedUser,
    });
  } catch (error) {
    if (error instanceof Sequelize.UniqueConstraintError) {
      return res.status(400).json({
        success: false,
        message:
          "The provided email address is already in use by another user.",
        data: null,
      });
    }

    return res.status(400).json({
      success: false,
      message: error.message,
      data: null,
    });
  }
};
