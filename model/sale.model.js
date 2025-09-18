const mongoose = require("mongoose");

const sellPropertySchema = new mongoose.Schema(
  {
    propertyType: {
      type: String,
      enum: [
        "Apartment",
        "Independent House",
        "Villa",
        "Commercial Space",
        "Plot",
        "Office",
        "Shop",
      ],
      required: true,
    },
    listingType: {
      type: String,
      enum: ["For Sale"],
      required: true,
    },
    basicDetails: {
      title: { type: String, required: true }, // Property Title
      area: { type: Number, required: true }, // Built-up area (sq ft)
      carpetArea: { type: Number }, // Carpet area (sq ft)
      bhkType: { type: String }, // e.g., 1BHK, 2BHK, 3BHK
      bathrooms: { type: Number },
      furnishingStatus: { type: String }, // Furnished / Semi-furnished / Unfurnished
      propertyFacing: { type: String }, // East, West, North, South
      propertyAge: { type: String }, // e.g., "0-1 Year Old"
      floor: { type: String }, // e.g., "8th of 22 Floors"
      transactionType: { type: String }, // New / Resale
      price: { type: Number, required: true }, // Selling Price
      priceUnit: { type: String, default: "Crores" }, // e.g., Lakhs / Crores
      maintenanceCharges: { type: Number },
      reraId: { type: String }, // RERA ID
      amenities: [{ type: String }], // e.g., ["Lift", "Parking", "Gym"]
    },
    location: {
      city: { type: String, required: true },
      locality: { type: String, required: true },
      landmark: { type: String },
      fullAddress: { type: String },
      pincode: { type: String },
    },
    description: { type: String },

   

    // ✅ Optional multiple images
    images: [
      {
        url: { type: String, required: true },
        fileId: { type: String },
        name: { type: String },
      },
    ],

    // ✅ Floor plan details (only 3 fields)
    floorPlan: {
      diningArea: { type: Number }, // in sq ft
      bedroomArea: { type: Number }, // in sq ft
      bathroomArea: { type: Number }, // in sq ft
    },

    // ✅ Single video instead of multiple
    video: { type: String }, // Single video URL

    virtualTour: { type: String }, // 360° Virtual Tour link

    whatsNearby: {
      education: [{ name: String, distance: Number }], // in km
      health: [{ name: String, distance: Number }],
      food: [{ name: String, distance: Number }],
      travel: [{ name: String, distance: Number }],
    },

    contactInfo: {
      advisor: { type: String }, // Advisor name
      owner: { type: String }, // Owner / Agent
      phone: { type: String, required: true },
      email: { type: String, required: true },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("SellProperty", sellPropertySchema);
