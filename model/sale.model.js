const mongoose = require("mongoose");

const sellPropertySchema = new mongoose.Schema(
  {
    propertyType: {
      type: String,
      enum: ["Apartment", "Independent House", "Villa", "Plot", "Office", "Shop"],
      required: true,
    },
    listingType: {
      type: String,
      enum: ["For Sale"],
      required: true,
    },
    basicDetails: {
      title: { type: String, required: true }, // Property Title
      area: { type: Number, required: true }, // in sq ft
      bhkType: { type: String }, // e.g., 1BHK, 2BHK, 3BHK
      bathrooms: { type: Number },
      furnishingStatus: { type: String },
      propertyFacing: { type: String },
      propertyAge: { type: String },
      price: { type: Number, required: true }, // ✅ Selling Price
      maintenanceCharges: { type: Number },
      amenities: [{ type: String }], // e.g., ["Lift", "Parking", "Gym"]
    },
    location: {
      city: { type: String, required: true },
      locality: { type: String, required: true },
      fullAddress: { type: String },
    },
    description: { type: String },
    images: [
      {
        url: { type: String, required: true },
        fileId: { type: String },
        name: { type: String },
      },
    ],
    whatsNearby: {
      education: [{ name: String, distance: Number }],
      health: [{ name: String, distance: Number }],
      food: [{ name: String, distance: Number }],
      travel: [{ name: String, distance: Number }],
    },
    contactInfo: {
      owner: { type: String, required: true },
      phone: { type: String, required: true },
      email: { type: String, required: true },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("SellProperty", sellPropertySchema);
