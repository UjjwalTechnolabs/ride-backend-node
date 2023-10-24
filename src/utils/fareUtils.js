const { VehicleType, Pricing, Currency } = require("../../models");

const { sequelize } = require("../../models");
const https = require("https");
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
  convertedFare = Math.ceil(convertedFare);

  console.log("Converted Fare in", userCurrencyCode, ":", convertedFare);
  return convertedFare;
};

exports.calculateETA = async function (pickupLocation, dropoffLocation) {
  console.log("pickupLocation:" + pickupLocation);
  console.log("dropoffLocation:" + dropoffLocation);
  return new Promise((resolve, reject) => {
    const origin = `${pickupLocation[1]},${pickupLocation[0]}`;
    const destination = `${dropoffLocation[1]},${dropoffLocation[0]}`;
    const apiKey = "AIzaSyBLmcwFlQ68ZbfyQXTQql8Im8AO-aofTy4";

    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?departure_time=now&destinations=${destination}&key=${apiKey}&mode=driving&origins=${origin}&traffic_model=best_guess`;
    console.log(url);
    https
      .get(url, (res) => {
        let data = "";

        res.on("data", (chunk) => {
          data += chunk;
        });

        res.on("end", () => {
          const responseData = JSON.parse(data);
          if (
            responseData &&
            responseData.rows[0] &&
            responseData.rows[0].elements[0]
          ) {
            const etaSeconds =
              responseData.rows[0].elements[0].duration_in_traffic.value;
            const etaMins = etaSeconds / 60;
            resolve(Math.round(etaMins));
          } else {
            console.error("Unexpected Google Maps API response:", responseData);
            resolve(NaN);
          }
        });
      })
      .on("error", (err) => {
        console.error("Error fetching ETA from Google Maps:", err);
        resolve(NaN);
      });
  });
};

exports.calculateETAFinal = async function (pickupLocation, dropoffLocation) {
  console.log("pickupLocation:" + pickupLocation);
  console.log("dropoffLocation:" + dropoffLocation);

  return new Promise((resolve, reject) => {
    const origin = `${pickupLocation[1]},${pickupLocation[0]}`;
    const destination = `${dropoffLocation[1]},${dropoffLocation[0]}`;
    const apiKey = "AIzaSyBLmcwFlQ68ZbfyQXTQql8Im8AO-aofTy4";

    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?departure_time=now&destinations=${destination}&key=${apiKey}&mode=driving&origins=${origin}&traffic_model=best_guess`;
    console.log(url);

    https
      .get(url, (res) => {
        let data = "";

        res.on("data", (chunk) => {
          data += chunk;
        });

        res.on("end", () => {
          const responseData = JSON.parse(data);
          if (
            responseData &&
            responseData.rows[0] &&
            responseData.rows[0].elements[0]
          ) {
            const etaSeconds =
              responseData.rows[0].elements[0].duration_in_traffic.value;
            const etaMins = etaSeconds / 60;

            const distanceMeters =
              responseData.rows[0].elements[0].distance.value;
            const distanceKm = distanceMeters / 1000;

            resolve({
              eta: Math.round(etaMins),
              distance: distanceKm.toFixed(2), // keeping two decimal places
            });
          } else {
            console.error("Unexpected Google Maps API response:", responseData);
            resolve({
              eta: NaN,
              distance: NaN,
            });
          }
        });
      })
      .on("error", (err) => {
        console.error("Error fetching ETA from Google Maps:", err);
        resolve({
          eta: NaN,
          distance: NaN,
        });
      });
  });
};

// exports.calculateETA = async function (pickupLocation, dropoffLocation) {
//   console.log(pickupLocation);
//   console.log(dropoffLocation);
//   try {
//     const response = await client.distancematrix({
//       params: {
//         origins: [`${pickupLocation[1]},${pickupLocation[0]}`],
//         destinations: [`${dropoffLocation[1]},${dropoffLocation[0]}`],
//         mode: "driving",
//         traffic_model: "best_guess",
//         departure_time: "now",
//         key: "AIzaSyBLmcwFlQ68ZbfyQXTQql8Im8AO-aofTy4",
//       },
//     });
//     console.log(response.data);
//     if (
//       response.data &&
//       response.data.rows[0] &&
//       response.data.rows[0].elements[0]
//     ) {
//       const etaSeconds =
//         response.data.rows[0].elements[0].duration_in_traffic.value;
//       const etaMins = etaSeconds / 60;
//       return Math.round(etaMins);
//     } else {
//       console.error("Unexpected Google Maps API response:", response.data);
//       return NaN;
//     }
//   } catch (error) {
//     console.error("Error fetching ETA from Google Maps:", error);
//     if (error.response) {
//       console.error("Error response data:", error.response.data);
//     }
//     return NaN;
//   }
// };
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
