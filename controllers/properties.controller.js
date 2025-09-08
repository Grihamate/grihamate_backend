const PropertyModel = require("../model/properties.model");
const multer = require("multer");
const { uploadFile } = require("../services/imageStorage.service");

// Multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// const addProperty = async (req, res) => {
//   try {
//     const {
//       propertyType,
//       listingType,
//       title,
//       area,
//       bhkType,
//       bathrooms,
//       furnishingStatus,
//       monthlyRent,
//       securityDeposit,
//       maintenanceCharges,
//       city,
//       locality,
//       fullAddress,
//       description,
//       owner,
//       phone,
//       email,
//       images // this can be URLs in JSON body
//     } = req.body;

//     let imageUrls = [];

//     // If user uploaded files → upload to ImageKit
//     if (req.files?.length) {
//       const uploadResults = await Promise.all(req.files.map(file => uploadFile(file)));
//       imageUrls = uploadResults.map(r => r.url);

//     }
//     else{
//       console.log("no file recieved")
//     }

//     // If user passed URLs → append them
//     if (images) {
//       if (Array.isArray(images)) {
//         imageUrls = [...imageUrls, ...images];
//       } else if (typeof images === "string") {
//         imageUrls.push(images);
//       }
//     }

//     const newProperty = new PropertyModel({
//       propertyType,
//       listingType,
//       basicDetails: {
//         title,
//         area,
//         bhkType,
//         bathrooms,
//         furnishingStatus,
//         monthlyRent,
//         securityDeposit,
//         maintenanceCharges,
//       },
//       location: { city, locality, fullAddress },
//       description,
//       images: imageUrls,
//       contactInfo: { owner, phone, email },
//     });

//     const savedProperty = await newProperty.save();
//     res.status(201).json({
//       success: true,
//       message: "Property added successfully",
//       property: savedProperty
//     });
//   } catch (error) {
//     console.error("❌ Error in addProperty:", error);
//     res.status(500).json({ success: false, message: error.message });
//   }
// };


// const getAllProperties = async (req, res) => {
//   try {
//     const properties = await PropertyModel.find({}, {
//       images: 1,                           
//       "basicDetails.bhkType": 1,
//       "location.locality": 1,
//       "location.city": 1,
//       description: 1,
//       "basicDetails.monthlyRent": 1,
//       "basicDetails.title": 1,
//       "basicDetails.bathrooms": 1,
//       "basicDetails.area": 1
//     });

//     res.status(200).json({
//       success: true,
//       message: "Properties fetched successfully",
//       properties
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ success: false, message: error.message });
//   }
// };


// const getAllProperties = async (req, res) => {
//   try {
//     const allProperties = await PropertyModel.find(); 

