// routes/properties.routes.js
const express = require("express");
const saleController = require("../controllers/sale.controller");
const authMiddleware=require("../middleware/auth.middleware")
const router = express.Router();


router.post("/add",authMiddleware, saleController.upload.array("images", 10), saleController.addSaleProperty);
router.get("/all", saleController.getAllSaleProperties);
router.get("/get_number", saleController.getPropertyOwnerNumber);
router.get("/search",authMiddleware , saleController.searchSaleProperties);
router.get("/:id",authMiddleware, saleController.getSalePropertyById);


module.exports = router;