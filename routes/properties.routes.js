// routes/properties.routes.js
const express = require("express");
const propertiesController = require("../controllers/properties.controller");

const router = express.Router();

<<<<<<< Updated upstream
router.post("/add", propertiesController.upload.array("images", 10), propertiesController.
addProperty);
router.get("/:id", propertiesController.getProperty);
router.get("/all", propertiesController.getAllProperties);
=======
router.post("/add", propertiesController.upload.array("images", 10), propertiesController.addProperty);
router.get("/get_number", propertiesController.getNumberOfProperties);

>>>>>>> Stashed changes

module.exports = router;
