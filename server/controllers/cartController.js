const Cart = require("../models/cartModel");
const Food = require("../models/foodModels");

// ===============================
// ADD TO CART
// ===============================
const addToCartController = async (req, res) => {
  try {
    const userId = req.user.id;
    const { food, quantity } = req.body;

    // Validation
    if (!food || !quantity) {
      return res.status(400).json({
        success: false,
        message: "Food and quantity are required",
      });
    }

    if (quantity < 1) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be at least 1",
      });
    }

    // Check Food
    const foodItem = await Food.findById(food);

    if (!foodItem) {
      return res.status(404).json({
        success: false,
        message: "Food not found",
      });
    }

    if (!foodItem.isAvailable) {
      return res.status(400).json({
        success: false,
        message: "Food is currently unavailable",
      });
    }

    // Find existing cart
    let cart = await Cart.findOne({ user: userId });

    // Create new cart
    if (!cart) {
      cart = await Cart.create({
        user: userId,
        restaurant: foodItem.restaurant,
        items: [
          {
            food,
            quantity,
            price: foodItem.price,
          },
        ],
        totalAmount: foodItem.price * quantity,
      });
    } else {
      // Prevent mixing different restaurants
      if (
        cart.restaurant &&
        cart.restaurant.toString() !== foodItem.restaurant.toString()
      ) {
        return res.status(400).json({
          success: false,
          message:
            "You can add food from only one restaurant at a time. Please clear your cart first.",
        });
      }

      // Check if food already exists
      const existingItem = cart.items.find(
        (item) => item.food.toString() === food.toString()
      );

      if (existingItem) {
        existingItem.quantity += quantity;
      } else {
        cart.items.push({
          food,
          quantity,
          price: foodItem.price,
        });
      }

      cart.restaurant = foodItem.restaurant;

      // Recalculate total
      cart.totalAmount = cart.items.reduce(
        (total, item) => total + item.price * item.quantity,
        0
      );

      await cart.save();
    }

    await cart.populate("items.food");
    await cart.populate("restaurant");

    return res.status(200).json({
      success: true,
      message: "Food added to cart successfully",
      cart,
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Error in Add to Cart API",
      error: error.message,
    });
  }
};

// ===============================
// GET MY CART
// ===============================
const getCartController = async (req, res) => {
  try {
    const userId = req.user.id;

    const cart = await Cart.findOne({ user: userId })
      .populate("items.food")
      .populate("restaurant");

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Cart fetched successfully",
      cart,
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Error in Get Cart API",
      error: error.message,
    });
  }
};

// ===============================
// UPDATE CART ITEM
// ===============================
const updateCartItemController = async (req, res) => {
  try {
    const userId = req.user.id;
    const { foodId } = req.params;
    const { quantity } = req.body;

    if (!quantity || quantity < 1) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be at least 1",
      });
    }

    const cart = await Cart.findOne({ user: userId });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      });
    }

    const item = cart.items.find(
      (item) => item.food.toString() === foodId
    );

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Food item not found in cart",
      });
    }

    item.quantity = quantity;

    cart.totalAmount = cart.items.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );

    await cart.save();

    await cart.populate("items.food");
    await cart.populate("restaurant");

    return res.status(200).json({
      success: true,
      message: "Cart item updated successfully",
      cart,
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Error in Update Cart Item API",
      error: error.message,
    });
  }
};

// ===============================
// REMOVE CART ITEM
// ===============================
const removeCartItemController = async (req, res) => {
  try {
    const userId = req.user.id;
    const { foodId } = req.params;

    const cart = await Cart.findOne({ user: userId });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      });
    }

    const itemExists = cart.items.some(
      (item) => item.food.toString() === foodId
    );

    if (!itemExists) {
      return res.status(404).json({
        success: false,
        message: "Food item not found in cart",
      });
    }

    cart.items = cart.items.filter(
      (item) => item.food.toString() !== foodId
    );

    cart.totalAmount = cart.items.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );

    if (cart.items.length === 0) {
      cart.restaurant = null;
    }

    await cart.save();

    await cart.populate("items.food");
    await cart.populate("restaurant");

    return res.status(200).json({
      success: true,
      message: "Food removed from cart successfully",
      cart,
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Error in Remove Cart Item API",
      error: error.message,
    });
  }
};

// ===============================
// CLEAR CART
// ===============================
const clearCartController = async (req, res) => {
  try {
    const userId = req.user.id;

    const cart = await Cart.findOne({ user: userId });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      });
    }

    cart.items = [];
    cart.totalAmount = 0;
    cart.restaurant = null;

    await cart.save();

    return res.status(200).json({
      success: true,
      message: "Cart cleared successfully",
      cart,
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Error in Clear Cart API",
      error: error.message,
    });
  }
};

// ===============================
// EXPORT
// ===============================
module.exports = {
  addToCartController,
  getCartController,
  updateCartItemController,
  removeCartItemController,
  clearCartController,
};