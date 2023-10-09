// cronJob.js

const axios = require("axios");
const cron = require("node-cron");
const { Currency, Driver, sequelize } = require("../../models"); // adjust the path accordingly
const Redis = require("ioredis");
const redis = new Redis();
async function updateCurrencyRates() {
  try {
    const response = await axios.get(
      "https://openexchangerates.org/api/latest.json?app_id=c039e9a35c6f4816b9f5d31fbcd1ae18"
    );
    const rates = response.data.rates;

    const symbolNameMapping = {
      USD: { symbol: "$", name: "United States Dollar" },
      INR: { symbol: "₹", name: "Indian Rupee" },
      EUR: { symbol: "€", name: "Euro" },
      GBP: { symbol: "£", name: "British Pound Sterling" },
      AUD: { symbol: "A$", name: "Australian Dollar" },
      CAD: { symbol: "CA$", name: "Canadian Dollar" },
      JPY: { symbol: "¥", name: "Japanese Yen" },
      CNY: { symbol: "¥", name: "Chinese Yuan" },
      BRL: { symbol: "R$", name: "Brazilian Real" },
      ZAR: { symbol: "R", name: "South African Rand" },
      AED: { symbol: "د.إ", name: "United Arab Emirates Dirham" },
      AFN: { symbol: "؋", name: "Afghan Afghani" },
      ALL: { symbol: "L", name: "Albanian Lek" },
      AMD: { symbol: "֏", name: "Armenian Dram" },
      ANG: { symbol: "ƒ", name: "Netherlands Antillean Guilder" },
      AOA: { symbol: "Kz", name: "Angolan Kwanza" },
      ARS: { symbol: "$", name: "Argentine Peso" },
      AWG: { symbol: "ƒ", name: "Aruban Florin" },
      AZN: { symbol: "₼", name: "Azerbaijani Manat" },
      BAM: { symbol: "KM", name: "Bosnia And Herzegovina Convertible Mark" },
      BBD: { symbol: "$", name: "Barbadian Dollar" },
      BDT: { symbol: "৳", name: "Bangladeshi Taka" },
      BGN: { symbol: "лв", name: "Bulgarian Lev" },
      BHD: { symbol: ".د.ب", name: "Bahraini Dinar" },
      BIF: { symbol: "Fr", name: "Burundian Franc" },
      BSD: { symbol: "$", name: "Bahamian Dollar" },
      BTN: { symbol: "Nu.", name: "Bhutanese Ngultrum" },
      BWP: { symbol: "P", name: "Botswanan Pula" },
      BYN: { symbol: "Br", name: "Belarusian Ruble" },
      BZD: { symbol: "$", name: "Belize Dollar" },
      CHF: { symbol: "Fr", name: "Swiss Franc" },
      CLP: { symbol: "$", name: "Chilean Peso" },
      COP: { symbol: "$", name: "Colombian Peso" },
      CRC: { symbol: "₡", name: "Costa Rican Colón" },
      CZK: { symbol: "Kč", name: "Czech Republic Koruna" },
      DJF: { symbol: "Fdj", name: "Djiboutian Franc" },
      DKK: { symbol: "kr", name: "Danish Krone" },
      DOP: { symbol: "$", name: "Dominican Peso" },
      DZD: { symbol: "د.ج", name: "Algerian Dinar" },
      EGP: { symbol: "£", name: "Egyptian Pound" },
      ETB: { symbol: "Br", name: "Ethiopian Birr" },
      FJD: { symbol: "$", name: "Fijian Dollar" },
      FOK: { symbol: "kr", name: "Faroese króna" },
      GEL: { symbol: "₾", name: "Georgian Lari" },
      GHS: { symbol: "₵", name: "Ghanaian Cedi" },
      GIP: { symbol: "£", name: "Gibraltar Pound" },
      GMD: { symbol: "D", name: "Gambian Dalasi" },
      GNF: { symbol: "Fr", name: "Guinean Franc" },
      GTQ: { symbol: "Q", name: "Guatemalan Quetzal" },
      GYD: { symbol: "$", name: "Guyanaese Dollar" },
      HKD: { symbol: "$", name: "Hong Kong Dollar" },
      HNL: { symbol: "L", name: "Honduran Lempira" },
      HRK: { symbol: "kn", name: "Croatian Kuna" },
      HTG: { symbol: "G", name: "Haitian Gourde" },
      HUF: { symbol: "Ft", name: "Hungarian Forint" },
      IDR: { symbol: "Rp", name: "Indonesian Rupiah" },
      ILS: { symbol: "₪", name: "Israeli New Shekel" },
      IQD: { symbol: "ع.د", name: "Iraqi Dinar" },
      IRR: { symbol: "﷼", name: "Iranian Rial" },
      ISK: { symbol: "kr", name: "Icelandic Króna" },
      JMD: { symbol: "$", name: "Jamaican Dollar" },
      JOD: { symbol: "JD", name: "Jordanian Dinar" },
      KES: { symbol: "Sh", name: "Kenyan Shilling" },
      KGS: { symbol: "с", name: "Kyrgystani Som" },
      KHR: { symbol: "៛", name: "Cambodian Riel" },
      KID: { symbol: "$", name: "Kiribati Dollar" },
      KMF: { symbol: "Fr", name: "Comorian Franc" },
      KRW: { symbol: "₩", name: "South Korean Won" },
      KWD: { symbol: "KD", name: "Kuwaiti Dinar" },
      KYD: { symbol: "$", name: "Cayman Islands Dollar" },
      KZT: { symbol: "₸", name: "Kazakhstani Tenge" },
      LAK: { symbol: "₭", name: "Laotian Kip" },
      LBP: { symbol: "ل.ل", name: "Lebanese Pound" },
      LKR: { symbol: "Rs", name: "Sri Lankan Rupee" },
      LRD: { symbol: "$", name: "Liberian Dollar" },
      LSL: { symbol: "L", name: "Lesotho Loti" },
      LYD: { symbol: "ل.د", name: "Libyan Dinar" },
      MAD: { symbol: "د.م.", name: "Moroccan Dirham" },
      MDL: { symbol: "L", name: "Moldovan Leu" },
      MGA: { symbol: "Ar", name: "Malagasy Ariary" },
      MKD: { symbol: "ден", name: "Macedonian Denar" },
      MMK: { symbol: "K", name: "Myanmar Kyat" },
      MNT: { symbol: "₮", name: "Mongolian Tugrik" },
      MOP: { symbol: "P", name: "Macanese Pataca" },
      MRU: { symbol: "UM", name: "Mauritanian Ouguiya" },
      MUR: { symbol: "₨", name: "Mauritian Rupee" },
      MVR: { symbol: "Rf", name: "Maldivian Rufiyaa" },
      MWK: { symbol: "MK", name: "Malawian Kwacha" },
      MXN: { symbol: "$", name: "Mexican Peso" },
      MYR: { symbol: "RM", name: "Malaysian Ringgit" },
      MZN: { symbol: "MT", name: "Mozambican Metical" },
      NAD: { symbol: "$", name: "Namibian Dollar" },
      NGN: { symbol: "₦", name: "Nigerian Naira" },
      NIO: { symbol: "C$", name: "Nicaraguan Córdoba" },
      NOK: { symbol: "kr", name: "Norwegian Krone" },
      NPR: { symbol: "₨", name: "Nepalese Rupee" },
      NZD: { symbol: "$", name: "New Zealand Dollar" },
      OMR: { symbol: "ر.ع.", name: "Omani Rial" },
      PAB: { symbol: "B/.", name: "Panamanian Balboa" },
      PEN: { symbol: "S/.", name: "Peruvian Sol" },
      PGK: { symbol: "K", name: "Papua New Guinean Kina" },
      PHP: { symbol: "₱", name: "Philippine Peso" },
      PKR: { symbol: "₨", name: "Pakistani Rupee" },
      PLN: { symbol: "zł", name: "Polish Zloty" },
      PYG: { symbol: "₲", name: "Paraguayan Guarani" },
      QAR: { symbol: "ر.ق", name: "Qatari Rial" },
      RON: { symbol: "lei", name: "Romanian Leu" },
      RSD: { symbol: "дин", name: "Serbian Dinar" },
      RUB: { symbol: "₽", name: "Russian Ruble" },
      RWF: { symbol: "Fr", name: "Rwandan Franc" },
      SAR: { symbol: "ر.س", name: "Saudi Riyal" },
      SBD: { symbol: "$", name: "Solomon Islands Dollar" },
      SCR: { symbol: "₨", name: "Seychellois Rupee" },
      SDG: { symbol: "£", name: "Sudanese Pound" },
      SEK: { symbol: "kr", name: "Swedish Krona" },
      SGD: { symbol: "$", name: "Singapore Dollar" },
      SLL: { symbol: "Le", name: "Sierra Leonean Leone" },
      SOS: { symbol: "Sh", name: "Somali Shilling" },
      SRD: { symbol: "$", name: "Surinamese Dollar" },
      SSP: { symbol: "£", name: "South Sudanese Pound" },
      STN: { symbol: "Db", name: "São Tomé and Príncipe Dobra" },
      SVC: { symbol: "₡", name: "Salvadoran Colón" },
      SYP: { symbol: "£", name: "Syrian Pound" },
      SZL: { symbol: "L", name: "Swazi Lilangeni" },
      THB: { symbol: "฿", name: "Thai Baht" },
      TJS: { symbol: "SM", name: "Tajikistani Somoni" },
      TMT: { symbol: "T", name: "Turkmenistani Manat" },
      TND: { symbol: "د.ت", name: "Tunisian Dinar" },
      TOP: { symbol: "T$", name: "Tongan Paʻanga" },
      TRY: { symbol: "₺", name: "Turkish Lira" },
      TTD: { symbol: "$", name: "Trinidad and Tobago Dollar" },
      TVD: { symbol: "$", name: "Tuvaluan Dollar" },
      TWD: { symbol: "NT$", name: "New Taiwan Dollar" },
      TZS: { symbol: "Sh", name: "Tanzanian Shilling" },
      UAH: { symbol: "₴", name: "Ukrainian Hryvnia" },
      UGX: { symbol: "Sh", name: "Ugandan Shilling" },
      UYU: { symbol: "$", name: "Uruguayan Peso" },
      UZS: { symbol: "лв", name: "Uzbekistan Som" },
      VES: { symbol: "Bs.", name: "Venezuelan Bolívar Soberano" },
      VND: { symbol: "₫", name: "Vietnamese Dong" },
      VUV: { symbol: "Vt", name: "Vanuatu Vatu" },
      WST: { symbol: "T", name: "Samoan Tālā" },
      XAF: { symbol: "Fr", name: "Central African CFA Franc" },
      XCD: { symbol: "$", name: "East Caribbean Dollar" },
      XDR: { symbol: "SDR", name: "Special Drawing Rights" },
      XOF: { symbol: "Fr", name: "West African CFA Franc" },
      YER: { symbol: "﷼", name: "Yemeni Rial" },
      ZMW: { symbol: "ZK", name: "Zambian Kwacha" },
    };

    for (const [code, rate] of Object.entries(rates)) {
      const mapping = symbolNameMapping[code];
      if (!mapping) {
        console.error(`No mapping found for currency code: ${code}`);
        continue;
      }

      const { symbol, name } = mapping;
      await Currency.upsert({ code, exchangeRate: rate, symbol, name });
    }
    console.log("Currency rates updated successfully");
  } catch (error) {
    console.error("Error updating currency rates", error);
  }
}

