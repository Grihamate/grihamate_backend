// routes/properties.routes.js
const express = require("express");
const propertiesController = require("../controllers/properties.controller");

const router = express.Router();

router.post("/add", propertiesController.upload.array("images", 10), propertiesController.addProperty);

module.exports = router;
