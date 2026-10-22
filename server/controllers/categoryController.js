const mongoose = require("mongoose");
const Category = require("../models/categoryModel");

const VALID_TYPES = ["FOOD", "RESTAURANT", "GROCERY"];

// GET ACTIVE CATEGORIES (PUBLIC)
exports.getCategories = async (req, res) => {
  try {
    const filter = { isActive: true };

    if (req.query.type) {
      const type = String(req.query.type).toUpperCase();

      if (!VALID_TYPES.includes(type)) {
        return res.status(400).json({
          success: false,
          message: "Type must be FOOD, RESTAURANT or GROCERY",
        });
      }

      filter.type = type;
    }

    const categories = await Category.find(filter)
      .sort({ sortOrder: 1, name: 1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: categories.length,
      categories,
    });
  } catch (error) {
    console.error("Get categories error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch categories",
    });
  }
};

// GET ALL CATEGORIES (ADMIN)
exports.getAllCategoriesAdmin = async (req, res) => {
  try {
    const filter = {};

    if (req.query.type) {
      const type = String(req.query.type).toUpperCase();

      if (!VALID_TYPES.includes(type)) {
        return res.status(400).json({
          success: false,
          message: "Type must be FOOD, RESTAURANT or GROCERY",
        });
      }

      filter.type = type;
    }

    const categories = await Category.find(filter)
      .sort({ type: 1, sortOrder: 1, name: 1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: categories.length,
      categories,
    });
  } catch (error) {
    console.error("Admin get categories error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch admin categories",
    });
  }
};

// CREATE CATEGORY (ADMIN)
exports.createCategory = async (req, res) => {
  try {
    const name = String(req.body.name || "").trim();
    const type = String(req.body.type || "").toUpperCase();
    const description = String(req.body.description || "").trim();
    const image = String(req.body.image || "").trim();
    const sortOrder = Number(req.body.sortOrder ?? 0);

    if (name.length < 2 || name.length > 100) {
      return res.status(400).json({
        success: false,
        message: "Category name must be between 2 and 100 characters",
      });
    }

    if (!VALID_TYPES.includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Type must be FOOD, RESTAURANT or GROCERY",
      });
    }

    if (description.length > 500 || image.length > 2000) {
      return res.status(400).json({
        success: false,
        message: "Description or image URL is too long",
      });
    }

    if (!Number.isFinite(sortOrder) || sortOrder < 0) {
      return res.status(400).json({
        success: false,
        message: "Sort order must be a non-negative number",
      });
    }

    const duplicate = await Category.findOne({ type, name })
      .collation({ locale: "en", strength: 2 });

    if (duplicate) {
      return res.status(409).json({
        success: false,
        message: "This category already exists for the selected type",
      });
    }

    const category = await Category.create({
      name,
      type,
      description,
      image,
      sortOrder,
    });

    return res.status(201).json({
      success: true,
      message: "Category created successfully",
      category,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "This category already exists for the selected type",
      });
    }

    console.error("Create category error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create category",
    });
  }
};

// UPDATE CATEGORY (ADMIN)
exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid category ID",
      });
    }

    const category = await Category.findById(id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    const updates = {};

    if (req.body.name !== undefined) {
      const name = String(req.body.name).trim();

      if (name.length < 2 || name.length > 100) {
        return res.status(400).json({
          success: false,
          message: "Category name must be between 2 and 100 characters",
        });
      }

      const duplicate = await Category.findOne({
        _id: { $ne: id },
        type: req.body.type
          ? String(req.body.type).toUpperCase()
          : category.type,
        name,
      }).collation({ locale: "en", strength: 2 });

      if (duplicate) {
        return res.status(409).json({
          success: false,
          message: "This category already exists for the selected type",
        });
      }

      updates.name = name;
    }

    if (req.body.type !== undefined) {
      const type = String(req.body.type).toUpperCase();

      if (!VALID_TYPES.includes(type)) {
        return res.status(400).json({
          success: false,
          message: "Type must be FOOD, RESTAURANT or GROCERY",
        });
      }

      updates.type = type;
    }

    if (req.body.description !== undefined) {
      updates.description = String(req.body.description).trim();

      if (updates.description.length > 500) {
        return res.status(400).json({
          success: false,
          message: "Description cannot exceed 500 characters",
        });
      }
    }

    if (req.body.image !== undefined) {
      updates.image = String(req.body.image).trim();

      if (updates.image.length > 2000) {
        return res.status(400).json({
          success: false,
          message: "Image URL cannot exceed 2000 characters",
        });
      }
    }

    if (req.body.sortOrder !== undefined) {
      const sortOrder = Number(req.body.sortOrder);

      if (!Number.isFinite(sortOrder) || sortOrder < 0) {
        return res.status(400).json({
          success: false,
          message: "Sort order must be a non-negative number",
        });
      }

      updates.sortOrder = sortOrder;
    }

    if (req.body.isActive !== undefined) {
      if (typeof req.body.isActive !== "boolean") {
        return res.status(400).json({
          success: false,
          message: "isActive must be true or false",
        });
      }

      updates.isActive = req.body.isActive;
    }

    Object.assign(category, updates);
    await category.save();

    return res.status(200).json({
      success: true,
      message: "Category updated successfully",
      category,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "This category already exists for the selected type",
      });
    }

    console.error("Update category error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update category",
    });
  }
};

// DELETE CATEGORY (ADMIN)
exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid category ID",
      });
    }

    const category = await Category.findById(id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    // Avoid deleting categories currently used by existing records.
    if (category.type === "FOOD") {
      const Food = require("../models/foodModels");
      const inUse = await Food.exists({ category: category.name });

      if (inUse) {
        return res.status(409).json({
          success: false,
          message: "This category is used by foods. Deactivate it instead.",
        });
      }
    }

    if (category.type === "RESTAURANT") {
      const Restaurant = require("../models/restaurant");
      const inUse = await Restaurant.exists({ cuisine: category.name });

      if (inUse) {
        return res.status(409).json({
          success: false,
          message: "This category is used by restaurants. Deactivate it instead.",
        });
      }
    }

    if (category.type === "GROCERY") {
      const GroceryProduct = require("../models/groceryProductModel");
      const inUse = await GroceryProduct.exists({ category: category._id });

      if (inUse) {
        return res.status(409).json({
          success: false,
          message: "This category is used by grocery products. Deactivate it instead.",
        });
      }
    }

    await Category.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Category deleted successfully",
    });
  } catch (error) {
    console.error("Delete category error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete category",
    });
  }
};