const updateDatabaseWithDriverLocations = async () => {
  const driverKeys = await redis.keys("driver:*:location");
  console.log("Driver keys:", driverKeys);

  if (driverKeys.length === 0) return;

  const pipeline = redis.pipeline();
  driverKeys.forEach((key) => pipeline.get(key));
  const locations = await pipeline.exec();

  // Debug raw location data from Redis
  locations.forEach((loc) => console.log("Raw location data from Redis:", loc));

  // Convert Redis responses to an array of updates
  const updates = locations.map(([_, location], index) => {
    const driverId = driverKeys[index].split(":")[1];

    // Parse the location data from Redis
    const parsedLocation = JSON.parse(location);

    // Convert {lat, lng} format to GeoJSON format
    const geoJSONLocation = {
      type: "Point",
      coordinates: [
        parseFloat(parsedLocation.lng),
        parseFloat(parsedLocation.lat),
      ],
    };

    return { driverId, location: geoJSONLocation };
  });

  // Batch update PostgreSQL using a transaction for consistency
  const t = await sequelize.transaction();
  try {
    for (const { driverId, location } of updates) {
      console.log(
        "Updating location for driver:",
        driverId,
        "with data:",
        location
      );
      await Driver.update(
        { location },
        { where: { id: driverId } },
        { transaction: t }
      );
    }
    await t.commit();
    // Remove processed keys from Redis after a successful update to the database
    await redis.del(...driverKeys);
  } catch (error) {
    console.error("Error updating driver locations in database:", error);
    await t.rollback();
  }
};

// Run the above function every 2 minutes

// Schedule the job
cron.schedule("0 0 * * **", () => {
  try {
    updateCurrencyRates();
  } catch (error) {
    console.error("Error running job:", error);
  }
});

cron.schedule("*/2 * * * *", () => {
  try {
    updateDatabaseWithDriverLocations();
  } catch (error) {
    console.error("Error running job:", error);
  }
});

// Examples:
// "0 0 * * *" will run every day at midnight.
// "*/10 * * * *" will run every 10 minutes.
// "0 */2 * * *" will run every 2 hours.
// "0 12 * * 1" will run every Monday at 12:00 PM.
// "0 0 1 1 *" will run every year on 1st January at midnight.
// Your Use Case:
// If you want to run every minute: "* * * * *"
// If you want to run at a specific hour, for example at 3 PM: "0 15 * * *"
// If you want to run every day at a specific time, for example, every day at 4:30 AM: "30 4 * * *"
// If you want to run in a specific month, for example, every January: "0 0 1 1 *"
// If you want to run in a specific year, for example, every 1st January 2025: "0 0 1 1 * 2025" (This is supported by the node-cron package, it's not standard cron syntax)
module.exports = {
  updateCurrencyRates,
  updateDatabaseWithDriverLocations,
};
