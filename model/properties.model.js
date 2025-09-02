const mongoose = require("mongoose");

const propertySchema = new mongoose.Schema({
  propertyType: {
    type: String,
    enum: ["Apartment","" "Villa", "Office", "Shop", "Independent house"],
    required: true,
  },
  listingType: {
    type: String,
    enum: ["For Rent", "For Sale"],
    required: true,
  },
  basicDetails: {
    title: { type: String, required: true }, // Property Title
    area: { type: Number, required: true }, // in sq ft
    bhkType: { type: String }, // e.g., 1BHK, 2BHK, 3BHK
    bathrooms: { type: Number },
    furnishingStatus: {
      type: String,
      enum: ["Furnished", "Semi-Furnished", "Unfurnished"],
    },
    monthlyRent: { type: Number },
    securityDeposit: { type: Number },
    maintenanceCharges: { type: Number },
  },
  location: {
    city: { type: String, required: true },
    locality: { type: String, required: true },
    fullAddress: { type: String },
  },
  description: { type: String },
  images: [{ type: String }], // store image URLs
  contactInfo: {
    owner: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true },
  },
}, { timestamps: true });

module.exports=mongoose.model("Property", propertySchema);
