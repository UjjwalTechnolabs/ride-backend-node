const { Transaction } = require("../../models");
exports.transactions = async (req, res) => {
  try {
    const { userId, amount, currencyCode } = req.body;
    const transaction = await Transaction.create({
      userId,
      amount,
      currencyCode,
    });
    res.status(201).json(transaction);
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};
