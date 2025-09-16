const SellPropertyModel = require("../model/sale.model");
const multer = require("multer");
const { uploadFile } = require("../services/imageStorage.service");


const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });


// add  sale property 
const addSaleProperty = async (req, res) => {
  try {
    const {
      propertyType,
      listingType,
      title,
      area,
      bhkType,
      bathrooms,
      furnishingStatus,
      propertyFacing,
      propertyAge,
      price,
      maintenanceCharges,
      city,
      locality,
      fullAddress,
      description,
      owner,
      phone,
      email,
      educationName,
      educationDistance,
      healthName,
      healthDistance,
      foodName,
      foodDistance,
      travelName,
      travelDistance
    } = req.body;


    let amenities = [];
    if (req.body.amenities) {
      if (Array.isArray(req.body.amenities)) {
        amenities = req.body.amenities;
      } else {
        amenities = [req.body.amenities]; 
      }
    }

 
    let imageObjects = [];
    if (req.files?.length) {
      const uploadResults = await Promise.all(req.files.map(uploadFile));
      imageObjects = uploadResults.map(r => ({
        url: r.url,
        fileId: r.fileId,
        name: r.name
      }));
    }

    
    const whatsNearby = {
      education: educationName && educationDistance ? [{
        name: educationName,
        distance: parseFloat(educationDistance)
      }] : [],
      health: healthName && healthDistance ? [{
        name: healthName,
        distance: parseFloat(healthDistance)
      }] : [],
      food: foodName && foodDistance ? [{
        name: foodName,
        distance: parseFloat(foodDistance)
      }] : [],
      travel: travelName && travelDistance ? [{
        name: travelName,
        distance: parseFloat(travelDistance)
      }] : []
    };


    const newProperty = new SellPropertyModel({
      propertyType: propertyType?.trim(),
      listingType: listingType?.trim(),
      basicDetails: {
        title,
        area,
        bhkType,
        bathrooms,
        furnishingStatus,
        propertyFacing,
        propertyAge,
        price,
        maintenanceCharges,
        amenities
      },
      location: {
        city,
        locality,
        fullAddress
      },
      description,
      images: imageObjects,
      whatsNearby,
      contactInfo: {
        owner,
        phone,
        email
      }
    });

    const savedProperty = await newProperty.save();

    res.status(201).json({
      success: true,
      message: "✅ Sale property added successfully",
      property: savedProperty
    });

  } catch (error) {
    console.error("Error adding sale property:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};


// get all sale property
const getAllSaleProperties = async (req, res) => {
  try {
    const { 
      propertyType, 
      city, 
      locality, 
      minPrice, 
      maxPrice, 
      listingType, 
      bhkType 
    } = req.query;

    let query = {};

    if (propertyType) query.propertyType = propertyType;
    if (listingType) query.listingType = listingType;
    if (bhkType) query["basicDetails.bhkType"] = bhkType;
    if (city) query["location.city"] = { $regex: city, $options: "i" };
    if (locality) query["location.locality"] = { $regex: locality, $options: "i" };

    if (minPrice || maxPrice) {
      query["basicDetails.price"] = {}; // <-- changed from monthlyRent to price
      if (minPrice) query["basicDetails.price"].$gte = parseInt(minPrice);
      if (maxPrice) query["basicDetails.price"].$lte = parseInt(maxPrice);
    }

    console.log("🔍 Final Query:", query);

    const properties = await SellPropertyModel.find(query); // <-- use correct model here

    res.status(200).json({
      success: true,
      message: Object.keys(req.query).length 
        ? "Filtered properties fetched successfully"
        : "All properties fetched successfully",
      count: properties.length,
      properties
    });

  } catch (error) {
    console.error("Error fetching properties:", error.message);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//get sale property by id
const getSalePropertyById = async (req, res) => {
  try {
    const {id} =req.params;
    const Saleproperty = await SellPropertyModel.findById(id);
    if (!Saleproperty) {
      return res.status(404).json({ success: false, message: "Sale Property not found" });
    }
    res.status(200).json({
      success: true,
      Saleproperty
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};


//get property owner number

const getPropertyOwnerNumber = async (req, res) => {
  try {
    const number ="7011769523"
    res.status(200).json({
      message: "Owner Number fetched successfully",
      success: true,
      number
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message , number });
  }
};


//search sale property
const searchSaleProperties = async (req, res) => {
  try {
    const { 
      propertyType, 
      city, 
      locality, 
      minPrice, 
      maxPrice, 
      listingType, 
      bhkType 
    } = req.query;

    let query = {};

    if (propertyType) query.propertyType = propertyType;
    if (listingType) query.listingType = listingType;
    if (bhkType) query["basicDetails.bhkType"] = bhkType;
    if (city) query["location.city"] = { $regex: city, $options: "i" };
    if (locality) query["location.locality"] = { $regex: locality, $options: "i" };

    if (minPrice || maxPrice) {
      query["basicDetails.price"] = {};
      if (minPrice) query["basicDetails.price"].$gte = parseInt(minPrice);
      if (maxPrice) query["basicDetails.price"].$lte = parseInt(maxPrice);
    }

    console.log("🔍 Final Query:", query);

    const properties = await SellPropertyModel.find(query);
    console.log(`Found ${properties.length} properties matching criteria.`);

    res.status(200).json({
      success: true,
      count: properties.length,
      properties
    });

  } catch (error) {
    console.error(error.message);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};




module.exports = { upload, addSaleProperty,getAllSaleProperties,getSalePropertyById,getPropertyOwnerNumber,searchSaleProperties };
