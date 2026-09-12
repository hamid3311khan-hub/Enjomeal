const express = require("express");

const {
  uploadFoodImageController,
} = require("../controllers/uploadController");

const authMiddleware = require("../middleware/auth.middleware");
const roleMiddleware = require("../middleware/role.middleware");
const upload = require("../middleware/upload");

const router = express.Router();

// Upload Food Image
router.post(
  "/food-image",
  authMiddleware,
  roleMiddleware("restaurant", "admin"),
  upload.single("image"),
  uploadFoodImageController
);

module.exports = router;
