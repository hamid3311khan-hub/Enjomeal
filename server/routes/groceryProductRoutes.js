const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/auth.middleware");
const roleMiddleware = require("../middleware/role.middleware");

const {
  getGroceryProducts,
  getGroceryProductById,
  getAllGroceryProductsAdmin,
  createGroceryProduct,
  updateGroceryProduct,
  deleteGroceryProduct,
} = require("../controllers/groceryProductController");

// PUBLIC: available products
router.get("/", getGroceryProducts);

// ADMIN: all products, including inactive and out of stock
router.get(
  "/admin",
  authMiddleware,
  roleMiddleware("admin"),
  getAllGroceryProductsAdmin
);

// ADMIN: create product
router.post(
  "/",
  authMiddleware,
  roleMiddleware("admin"),
  createGroceryProduct
);

// ADMIN: update product
router.put(
  "/:id",
  authMiddleware,
  roleMiddleware("admin"),
  updateGroceryProduct
);

// ADMIN: delete product
router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware("admin"),
  deleteGroceryProduct
);

// PUBLIC: single available product
router.get("/:id", getGroceryProductById);

module.exports = router;