//     res.status(200).json({
//       success: true,
//       message: "Properties fetched successfully",
//       allProperties
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

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
      propertyFacing,
      propertyAge,
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
      images
    } = req.body;

    let imageObjects = [];

    // 1️⃣ Handle uploaded files (via Multer + ImageKit)
    if (req.files?.length) {
      const uploadResults = await Promise.all(
        req.files.map(file => uploadFile(file))
      );
      imageObjects = uploadResults.map(r => ({
        url: r.url,
        fileId: r.fileId,
        name: r.name
      }));
    }

    // 2️⃣ Handle image URLs (manual input via form-data or JSON)
    if (images) {
      let parsedImages = [];
      if (Array.isArray(images)) {
        parsedImages = images.map(url => ({ url }));
      } else if (typeof images === "object") {
        parsedImages = Object.values(images).map(url => ({ url }));
      } else if (typeof images === "string") {
        parsedImages = [{ url: images }];
      }
      imageObjects = [...imageObjects, ...parsedImages];
    }

    // 3️⃣ Build property object
    const newProperty = new PropertyModel({
      propertyType: propertyType?.trim(),
      listingType: listingType?.trim(),
      basicDetails: {
        title: req.body?.basicDetails?.title || title,
        area: req.body?.basicDetails?.area || area,
        bhkType: req.body?.basicDetails?.bhkType || bhkType,
        bathrooms: req.body?.basicDetails?.bathrooms || bathrooms,
        furnishingStatus:
          req.body?.basicDetails?.furnishingStatus || furnishingStatus,
        propertyFacing:
          req.body?.basicDetails?.propertyFacing || propertyFacing,
        propertyAge: req.body?.basicDetails?.propertyAge || propertyAge,
        monthlyRent: req.body?.basicDetails?.monthlyRent || monthlyRent,
        securityDeposit:
          req.body?.basicDetails?.securityDeposit || securityDeposit,
        maintenanceCharges:
          req.body?.basicDetails?.maintenanceCharges || maintenanceCharges,
        amenities:
          req.body?.basicDetails?.amenities || req.body?.amenities || []
      },
      location: {
        city: req.body?.location?.city || city,
        locality: req.body?.location?.locality || locality,
        fullAddress: req.body?.location?.fullAddress || fullAddress
      },
      description,
      images: imageObjects, // storing { url, fileId, name }
      whatsNearby: req.body.whatsNearby || {},
      contactInfo: {
        owner: req.body?.contactInfo?.owner || owner,
        phone: req.body?.contactInfo?.phone || phone,
        email: req.body?.contactInfo?.email || email
      }
    });

    // 4️⃣ Save to DB
    const savedProperty = await newProperty.save();

    res.status(201).json({
      success: true,
      message: "✅ Property added successfully",
      property: savedProperty
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};




const getAllProperties= async (req, res) => {
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

    // Build query object dynamically
    let query = {};

    if (propertyType) query.propertyType = propertyType;
    if (listingType) query.listingType = listingType;
    if (bhkType) query["basicDetails.bhkType"] = bhkType;
    if (city) query["location.city"] = { $regex: city, $options: "i" };
    if (locality) query["location.locality"] = { $regex: locality, $options: "i" };

    if (minPrice || maxPrice) {
      query["basicDetails.monthlyRent"] = {};
      if (minPrice) query["basicDetails.monthlyRent"].$gte = parseInt(minPrice);
      if (maxPrice) query["basicDetails.monthlyRent"].$lte = parseInt(maxPrice);
    }

    console.log("🔍 Final Query:", query);

    const properties = await PropertyModel.find(query);

    res.status(200).json({
      success: true,
      message: Object.keys(req.query).length 
        ? "Filtered properties fetched successfully"
        : "All properties fetched successfully",
      count: properties.length,
      properties
    });

  } catch (error) {
    console.error("❌ Error fetching properties:", error.message);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};



const getPropertyById = async (req, res) => {
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
      message: "Number of properties fetched successfully",
      success: true,
      number
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message , number });
  }
};

const searchProperties = async (req, res) => {
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

    // Build query object dynamically
    let query = {};

    if (propertyType) query.propertyType = propertyType;
    if (listingType) query.listingType = listingType;
    if (bhkType) query["basicDetails.bhkType"] = bhkType;

   
    if (locality) query["location.locality"] = { $regex: locality, $options: "i" };

    if (minPrice || maxPrice) {
      query["basicDetails.monthlyRent"] = {};
      if (minPrice) query["basicDetails.monthlyRent"].$gte = parseInt(minPrice);
      if (maxPrice) query["basicDetails.monthlyRent"].$lte = parseInt(maxPrice);
    }

    console.log("🔍 Final Query:", query);

    const properties = await PropertyModel.find(query);
    console.log(`✅ Found ${properties.length} properties matching criteria.`);

    res.status(200).json({
      success: true,
      count: properties.length,
      properties
    });

  } catch (error) {
    console.error("❌ Search Error:", error.message);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


module.exports = { upload, addProperty,getAllProperties,getPropertyById,getNumberOfProperties ,searchProperties};
