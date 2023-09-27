const { Review } = require("../../models"); // Adjust the path as necessary

exports.addReview = async (req, res) => {
  try {
    const { driverId, userId, rating, comment } = req.body;
    const review = await Review.create({ driverId, userId, rating, comment });
    res.status(201).json(review);
  } catch (error) {
    console.error("Error adding review:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
