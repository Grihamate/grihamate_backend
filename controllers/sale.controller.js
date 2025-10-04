const SellPropertyModel = require("../model/sale.model");
const multer = require("multer");
const { uploadFile } = require("../services/imageStorage.service");
const UserModel = require("../model/user.model");


const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 100 * 1024 * 1024 } });


// add sale property
const addSaleProperty = async (req, res) => {
  try {
    const {
      // Core property info
      propertyType,
      listingType,

      // Basic Details
      title,
      area,
      carpetArea,
      bhkType,
      bathrooms,
      furnishingStatus,
      propertyFacing,
      propertyAge,
      floor,
      transactionType,
      price,
      priceUnit,
      maintenanceCharges,
      reraId,
      propertyStatus,
      garages,

      // Location
      state,
      city,
      locality,
      landmark,
      fullAddress,
      pincode,

      // Extra
      description,

      // Contact Info
      advisor,
      owner,
      phone,
      email,

      // Nearby
      educationName,
      educationDistance,
      healthName,
      healthDistance,
      foodName,
      foodDistance,
      travelName,
      travelDistance,

      // Floor plan
      diningArea,
      bedroomArea,
      bathroomArea,

      // Images (optional from body)
      images,
    } = req.body;

    // ✅ Handle amenities
    let amenities = [];
    if (req.body.amenities) {
      if (Array.isArray(req.body.amenities)) {
        amenities = req.body.amenities;
      } else {
        amenities = [req.body.amenities];
      }
    }

    // ✅ Handle images
    let imageObjects = [];

    // 1️⃣ Multer uploaded images
    if (req.files?.images && req.files.images.length > 0) {
      const uploadResults = await Promise.all(
        req.files.images.map((file) => uploadFile(file))
      );
      imageObjects = uploadResults.map((r) => ({
        url: r.url,
        fileId: r.fileId,
        name: r.name,
      }));
    }

    // 2️⃣ Images passed in body
    if (images) {
      let parsedImages = [];

      if (Array.isArray(images)) {
        parsedImages = images;
      } else if (typeof images === "object") {
        parsedImages = Object.values(images);
      } else if (typeof images === "string") {
        parsedImages = [images];
      }

      const uploadResults = await Promise.all(
        parsedImages.map(async (img) => {
          if (typeof img === "string" && img.startsWith("http")) {
            return { url: img, fileId: null, name: "external-url" };
          }
          return await uploadFile(img);
        })
      );

      imageObjects.push(
        ...uploadResults.map((r) => ({
          url: r.url,
          fileId: r.fileId,
          name: r.name,
        }))
      );
    }

    // ✅ Handle virtual tour
    let virtualTourUrl = null;
    if (req.files?.virtualTour && req.files.virtualTour.length > 0) {
      const uploadedVideo = await uploadFile(req.files.virtualTour[0]);
      virtualTourUrl = uploadedVideo.url;
    }

    // ✅ What's Nearby
    const whatsNearby = {
      education:
        educationName && educationDistance
          ? [{ name: educationName, distance: parseFloat(educationDistance) }]
          : [],
      health:
        healthName && healthDistance
          ? [{ name: healthName, distance: parseFloat(healthDistance) }]
          : [],
      food:
        foodName && foodDistance
          ? [{ name: foodName, distance: parseFloat(foodDistance) }]
          : [],
      travel:
        travelName && travelDistance
          ? [{ name: travelName, distance: parseFloat(travelDistance) }]
          : [],
    };

    // ✅ Create property doc
    const newProperty = new SellPropertyModel({
      propertyType: propertyType?.trim(),
      listingType: listingType?.trim(),
      basicDetails: {
        title,
        area,
        carpetArea,
        bhkType,
        bathrooms,
        furnishingStatus,
        propertyFacing,
        propertyAge,
        floor,
        transactionType,
        price,
        priceUnit,
        maintenanceCharges,
        reraId,
        amenities,
        propertyStatus,
        garages,
      },
      location: {
        state,
        city,
        locality,
        landmark,
        fullAddress,
        pincode,
      },
      description,
      images: imageObjects,
      virtualTour: virtualTourUrl,
      floorPlan: {
        diningArea: diningArea ? Number(diningArea) : undefined,
        bedroomArea: bedroomArea ? Number(bedroomArea) : undefined,
        bathroomArea: bathroomArea ? Number(bathroomArea) : undefined,
      },
      whatsNearby,
      contactInfo: {
        advisor,
        owner,
        phone,
        email,
      },
    });

    // ✅ Save to DB
    const savedProperty = await newProperty.save();

    // ✅ Add to user’s list
    const userId = req.user?._id || req.userId;
    if (!userId) {
      return res
        .status(400)
        .json({ success: false, message: "User ID missing" });
    }

    await UserModel.findByIdAndUpdate(
      userId,
      { $addToSet: { my_sell_properties: savedProperty._id } },
      { new: true }
    );

    res.status(201).json({
      success: true,
      message: "Sale property added successfully",
      property: savedProperty,
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
      minArea,
      maxArea,
      listingType,
      bhkType,
      amenities,
      propertyStatus,
      propertyFacing,
      propertyAge
    } = req.query;

    let query = {};

    // Basic filters
    if (propertyType) query.propertyType = propertyType;
    if (listingType) query.listingType = listingType;
    if (bhkType) query["basicDetails.bhkType"] = bhkType;
    if (city) query["location.city"] = { $regex: city, $options: "i" };
    if (locality) query["location.locality"] = { $regex: locality, $options: "i" };

    // Price range
    if (minPrice || maxPrice) {
      query["basicDetails.price"] = {};
      if (minPrice) query["basicDetails.price"].$gte = parseInt(minPrice);
      if (maxPrice) query["basicDetails.price"].$lte = parseInt(maxPrice);
    }

    // Area / Size filter
    if (minArea || maxArea) {
      query["basicDetails.area"] = {};
      if (minArea) query["basicDetails.area"].$gte = parseInt(minArea);
      if (maxArea) query["basicDetails.area"].$lte = parseInt(maxArea);
    }

    // Amenities (expecting comma-separated list)
   if (amenities) {
  const amenityList = amenities.split(",");
  query["basicDetails.amenities"] = { $all: amenityList };
}

    // Property Status
    if (propertyStatus) {
  query["basicDetails.propertyStatus"] = propertyStatus;
}

    // Facing
     if (propertyFacing) {
      query["basicDetails.propertyFacing"] = propertyFacing;
    }

    // Age of Property
   if (propertyAge) {
      query["basicDetails.propertyAge"] = propertyAge;
    }

    console.log("🔍 Final Query:", query);

    const properties = await SellPropertyModel.find(query);

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


// get sale property by id
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


// get sale properties by ids(multiple)
const getSalePropertiesByIds = async (req, res) => {
  try {
    const { ids } = req.body; // expecting array of sale property IDs

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide an array of sale property IDs",
      });
    }

    const saleProperties = await SellPropertyModel.find({
      _id: { $in: ids },
    });

    if (!saleProperties || saleProperties.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No Sale Properties found for the given IDs",
      });
    }

    res.status(200).json({
      success: true,
      count: saleProperties.length,
      saleProperties,
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


module.exports = { upload, addSaleProperty,getAllSaleProperties,getSalePropertyById,getSalePropertiesByIds,getPropertyOwnerNumber,searchSaleProperties };









// const addSaleProperty = async (req, res) => {
//   try {
//     const {
//       // Core property info
//       propertyType,
//       listingType,

//       // Basic Details
//       title,
//       area,
//       carpetArea,
//       bhkType,
//       bathrooms,
//       furnishingStatus,
//       propertyFacing,
//       propertyAge,
//       floor,
//       transactionType,
//       price,
//       priceUnit,
//       maintenanceCharges,
//       reraId,
//       propertyStatus, // ✅ NEW FIELD

//       // Location
//       state,
//       city,
//       locality,
//       landmark,
//       fullAddress,
//       pincode,

//       // Extra
//       description,

//       // Contact Info
//       advisor,
//       owner,
//       phone,
//       email,

//       // Nearby
//       educationName,
//       educationDistance,
//       healthName,
//       healthDistance,
//       foodName,
//       foodDistance,
//       travelName,
//       travelDistance,

//       // Floor plan
//       diningArea,
//       bedroomArea,
//       bathroomArea,
//     } = req.body;

//     // ✅ Handle amenities array
//     let amenities = [];
//     if (req.body.amenities) {
//       if (Array.isArray(req.body.amenities)) {
//         amenities = req.body.amenities;
//       } else {
//         amenities = [req.body.amenities];
//       }
//     }

//     // ✅ Handle images and virtual tour
//     let imageObjects = [];
//     let virtualTourUrl = null;

//     // Upload images 
//     if (req.files?.images && req.files.images.length > 0) {
//       const uploadResults = await Promise.all(
//         req.files.images.map((file) => uploadFile(file))
//       );
//       imageObjects = uploadResults.map((r) => ({
//         url: r.url,
//         fileId: r.fileId,
//         name: r.name,
//       }));
//     }

//     // Upload virtual tour video (single)
//     if (req.files?.virtualTour && req.files.virtualTour.length > 0) {
//       const uploadedVideo = await uploadFile(req.files.virtualTour[0]);
//       virtualTourUrl = uploadedVideo.url;
//     }

//     // ✅ Build "What's Nearby" object
//     const whatsNearby = {
//       education:
//         educationName && educationDistance
//           ? [{ name: educationName, distance: parseFloat(educationDistance) }]
//           : [],
//       health:
//         healthName && healthDistance
//           ? [{ name: healthName, distance: parseFloat(healthDistance) }]
//           : [],
//       food:
//         foodName && foodDistance
//           ? [{ name: foodName, distance: parseFloat(foodDistance) }]
//           : [],
//       travel:
//         travelName && travelDistance
//           ? [{ name: travelName, distance: parseFloat(travelDistance) }]
//           : [],
//     };

//     // ✅ Create property document
//     const newProperty = new SellPropertyModel({
//       propertyType: propertyType?.trim(),
//       listingType: listingType?.trim(),
//       basicDetails: {
//         title,
//         area,
//         carpetArea,
//         bhkType,
//         bathrooms,
//         furnishingStatus,
//         propertyFacing,
//         propertyAge,
//         floor,
//         transactionType,
//         price,
//         priceUnit,
//         maintenanceCharges,
//         reraId,
//         amenities,
//         propertyStatus, // ✅ INCLUDED HERE
//       },
//       location: {
//         state,
//         city,
//         locality,
//         landmark,
//         fullAddress,
//         pincode,
//       },
//       description,
//       images: imageObjects,
//       virtualTour: virtualTourUrl,
//       floorPlan: {
//         diningArea: diningArea ? Number(diningArea) : undefined,
//         bedroomArea: bedroomArea ? Number(bedroomArea) : undefined,
//         bathroomArea: bathroomArea ? Number(bathroomArea) : undefined,
//       },
//       whatsNearby,
//       contactInfo: {
//         advisor,
//         owner,
//         phone,
//         email,
//       },
//     });

//     // ✅ Save to DB
//     const savedProperty = await newProperty.save();

//     // ✅ Add to user's property list
//     const userId = req.user?._id || req.userId;
//     if (!userId) {
//       return res.status(400).json({ success: false, message: "User ID missing" });
//     }

//     await UserModel.findByIdAndUpdate(
//       userId,
//       { $addToSet: { my_sell_properties: savedProperty._id } },
//       { new: true }
//     );

//     // ✅ Success response
//     res.status(201).json({
//       success: true,
//       message: "Sale property added successfully",
//       property: savedProperty,
//     });
//   } catch (error) {
//     console.error("Error adding sale property:", error);
//     res.status(500).json({ success: false, message: error.message });
//   }
// };
