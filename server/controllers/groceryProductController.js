const mongoose = require("mongoose");
const GroceryProduct = require("../models/groceryProductModel");
const Category = require("../models/categoryModel");
const GroceryOrder = require("../models/groceryOrderModel");

const validId = (id) => mongoose.Types.ObjectId.isValid(id);

const publicFilter = () => ({
  isActive: true,
  isAvailable: true,
  stockQuantity: { $gt: 0 },
});

const populateCategory = (query) =>
  query.populate({
    path: "category",
    select: "name description image type",
  });

const sendValidationError = (res, error) => {
  if (error.name === "ValidationError" || error.name === "CastError") {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }

  if (error.code === 11000) {
    return res.status(409).json({
      success: false,
      message: "A conflicting grocery product already exists",
    });
  }

  console.error("Grocery product error:", error);
  return res.status(500).json({
    success: false,
    message: "Grocery product operation failed",
  });
};

// PUBLIC: list available products; optional category and search filters
exports.getGroceryProducts = async (req, res) => {
  try {
    const filter = publicFilter();

    if (req.query.category) {
      if (!validId(req.query.category)) {
        return res.status(400).json({
          success: false,
          message: "Invalid category ID",
        });
      }
      filter.category = req.query.category;
    }

    if (req.query.search) {
      const search = String(req.query.search).trim().slice(0, 100);
      if (search) {
        filter.$or = [
          { name: { $regex: search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" } },
          { description: { $regex: search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" } },
        ];
      }
    }

    const products = await populateCategory(
      GroceryProduct.find(filter).sort({ createdAt: -1 }).limit(200)
    );

    return res.status(200).json({
      success: true,
      count: products.length,
      products,
    });
  } catch (error) {
    return sendValidationError(res, error);
  }
};

// PUBLIC: fetch one available product
exports.getGroceryProductById = async (req, res) => {
  try {
    if (!validId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid grocery product ID",
      });
    }

    const product = await populateCategory(
      GroceryProduct.findOne({
        _id: req.params.id,
        ...publicFilter(),
      })
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Grocery product not found or unavailable",
      });
    }

    return res.status(200).json({ success: true, product });
  } catch (error) {
    return sendValidationError(res, error);
  }
};

// ADMIN: list all products, including inactive and out of stock
exports.getAllGroceryProductsAdmin = async (req, res) => {
  try {
    const filter = {};

    if (req.query.category) {
      if (!validId(req.query.category)) {
        return res.status(400).json({
          success: false,
          message: "Invalid category ID",
        });
      }
      filter.category = req.query.category;
    }

    if (["true", "false"].includes(String(req.query.isActive))) {
      filter.isActive = req.query.isActive === "true";
    }

    const products = await populateCategory(
      GroceryProduct.find(filter).sort({ createdAt: -1 }).limit(1000)
    );

    return res.status(200).json({
      success: true,
      count: products.length,
      products,
    });
  } catch (error) {
    return sendValidationError(res, error);
  }
};

// ADMIN: create product
exports.createGroceryProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      category,
      image,
      price,
      mrp,
      unit,
      stockQuantity,
      isAvailable,
      isActive,
    } = req.body;

    if (
      typeof name !== "string" ||
      name.trim().length < 2 ||
      !category ||
      price === undefined
    ) {
      return res.status(400).json({
        success: false,
        message: "Product name, category and price are required",
      });
    }

    if (!validId(category)) {
      return res.status(400).json({
        success: false,
        message: "Invalid category ID",
      });
    }

    const categoryData = await Category.findOne({
      _id: category,
      type: "GROCERY",
      isActive: true,
    });

    if (!categoryData) {
      return res.status(400).json({
        success: false,
        message: "Select an active GROCERY category",
      });
    }

    const product = await GroceryProduct.create({
      name: name.trim(),
      description,
      category,
      image,
      price,
      mrp: mrp === "" || mrp === undefined ? null : mrp,
      unit,
      stockQuantity,
      isAvailable,
      isActive,
    });

    const result = await populateCategory(
      GroceryProduct.findById(product._id)
    );

    return res.status(201).json({
      success: true,
      message: "Grocery product created successfully",
      product: result,
    });
  } catch (error) {
    return sendValidationError(res, error);
  }
};

// ADMIN: update product fields
exports.updateGroceryProduct = async (req, res) => {
  try {
    const { id } = req.params;

    if (!validId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid grocery product ID",
      });
    }

    const existing = await GroceryProduct.findById(id);

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Grocery product not found",
      });
    }

    const allowedFields = [
      "name",
      "description",
      "category",
      "image",
      "price",
      "mrp",
      "unit",
      "stockQuantity",
      "isAvailable",
      "isActive",
    ];

    const updates = {};

    for (const field of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        updates[field] = req.body[field];
      }
    }

    if (updates.category !== undefined) {
      if (!validId(updates.category)) {
        return res.status(400).json({
          success: false,
          message: "Invalid category ID",
        });
      }

      const categoryData = await Category.findOne({
        _id: updates.category,
        type: "GROCERY",
        isActive: true,
      });

      if (!categoryData) {
        return res.status(400).json({
          success: false,
          message: "Select an active GROCERY category",
        });
      }
    }

    if (updates.name !== undefined) {
      if (typeof updates.name !== "string" || updates.name.trim().length < 2) {
        return res.status(400).json({
          success: false,
          message: "Product name must contain at least 2 characters",
        });
      }
      updates.name = updates.name.trim();
    }

    Object.assign(existing, updates);
    await existing.save();

    const product = await populateCategory(
      GroceryProduct.findById(existing._id)
    );

    return res.status(200).json({
      success: true,
      message: "Grocery product updated successfully",
      product,
    });
  } catch (error) {
    return sendValidationError(res, error);
  }
};

// ADMIN: delete product
exports.deleteGroceryProduct = async (req, res) => {
  try {
    if (!validId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid grocery product ID",
      });
    }

    const product = await GroceryProduct.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Grocery product not found",
      });
    }

    // Keep product records and historical order references intact.
    product.isActive = false;
    product.isAvailable = false;
    await product.save();

    return res.status(200).json({
      success: true,
      deactivated: true,
      message: "Grocery product deactivated successfully; order history preserved",
    });
  } catch (error) {
    return sendValidationError(res, error);
  }
};
