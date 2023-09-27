// controllers/LoyaltyPointsController.js

const { LoyaltyPoints } = require("../../models");
exports.addPoints = async (req, res) => {
  const { userId, pointsToAdd } = req.body;

  try {
    let loyaltyPoints = await LoyaltyPoints.findOne({
      where: { userId },
    });

    if (!loyaltyPoints) {
      loyaltyPoints = await LoyaltyPoints.create({
        userId,
        points: pointsToAdd,
      });
    } else {
      loyaltyPoints.points += pointsToAdd;
      await loyaltyPoints.save();
    }

    return res.status(200).json(loyaltyPoints);
  } catch (error) {
    return res
      .status(500)
      .json({ error: "An error occurred while adding points." });
  }
};
exports.redeemPoints = async (req, res) => {
  const { userId, pointsToRedeem } = req.body;

  try {
    const loyaltyPoints = await LoyaltyPoints.findOne({ where: { userId } });

    if (!loyaltyPoints || loyaltyPoints.points < pointsToRedeem) {
      return res.status(400).json({ error: "Not enough points to redeem." });
    }

    loyaltyPoints.points -= pointsToRedeem;
    await loyaltyPoints.save();

    // Logic to apply discount or give a free ride based on pointsToRedeem can be added here.

    return res.status(200).json(loyaltyPoints);
  } catch (error) {
    return res
      .status(500)
      .json({ error: "An error occurred while redeeming points." });
  }
};
