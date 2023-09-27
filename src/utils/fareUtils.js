const { VehicleType, Pricing, Currency } = require("../../models");
const { Client } = require("@googlemaps/google-maps-services-js");
const client = new Client({});
const { sequelize } = require("../../models");
const axios = require("axios");

// exports.calculateFare = async function (distance, vehicleTypeId) {
//   const vehicleType = await VehicleType.findByPk(vehicleTypeId);

//   if (!vehicleType) {
//     console.log("Error: No vehicle type found for", vehicleTypeId);
//     return null;
//   }

//   console.log("Base Fare:", vehicleType.dataValues.baseFare);

//   const ratePerKm = 20; // As discussed before
//   const fare = vehicleType.dataValues.baseFare + distance * ratePerKm;

//   console.log("Calculated Fare:", fare);

//   return fare;
// };working
exports.calculateFare = async function (
  distance,
  vehicleTypeId,
  userCurrencyCode,
  serviceType,
  location
) {
  const vehicleType = await VehicleType.findByPk(vehicleTypeId);
  const userPreferredCurrency = await Currency.findByPk(userCurrencyCode);

  if (!vehicleType || !userPreferredCurrency) {
    console.log(
      "Error: No vehicle type or currency found for",
      vehicleTypeId,
      userCurrencyCode
    );
    return null;
  }

  // Fetch the relevant pricing object based on serviceType, location, etc
  const pricing = await Pricing.findOne({
    where: {
      serviceType,
      location: sequelize.where(
        sequelize.fn("LOWER", sequelize.col("location")),
        sequelize.fn("LOWER", location)
      ),
      // Add any other filters if needed
    },
  });

  if (!pricing) {
    console.log("Error: No pricing found for", serviceType, location);
    return null;
  }
  const peakStartHour = 17; // 5 PM
  const peakEndHour = 19; // 7 PM

  const currentHour = new Date().getHours(); // Get the current hour
  const isPeakHour = currentHour >= peakStartHour && currentHour < peakEndHour;

  let baseFare =
    parseFloat(pricing.baserate) + distance * parseFloat(pricing.rateperkm);

  if (isPeakHour) {
    baseFare *= pricing.peakMultiplier;
  }

  let taxComponent = baseFare * parseFloat(pricing.taxPercent);

  let totalTax = taxComponent / 100;

  let discountComponent = baseFare * parseFloat(pricing.discountPercent);

  let totalDiscount = discountComponent / 100;

  let totalFare = baseFare + totalTax - totalDiscount;

  // Convert to User Preferred Currency
  let convertedFare = totalFare * userPreferredCurrency.exchangeRate;
  console.log(convertedFare);
  console.log("Converted Fare in", userCurrencyCode, ":", convertedFare);
  return convertedFare;
};

exports.calculateETA = async function (pickupLocation, dropoffLocation) {
  try {
    const response = await client.distancematrix({
      params: {
        origins: [`${pickupLocation[1]},${pickupLocation[0]}`],
        destinations: [`${dropoffLocation[1]},${dropoffLocation[0]}`],
        mode: "driving",
        traffic_model: "best_guess",
        departure_time: "now",
        key: "AIzaSyBLmcwFlQ68ZbfyQXTQql8Im8AO-aofTy4",
      },
    });

    if (
      response.data &&
      response.data.rows[0] &&
      response.data.rows[0].elements[0]
    ) {
      const etaSeconds =
        response.data.rows[0].elements[0].duration_in_traffic.value;
      const etaMins = etaSeconds / 60;
      return Math.round(etaMins);
    } else {
      console.error("Unexpected Google Maps API response:", response.data);
      return NaN;
    }
  } catch (error) {
    console.error("Error fetching ETA from Google Maps:", error);
    if (error.response) {
      console.error("Error response data:", error.response.data);
    }
    return NaN;
  }
};
/**
 * Convert currency from one to another.
 * @param {number} amount - The amount of money to convert.
 * @param {string} fromCurrency - ISO currency code of the source currency, e.g. 'USD'.
 * @param {string} toCurrency - ISO currency code of the target currency, e.g. 'INR'.
 * @returns {Promise<number>} - The converted amount in the target currency.
 */

exports.convertCurrency = async function (
  amount,
  fromCurrencyCode,
  toCurrencyCode
) {
  try {
    if (fromCurrencyCode === toCurrencyCode) return amount; // No conversion needed

    // Fetch the exchange rate of the from currency
    const fromCurrency = await Currency.findByPk(fromCurrencyCode);
    if (!fromCurrency)
      throw new Error(`Currency not found: ${fromCurrencyCode}`);

    // Fetch the exchange rate of the to currency
    const toCurrency = await Currency.findByPk(toCurrencyCode);
    if (!toCurrency) throw new Error(`Currency not found: ${toCurrencyCode}`);

    // Convert the amount to the base currency (Assuming USD as base currency)
    const amountInBaseCurrency = amount / fromCurrency.exchangeRate;

    // Convert the amount in base currency to the target currency
    const convertedAmount = amountInBaseCurrency * toCurrency.exchangeRate;

    return convertedAmount;
  } catch (error) {
    console.error(
      `Error converting ${amount} from ${fromCurrencyCode} to ${toCurrencyCode}:`,
      error.message
    );
    throw error;
  }
  1;
};
