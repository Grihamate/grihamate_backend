// routes/properties.routes.js
const express = require("express");
const propertiesController = require("../controllers/properties.controller");
const authMiddleware=require("../middleware/auth.middleware")
const router = express.Router();

router.get("/all", propertiesController.getAllProperties);
router.post("/add",authMiddleware, propertiesController.upload.array("images", 10), propertiesController.addProperty);
router.get("/get_number", authMiddleware,propertiesController.getNumberOfProperties);
router.get("/search",authMiddleware , propertiesController.searchProperties);
router.get("/:id",authMiddleware ,propertiesController.getPropertyById);
router.put("/update/:id", authMiddleware, propertiesController.upload.array("images", 10),propertiesController.updateProperty);
router.post("/getbyids", authMiddleware,propertiesController.getPropertiesByIds)




module.exports = router;
