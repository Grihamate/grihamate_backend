const PropertyModel = require("../model/properties.model");
const multer = require("multer");
const { uploadFile } = require("../services/imageStorage.service");

// Multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

const addProperty = async (req, res) => {
  try {
    const {
      propertyType,
      listingType,
      title,
      area,
      bhkType,
      bathrooms,
      furnishingStatus,
      monthlyRent,
      securityDeposit,
      maintenanceCharges,
      city,
      locality,
      fullAddress,
      description,
      owner,
      phone,
      email,
      images // this can be URLs in JSON body
    } = req.body;

    let imageUrls = [];

    // If user uploaded files → upload to ImageKit
    if (req.files?.length) {
      const uploadResults = await Promise.all(req.files.map(file => uploadFile(file)));
      imageUrls = uploadResults.map(r => r.url);

    }
    else{
      console.log("no file recieved")
    }

    // If user passed URLs → append them
    if (images) {
      if (Array.isArray(images)) {
        imageUrls = [...imageUrls, ...images];
      } else if (typeof images === "string") {
        imageUrls.push(images);
      }
    }

    const newProperty = new PropertyModel({
      propertyType,
      listingType,
      basicDetails: {
        title,
        area,
        bhkType,
        bathrooms,
        furnishingStatus,
        monthlyRent,
        securityDeposit,
        maintenanceCharges,
      },
      location: { city, locality, fullAddress },
      description,
      images: imageUrls,
      contactInfo: { owner, phone, email },
    });

    const savedProperty = await newProperty.save();
    res.status(201).json({
      success: true,
      message: "Property added successfully",
      property: savedProperty
    });
  } catch (error) {
    console.error("❌ Error in addProperty:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};


const getAllProperties = async (req, res) => {
  try {
    const properties = await PropertyModel.find({}, {
      images: 1,                           
      "basicDetails.bhkType": 1,
      "location.locality": 1,
      "location.city": 1,
      description: 1,
      "basicDetails.monthlyRent": 1,
      "basicDetails.title": 1,
      "basicDetails.bathrooms": 1,
      "basicDetails.area": 1
    });

    res.status(200).json({
      success: true,
      properties
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};


const getProperty = async (req, res) => {
  try {
    const {id} =req.params;
    const property = await PropertyModel.findById(id);
    if (!property) {
      return res.status(404).json({ success: false, message: "Property not found" });
    }
    res.status(200).json({
      success: true,
      property
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};


const getNumberOfProperties = async (req, res) => {
  try {
    const number ="7011769523"
    res.status(200).json({
      success: true,
      number
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message , number });
  }
};

module.exports = { upload, addProperty,getAllProperties,getProperty,getNumberOfProperties };
