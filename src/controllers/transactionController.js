// controllers/transactionController.js
const { Transaction, sequelize } = require("../../models");
const { convertCurrency } = require("../utils/fareUtils");
const i18next = require("i18next");

const { Parser } = require("json2csv"); // You'll need to install this package

exports.getTransactionHistory = async (req, res) => {
  try {
    const userId = req.params.userId; // Or retrieve from JWT or session if needed
    const transactions = await Transaction.findAll({
      where: { userId },
    });

    // Convert transactions amount to selected currency
    const selectedCurrency = req.query.currency || "USD"; // Default to USD
    const convertedTransactions = await Promise.all(
      transactions.map(async (transaction) => {
        const convertedAmount = await convertCurrency(
          transaction.amount,
          transaction.currencyCode,
          selectedCurrency
        );
        const convertedEarnings = await convertCurrency(
          transaction.earnings,
          transaction.currencyCode,
          selectedCurrency
        );
        return {
          ...transaction.toJSON(),
          amount: convertedAmount,
          earnings: convertedEarnings,
          currencyCode: selectedCurrency,
        };
      })
    );
    res.status(200).json({ transactions: convertedTransactions });
  } catch (error) {
    res
      .status(500)
      .json({ error: "An error occurred while fetching transaction history" });
  }
};

exports.getMonthlyReports = async (req, res) => {
  try {
    const userId = req.params.userId;
    const selectedCurrency = req.query.currency || "USD"; // Default to USD

    // Fetch aggregated monthly earnings and transactions count
    const monthlyReports = await Transaction.findAll({
      attributes: [
        [
          sequelize.fn("EXTRACT", sequelize.literal('MONTH FROM "createdAt"')),
          "month",
        ],
        [sequelize.fn("SUM", sequelize.col("amount")), "totalAmount"],
        [sequelize.fn("COUNT", sequelize.col("id")), "transactionCount"],
      ],
      where: { userId },
      group: ["month"],
      order: [sequelize.literal("month ASC")],
    });

    // Convert amounts to selected currency
    const convertedReports = await Promise.all(
      monthlyReports.map(async (report) => {
        const convertedAmount = await convertCurrency(
          report.dataValues.totalAmount,
          "USD", // Assuming default currency is USD
          selectedCurrency
        );
        return {
          ...report.dataValues,
          totalAmount: convertedAmount,
          currencyCode: selectedCurrency,
        };
      })
    );

    res.status(200).json({ reports: convertedReports });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "An error occurred while fetching monthly reports" });
  }
};

exports.getEarningsAnalytics = async (req, res) => {
  try {
    const userId = req.params.userId;
    const selectedCurrency = req.query.currency || "USD";

    // Fetch aggregated monthly earnings and transactions count
    const monthlyReports = await Transaction.findAll({
      attributes: [
        [
          sequelize.fn("EXTRACT", sequelize.literal('MONTH FROM "createdAt"')),
          "month",
        ],
        [sequelize.fn("SUM", sequelize.col("amount")), "totalAmount"],
        [sequelize.fn("COUNT", sequelize.col("id")), "transactionCount"],
      ],
      where: { userId },
      group: ["month"],
      order: [sequelize.literal("month ASC")],
    });

    // Calculate percentChange
    const analytics = monthlyReports.map((report, index) => {
      if (index === 0) return { ...report.dataValues, percentChange: null };

      const previousMonthEarnings =
        monthlyReports[index - 1].dataValues.totalAmount;
      const percentChange =
        ((report.dataValues.totalAmount - previousMonthEarnings) /
          previousMonthEarnings) *
        100;
      return { ...report.dataValues, percentChange };
    });

    // Convert amounts to selected currency
    const convertedAnalytics = await Promise.all(
      analytics.map(async (analytic) => {
        const convertedAmount = await convertCurrency(
          analytic.totalAmount,
          "USD", // Assuming default currency is USD
          selectedCurrency
        );
        return {
          ...analytic,
          totalAmount: convertedAmount,
          currencyCode: selectedCurrency,
        };
      })
    );

    res.status(200).json({ analytics: convertedAnalytics });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "An error occurred while fetching earnings analytics" });
  }
};

exports.downloadReport = async (req, res) => {
  try {
    const userId = req.params.userId;
    const selectedLanguage = req.query.lang || "en"; // Default to English

    if (!i18next.isInitialized) {
      return res.status(500).send("Language system not initialized yet");
    }

    const transactions = await Transaction.findAll({ where: { userId } });
    if (!transactions || transactions.length === 0) {
      return res.status(404).send("No transactions found for the user");
    }

    console.log(i18next);
    i18next.t("transaction.userId", { lng: "en" });
    i18next.changeLanguage(selectedLanguage, async (err) => {
      if (err) {
        console.error("Error changing language:", err);
        return res.status(500).send("Error changing language");
      }

      const fields = ["userId", "amount", "currencyCode", "createdAt"].map(
        (field) => ({
          label: i18next.t(`translation.transaction.${field}`), // Adjusted path to nested key
          value: field,
        })
      );

      const json2csvParser = new Parser({ fields });
      const csv = json2csvParser.parse(
        transactions.map((transaction) => transaction.toJSON())
      );

      res.header("Content-Type", "text/csv");
      res.attachment("report.csv");
      return res.send(csv);
    });
  } catch (error) {
    console.error("Error downloading report:", error);
    return res.status(500).send("Error downloading report");
  }
};
