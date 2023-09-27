const { Pricing } = require("../../models");

class PricingController {
  static async createPricing(req, res) {
    try {
      const {
        currencyCode,
        serviceType,
        location,
        peakMultiplier,
        taxPercent,
        dynamicPricingEnabled,
        discountPercent,
        baserate,
        rateperkm,
      } = req.body;

      // Additional validations if needed

      const newPricing = await Pricing.create({
        currencyCode,
        serviceType,
        location,
        peakMultiplier,
        taxPercent,
        dynamicPricingEnabled,
        discountPercent,
        baserate,
        rateperkm,
      });

      return res.status(201).json(newPricing);
    } catch (error) {
      console.error(error);
      return res.status(500).send("Internal Server Error");
    }
  }
  static async updatePricing(req, res) {
    try {
      const pricingId = req.params.id;
      const {
        currencyCode,
        serviceType,
        location,
        peakMultiplier,
        taxPercent,
        dynamicPricingEnabled,
        discountPercent,
        baserate,
        rateperkm,
      } = req.body;

      const pricing = await Pricing.findByPk(pricingId);
      if (!pricing) return res.status(404).json({ error: "Pricing not found" });

      pricing.currencyCode = currencyCode;
      pricing.serviceType = serviceType;
      pricing.location = location;
      pricing.peakMultiplier = peakMultiplier;
      pricing.taxPercent = taxPercent;
      pricing.dynamicPricingEnabled = dynamicPricingEnabled;
      pricing.discountPercent = discountPercent;
      pricing.baserate = baserate;
      pricing.ratererkm = rateperkm;

      await pricing.save();

      return res.status(200).json(pricing);
    } catch (error) {
      console.error(error);
      return res.status(500).send("Internal Server Error");
    }
  }
  static async deletePricing(req, res) {
    try {
      const pricingId = req.params.id;
      const pricing = await Pricing.findByPk(pricingId);
      if (!pricing) return res.status(404).json({ error: "Pricing not found" });

      await pricing.destroy();
      return res.status(204).send();
    } catch (error) {
      console.error(error);
      return res.status(500).send("Internal Server Error");
    }
  }
  static async getPricing(req, res) {
    try {
      const pricingId = req.params.id;
      const pricing = await Pricing.findByPk(pricingId);
      if (!pricing) return res.status(404).json({ error: "Pricing not found" });

      return res.status(200).json(pricing);
    } catch (error) {
      console.error(error);
      return res.status(500).send("Internal Server Error");
    }
  }

  // Additional Methods for Updating, Deleting, Retrieving Pricing
}

module.exports = PricingController;
