const express = require("express");

const {
  addAddressController,
  getMyAddressesController,
  getSingleAddressController,
  updateAddressController,
  deleteAddressController,
  setDefaultAddressController,
} = require("../controllers/addressController");

const authMiddleware = require("../middleware/auth.middleware");
const roleMiddleware = require("../middleware/role.middleware");

const router = express.Router();

// ===============================
// ADD ADDRESS
// CUSTOMER ONLY
// ===============================
router.post(
  "/add",
  authMiddleware,
  roleMiddleware("customer"),
  addAddressController
);

// ===============================
// GET MY ADDRESSES
// CUSTOMER ONLY
// ===============================
router.get(
  "/my",
  authMiddleware,
  roleMiddleware("customer"),
  getMyAddressesController
);

// ===============================
// GET SINGLE ADDRESS
// CUSTOMER ONLY
// ===============================
router.get(
  "/:addressId",
  authMiddleware,
  roleMiddleware("customer"),
  getSingleAddressController
);

// ===============================
// UPDATE ADDRESS
// CUSTOMER ONLY
// ===============================
router.put(
  "/:addressId",
  authMiddleware,
  roleMiddleware("customer"),
  updateAddressController
);

// ===============================
// DELETE ADDRESS
// CUSTOMER ONLY
// ===============================
router.delete(
  "/:addressId",
  authMiddleware,
  roleMiddleware("customer"),
  deleteAddressController
);

// ===============================
// SET DEFAULT ADDRESS
// CUSTOMER ONLY
// ===============================
router.put(
  "/:addressId/default",
  authMiddleware,
  roleMiddleware("customer"),
  setDefaultAddressController
);

module.exports = router;