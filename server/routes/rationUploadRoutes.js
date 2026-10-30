const express = require("express");
const authMiddleware = require("../middleware/auth.middleware");
const roleMiddleware = require("../middleware/role.middleware");
const upload = require("../middleware/upload");
const {
  uploadRationItemImage,
} = require("../controllers/rationUploadController");

const router = express.Router();

router.post(
  "/ration-item-image",
  authMiddleware,
  roleMiddleware("customer"),
  upload.single("image"),
  uploadRationItemImage
);

module.exports = router;
