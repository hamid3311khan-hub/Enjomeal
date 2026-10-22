const mongoose = require("mongoose");
const GroceryCart = require("../models/groceryCartModel");
const GroceryProduct = require("../models/groceryProductModel");

const MAX_QUANTITY = 100;

const sendError = (res, error, context) => {
  console.error(context, error);
  if (error && error.name === "ValidationError") {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
  return res.status(500).json({
    success: false,
    message: "Grocery cart operation failed",
  });
};

const getProduct = async (productId) => {
  if (!mongoose.isValidObjectId(productId)) return null;
  return GroceryProduct.findOne({
    _id: productId,
    isActive: true,
    isAvailable: true,
    stockQuantity: { $gt: 0 },
  });
};

const populateCart = async (cart) => {
  await cart.populate({
    path: "items.product",
    populate: { path: "category", select: "name image type" },
  });
  return cart;
};

// ADD PRODUCT TO GROCERY CART
exports.addGroceryToCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId, quantity = 1 } = req.body || {};

    if (!mongoose.isValidObjectId(productId)) {
      return res.status(400).json({
        success: false,
        message: "A valid productId is required",
      });
    }

    if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QUANTITY) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be a whole number between 1 and 100",
      });
    }

    const product = await getProduct(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Grocery product is unavailable or out of stock",
      });
    }

    let cart = await GroceryCart.findOne({ user: userId });
    if (!cart) {
      try {
        cart = await GroceryCart.create({
          user: userId,
          items: [{ product: product._id, quantity, price: product.price }],
        });
      } catch (error) {
        if (error.code !== 11000) throw error;
        cart = await GroceryCart.findOne({ user: userId });
      }
    }

    const existing = cart.items.find(
      (item) => item.product.toString() === product._id.toString()
    );
    const nextQuantity = (existing ? existing.quantity : 0) + quantity;

    if (nextQuantity > MAX_QUANTITY) {
      return res.status(400).json({
        success: false,
        message: "Maximum quantity per product is 100",
      });
    }

    if (nextQuantity > product.stockQuantity) {
      return res.status(409).json({
        success: false,
        message: `Only ${product.stockQuantity} unit(s) are currently in stock`,
      });
    }

    if (existing) {
      existing.quantity = nextQuantity;
      existing.price = product.price;
    } else {
      if (cart.items.length >= 100) {
        return res.status(400).json({
          success: false,
          message: "Grocery cart cannot contain more than 100 different products",
        });
      }
      cart.items.push({
        product: product._id,
        quantity,
        price: product.price,
      });
    }

    await cart.save();
    await populateCart(cart);

    return res.status(200).json({
      success: true,
      message: "Grocery product added to cart",
      cart,
    });
  } catch (error) {
    return sendError(res, error, "Add grocery cart error:");
  }
};

// GET CUSTOMER GROCERY CART
exports.getGroceryCart = async (req, res) => {
  try {
    let cart = await GroceryCart.findOne({ user: req.user.id });
    if (!cart) {
      return res.status(200).json({
        success: true,
        cart: { items: [], totalAmount: 0 },
      });
    }

    await populateCart(cart);
    return res.status(200).json({ success: true, cart });
  } catch (error) {
    return sendError(res, error, "Get grocery cart error:");
  }
};

// UPDATE QUANTITY (0 REMOVES ITEM)
exports.updateGroceryCartItem = async (req, res) => {
  try {
    const { productId } = req.params;
    const { quantity } = req.body || {};

    if (!mongoose.isValidObjectId(productId)) {
      return res.status(400).json({ success: false, message: "Invalid product ID" });
    }

    if (!Number.isInteger(quantity) || quantity < 0 || quantity > MAX_QUANTITY) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be a whole number between 0 and 100",
      });
    }

    const cart = await GroceryCart.findOne({ user: req.user.id });
    if (!cart) {
      return res.status(404).json({ success: false, message: "Grocery cart not found" });
    }

    const index = cart.items.findIndex(
      (item) => item.product.toString() === productId
    );
    if (index === -1) {
      return res.status(404).json({ success: false, message: "Product is not in your cart" });
    }

    if (quantity === 0) {
      cart.items.splice(index, 1);
    } else {
      const product = await getProduct(productId);
      if (!product) {
        return res.status(409).json({
          success: false,
          message: "Product is unavailable or out of stock; remove it from your cart",
        });
      }
      if (quantity > product.stockQuantity) {
        return res.status(409).json({
          success: false,
          message: `Only ${product.stockQuantity} unit(s) are currently in stock`,
        });
      }
      cart.items[index].quantity = quantity;
      cart.items[index].price = product.price;
    }

    await cart.save();
    await populateCart(cart);
    return res.status(200).json({
      success: true,
      message: quantity === 0 ? "Product removed from grocery cart" : "Grocery cart quantity updated",
      cart,
    });
  } catch (error) {
    return sendError(res, error, "Update grocery cart error:");
  }
};

// REMOVE PRODUCT
exports.removeGroceryCartItem = async (req, res) => {
  try {
    const { productId } = req.params;
    if (!mongoose.isValidObjectId(productId)) {
      return res.status(400).json({ success: false, message: "Invalid product ID" });
    }

    const cart = await GroceryCart.findOne({ user: req.user.id });
    if (!cart) {
      return res.status(404).json({ success: false, message: "Grocery cart not found" });
    }

    const previousLength = cart.items.length;
    cart.items = cart.items.filter(
      (item) => item.product.toString() !== productId
    );

    if (cart.items.length === previousLength) {
      return res.status(404).json({ success: false, message: "Product is not in your cart" });
    }

    await cart.save();
    await populateCart(cart);
    return res.status(200).json({
      success: true,
      message: "Product removed from grocery cart",
      cart,
    });
  } catch (error) {
    return sendError(res, error, "Remove grocery cart item error:");
  }
};

// CLEAR GROCERY CART ONLY
exports.clearGroceryCart = async (req, res) => {
  try {
    const cart = await GroceryCart.findOne({ user: req.user.id });
    if (!cart) {
      return res.status(200).json({
        success: true,
        message: "Grocery cart is already empty",
        cart: { items: [], totalAmount: 0 },
      });
    }

    cart.items = [];
    await cart.save();
    return res.status(200).json({
      success: true,
      message: "Grocery cart cleared",
      cart,
    });
  } catch (error) {
    return sendError(res, error, "Clear grocery cart error:");
  }
};
