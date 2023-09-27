const { Driver } = require("../../models");

exports.payDriver = async (req, res) => {
  const { driverId, amount } = req.body;
  try {
    const driver = await Driver.findByPk(driverId);
    if (!driver) return res.status(404).json({ error: "Driver not found" });

    // Convert the amount to the driver's preferred currency before proceeding with payment
    const convertedAmount = await convertCurrency(
      amount,
      "USD",
      driver.preferredCurrency
    ); // Assuming 'USD' as your base currency
    // Proceed with payment logic...

    res.status(200).json({
      message: "Payment successful",
      amount: convertedAmount,
      currency: driver.preferredCurrency,
    });
  } catch (error) {
    res
      .status(500)
      .json({ error: "An error occurred while processing the payment" });
  }
};
