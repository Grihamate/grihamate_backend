// routes/properties.routes.js
const express = require("express");
const saleController = require("../controllers/sale.controller");
const authMiddleware=require("../middleware/auth.middleware")
const router = express.Router();


// router.post(
//   "/add",
//   authMiddleware, saleController.upload.array("images", 10),
//   saleController.addSaleProperty
// );
router.post(
  "/add",
  authMiddleware,
  saleController.upload.fields([
    { name: "images", maxCount: 10 },
    { name: "virtualTour", maxCount: 1 }
  ]),
  saleController.addSaleProperty
);
router.get("/all", saleController.getAllSaleProperties);
router.get("/get_number",authMiddleware, saleController.getPropertyOwnerNumber);
router.get("/search",authMiddleware , saleController.searchSaleProperties);
router.get("/:id",authMiddleware, saleController.getSalePropertyById);
router.post("/getbyids", authMiddleware, saleController.getSalePropertiesByIds);

module.exports = router;