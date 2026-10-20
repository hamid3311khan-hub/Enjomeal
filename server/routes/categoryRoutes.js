const express = require("express");
const router = express.Router();

const {
  getCategories,
  getAllCategoriesAdmin,
  createCategory,
  updateCategory,
  deleteCategory,
} = require("../controllers/categoryController");

const authMiddleware = require("../middleware/auth.middleware");
const roleMiddleware = require("../middleware/role.middleware");

// Public: active categories
router.get("/", getCategories);

// Admin: all categories, including inactive
router.get(
  "/admin",
  authMiddleware,
  roleMiddleware("admin"),
  getAllCategoriesAdmin
);

// Admin: create category
router.post(
  "/",
  authMiddleware,
  roleMiddleware("admin"),
  createCategory
);

// Admin: edit category or activate/deactivate it
router.put(
  "/:id",
  authMiddleware,
  roleMiddleware("admin"),
  updateCategory
);

// Admin: delete category (blocked if existing records use it)
router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware("admin"),
  deleteCategory
);

module.exports = router;
