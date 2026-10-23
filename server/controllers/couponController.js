const mongoose = require("mongoose");

const roundMoney = (value) =>
  Math.round((Number(value) + Number.EPSILON) * 100) / 100;

const Coupon = require("../models/couponModel");
const CouponUsage = require("../models/couponUsageModel");

const validateCouponNumericFields = ({
  minimumOrderAmount,
  maximumDiscount,
  usageLimit,
  expiryDate,
  isActive,
}) => {
  const parseNonNegative = (value, fieldName, defaultValue) => {
    if (value === undefined || value === null || value === "") {
      return { valid: true, value: defaultValue };
    }
    const number = Number(value);
    if (!Number.isFinite(number) || number < 0) {
      return { valid: false, message: fieldName + " must be a non-negative number" };
    }
    return { valid: true, value: number };
  };

  const minimum = parseNonNegative(minimumOrderAmount, "Minimum order amount", 0);
  if (!minimum.valid) return minimum;

  const maximum = parseNonNegative(maximumDiscount, "Maximum discount", null);
  if (!maximum.valid) return maximum;

  let limit = null;
  if (usageLimit !== undefined && usageLimit !== null && usageLimit !== "") {
    limit = Number(usageLimit);
    if (!Number.isInteger(limit) || limit < 1) {
      return { valid: false, message: "Usage limit must be a positive whole number, or left blank for unlimited usage" };
    }
  }

  if (expiryDate !== undefined) {
    const date = new Date(expiryDate);
    if (!expiryDate || !Number.isFinite(date.getTime())) {
      return { valid: false, message: "A valid expiry date is required" };
    }

    // Reject impossible calendar dates such as 2027-02-31.
    if (typeof expiryDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(expiryDate)) {
      const [year, month, day] = expiryDate.split("-").map(Number);
      const parsed = new Date(Date.UTC(year, month - 1, day));

      if (
        parsed.getUTCFullYear() !== year ||
        parsed.getUTCMonth() !== month - 1 ||
        parsed.getUTCDate() !== day
      ) {
        return { valid: false, message: "A valid expiry date is required" };
      }
    }
  }

  if (isActive !== undefined && typeof isActive !== "boolean") {
    return { valid: false, message: "isActive must be true or false" };
  }

  return {
    valid: true,
    minimumOrderAmount: minimum.value,
    maximumDiscount: maximum.value,
    usageLimit: limit,
  };
};

// ===============================
// CREATE COUPON
// ADMIN ONLY
// ===============================
const createCouponController = async (req, res) => {
  try {
    const {
      code,
      description,
      discountType,
      discountValue,
      minimumOrderAmount,
      maximumDiscount,
      expiryDate,
      usageLimit,
      isActive,
      scope = "BOTH",
      restaurantIds = [],
      foodIds = [],
      groceryProductIds = [],
    } = req.body || {};

    if (!code || !discountType || discountValue === undefined || !expiryDate) {
      return res.status(400).json({
        success: false,
        message: "Code, discount type, discount value and expiry date are required",
      });
    }

    if (!["PERCENTAGE", "FIXED"].includes(discountType)) {
      return res.status(400).json({ success: false, message: "Invalid discount type" });
    }

    const numericDiscount = Number(discountValue);
    if (!Number.isFinite(numericDiscount) || numericDiscount <= 0) {
      return res.status(400).json({ success: false, message: "Discount value must be greater than 0" });
    }

    if (discountType === "PERCENTAGE" && numericDiscount > 100) {
      return res.status(400).json({ success: false, message: "Percentage discount cannot exceed 100" });
    }

    const numericFields = validateCouponNumericFields({
      minimumOrderAmount, maximumDiscount, usageLimit, expiryDate, isActive,
    });
    if (!numericFields.valid) {
      return res.status(400).json({ success: false, message: numericFields.message });
    }

    if (!["FOOD", "GROCERY", "BOTH"].includes(scope)) {
      return res.status(400).json({ success: false, message: "Invalid coupon scope" });
    }

    if (![restaurantIds, foodIds, groceryProductIds].every(Array.isArray)) {
      return res.status(400).json({ success: false, message: "Selected item IDs must be arrays" });
    }

    const idArrays = [restaurantIds, foodIds, groceryProductIds];
    if (idArrays.some((ids) => ids.some((id) => !mongoose.isValidObjectId(id)))) {
      return res.status(400).json({ success: false, message: "One or more selected IDs are invalid" });
    }

    const uniqueIds = (ids) => [...new Set(ids.map((id) => String(id)))];

    const selectedRestaurants = uniqueIds(restaurantIds);
    const selectedFoods = uniqueIds(foodIds);
    const selectedGroceries = uniqueIds(groceryProductIds);

    if (scope === "FOOD" && selectedGroceries.length) {
      return res.status(400).json({ success: false, message: "Food coupons cannot include grocery products" });
    }

    if (scope === "GROCERY" && (selectedRestaurants.length || selectedFoods.length)) {
      return res.status(400).json({ success: false, message: "Grocery coupons cannot include restaurants or food items" });
    }

    if (scope === "FOOD" || scope === "BOTH") {
      if (selectedRestaurants.length) {
        const count = await require("../models/restaurant").countDocuments({
          _id: { $in: selectedRestaurants },
          isActive: true,
          approvalStatus: "APPROVED",
        });
        if (count !== selectedRestaurants.length) {
          return res.status(400).json({ success: false, message: "One or more selected restaurants are not approved and active" });
        }
      }

      if (selectedFoods.length) {
        const foods = await require("../models/foodModels").find({
          _id: { $in: selectedFoods },
          isAvailable: true,
        }).select("_id restaurant");

        if (foods.length !== selectedFoods.length) {
          return res.status(400).json({ success: false, message: "One or more selected food items are unavailable or invalid" });
        }

        if (selectedRestaurants.length && foods.some(
          (food) => !selectedRestaurants.includes(String(food.restaurant))
        )) {
          return res.status(400).json({ success: false, message: "Selected food items must belong to the selected restaurants" });
        }
      }
    }

    if ((scope === "GROCERY" || scope === "BOTH") && selectedGroceries.length) {
      const count = await require("../models/groceryProductModel").countDocuments({
        _id: { $in: selectedGroceries },
        isActive: true,
        isAvailable: true,
      });

      if (count !== selectedGroceries.length) {
        return res.status(400).json({ success: false, message: "One or more selected grocery products are unavailable or invalid" });
      }
    }

    const normalizedCode = String(code).trim().toUpperCase();
    const existingCoupon = await Coupon.findOne({ code: normalizedCode });

    if (existingCoupon) {
      return res.status(400).json({ success: false, message: "Coupon code already exists" });
    }

    const coupon = await Coupon.create({
      code: normalizedCode,
      description,
      discountType,
      discountValue: numericDiscount,
      minimumOrderAmount: numericFields.minimumOrderAmount,
      maximumDiscount: numericFields.maximumDiscount,
      expiryDate: new Date(expiryDate),
      usageLimit: numericFields.usageLimit,
      usedCount: 0,
      isActive: isActive !== undefined ? isActive : true,
      scope,
      restaurantIds: selectedRestaurants,
      foodIds: selectedFoods,
      groceryProductIds: selectedGroceries,
    });

    return res.status(201).json({
      success: true,
      message: "Coupon created successfully",
      coupon,
    });
  } catch (error) {
    console.error("Create Coupon API error:", error);
    return res.status(500).json({
      success: false,
      message: "Error in Create Coupon API",
      error: error.message,
    });
  }
};
// ===============================
// GET ALL COUPONS
// ADMIN ONLY
// ===============================
const getAllCouponsController = async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,
      message: "All coupons fetched successfully",
      totalCoupons: coupons.length,
      coupons,
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Error in Get All Coupons API",
      error: error.message,
    });
  }
};

// ===============================
// GET SINGLE COUPON
// ADMIN ONLY
// ===============================
const getSingleCouponController = async (req, res) => {
  try {
    const { couponId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(couponId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid coupon ID",
      });
    }

    const coupon = await Coupon.findById(couponId);

    return res.status(200).json({
      success: true,
      message: "Coupon fetched successfully",
      coupon,
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Error in Get Single Coupon API",
      error: error.message,
    });
  }
};

// ===============================
// UPDATE COUPON
// ADMIN ONLY
// ===============================
const updateCouponController = async (req, res) => {
  try {
    const { couponId } = req.params;

    if (!mongoose.isValidObjectId(couponId)) {
      return res.status(400).json({ success: false, message: "Invalid coupon ID" });
    }

    const coupon = await Coupon.findById(couponId);
    if (!coupon) {
      return res.status(404).json({ success: false, message: "Coupon not found" });
    }

    const body = req.body || {};
    const {
      description, discountType, discountValue, minimumOrderAmount,
      maximumDiscount, expiryDate, usageLimit, isActive,
      scope, restaurantIds, foodIds, groceryProductIds,
    } = body;

    const nextType = discountType !== undefined ? discountType : coupon.discountType;
    const nextValue = discountValue !== undefined ? Number(discountValue) : coupon.discountValue;

    if (!["PERCENTAGE", "FIXED"].includes(nextType)) {
      return res.status(400).json({ success: false, message: "Invalid discount type" });
    }
    if (!Number.isFinite(nextValue) || nextValue <= 0) {
      return res.status(400).json({ success: false, message: "Discount value must be greater than 0" });
    }
    if (nextType === "PERCENTAGE" && nextValue > 100) {
      return res.status(400).json({ success: false, message: "Percentage discount cannot exceed 100" });
    }

    const numericFields = validateCouponNumericFields({
      minimumOrderAmount: minimumOrderAmount !== undefined ? minimumOrderAmount : coupon.minimumOrderAmount,
      maximumDiscount: maximumDiscount !== undefined ? maximumDiscount : coupon.maximumDiscount,
      usageLimit: usageLimit !== undefined ? usageLimit : coupon.usageLimit,
      expiryDate: expiryDate !== undefined ? expiryDate : coupon.expiryDate,
      isActive: isActive !== undefined ? isActive : coupon.isActive,
    });
    if (!numericFields.valid) {
      return res.status(400).json({ success: false, message: numericFields.message });
    }

    const nextScope = scope !== undefined ? scope : coupon.scope || "BOTH";
    if (!["FOOD", "GROCERY", "BOTH"].includes(nextScope)) {
      return res.status(400).json({ success: false, message: "Invalid coupon scope" });
    }

    const toUniqueIds = (value, fallback) => {
      const arr = value !== undefined ? value : (fallback || []);
      if (!Array.isArray(arr) || arr.some((id) => !mongoose.isValidObjectId(id))) {
        throw new Error("Selected item IDs must be valid arrays of IDs");
      }
      return [...new Set(arr.map(String))];
    };

    let selectedRestaurants, selectedFoods, selectedGroceries;
    try {
      selectedRestaurants = toUniqueIds(restaurantIds, coupon.restaurantIds);
      selectedFoods = toUniqueIds(foodIds, coupon.foodIds);
      selectedGroceries = toUniqueIds(groceryProductIds, coupon.groceryProductIds);
    } catch (validationError) {
      return res.status(400).json({ success: false, message: validationError.message });
    }

    if (nextScope === "FOOD" && selectedGroceries.length) {
      return res.status(400).json({ success: false, message: "Food coupons cannot include grocery products" });
    }
    if (nextScope === "GROCERY" && (selectedRestaurants.length || selectedFoods.length)) {
      return res.status(400).json({ success: false, message: "Grocery coupons cannot include restaurants or food items" });
    }

    if (nextScope === "FOOD" || nextScope === "BOTH") {
      if (selectedRestaurants.length) {
        const Restaurant = require("../models/restaurant");
        const count = await Restaurant.countDocuments({
          _id: { $in: selectedRestaurants }, isActive: true, approvalStatus: "APPROVED",
        });
        if (count !== selectedRestaurants.length) {
          return res.status(400).json({ success: false, message: "One or more selected restaurants are not approved and active" });
        }
      }

      if (selectedFoods.length) {
        const Food = require("../models/foodModels");
        const foods = await Food.find({
          _id: { $in: selectedFoods }, isAvailable: true,
        }).select("_id restaurant");

        if (foods.length !== selectedFoods.length) {
          return res.status(400).json({ success: false, message: "One or more selected food items are unavailable or invalid" });
        }
        if (selectedRestaurants.length && foods.some(
          (food) => !selectedRestaurants.includes(String(food.restaurant))
        )) {
          return res.status(400).json({ success: false, message: "Selected food items must belong to the selected restaurants" });
        }
      }
    }

    if ((nextScope === "GROCERY" || nextScope === "BOTH") && selectedGroceries.length) {
      const GroceryProduct = require("../models/groceryProductModel");
      const count = await GroceryProduct.countDocuments({
        _id: { $in: selectedGroceries }, isActive: true, isAvailable: true,
      });
      if (count !== selectedGroceries.length) {
        return res.status(400).json({ success: false, message: "One or more selected grocery products are unavailable or invalid" });
      }
    }

    if (description !== undefined) coupon.description = description;
    coupon.discountType = nextType;
    coupon.discountValue = nextValue;
    coupon.minimumOrderAmount = numericFields.minimumOrderAmount;
    coupon.maximumDiscount = numericFields.maximumDiscount;
    coupon.expiryDate = new Date(expiryDate !== undefined ? expiryDate : coupon.expiryDate);
    coupon.usageLimit = numericFields.usageLimit;
    if (isActive !== undefined) coupon.isActive = isActive;
    coupon.scope = nextScope;
    coupon.restaurantIds = selectedRestaurants;
    coupon.foodIds = selectedFoods;
    coupon.groceryProductIds = selectedGroceries;

    await coupon.save();

    return res.status(200).json({
      success: true, message: "Coupon updated successfully", coupon,
    });
  } catch (error) {
    console.error("Update Coupon API error:", error);
    return res.status(500).json({
      success: false, message: "Error in Update Coupon API", error: error.message,
    });
  }
};
// ===============================
// DELETE COUPON
// ADMIN ONLY
// ===============================
const deleteCouponController = async (req, res) => {
  try {
    const { couponId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(couponId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid coupon ID",
      });
    }

    const coupon = await Coupon.findById(couponId);

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Coupon not found",
      });
    }

    await Coupon.findByIdAndDelete(couponId);

    return res.status(200).json({
      success: true,
      message: "Coupon deleted successfully",
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Error in Delete Coupon API",
      error: error.message,
    });
  }
};

// ===============================
// VALIDATE / APPLY COUPON
// CUSTOMER ONLY
// ===============================
const applyCouponController = async (req, res) => {
  try {
    const { code, service = "FOOD", restaurant: requestedRestaurant } = req.body || {};
    const userId = req.user.id;
    const normalizedService = String(service).toUpperCase();

    if (!code || !["FOOD", "GROCERY"].includes(normalizedService)) {
      return res.status(400).json({
        success: false,
        message: "Coupon code and valid service (FOOD or GROCERY) are required",
      });
    }

    const coupon = await Coupon.findOne({
      code: String(code).trim().toUpperCase(),
    });

    if (!coupon) {
      return res.status(404).json({ success: false, message: "Invalid coupon code" });
    }

    if (!coupon.isActive) {
      return res.status(400).json({ success: false, message: "Coupon is inactive" });
    }

    if (new Date(coupon.expiryDate) < new Date()) {
      return res.status(400).json({ success: false, message: "Coupon has expired" });
    }

    if (
      coupon.usageLimit !== null &&
      coupon.usageLimit !== undefined &&
      coupon.usedCount >= coupon.usageLimit
    ) {
      return res.status(400).json({ success: false, message: "Coupon usage limit reached" });
    }

    if (
      (normalizedService === "FOOD" && coupon.scope === "GROCERY") ||
      (normalizedService === "GROCERY" && coupon.scope === "FOOD")
    ) {
      return res.status(400).json({
        success: false,
        message: "This coupon is not valid for this service",
      });
    }

    const hasFoodRestrictions =
      (Array.isArray(coupon.restaurantIds) && coupon.restaurantIds.length > 0) ||
      (Array.isArray(coupon.foodIds) && coupon.foodIds.length > 0);
    const hasGroceryRestrictions =
      Array.isArray(coupon.groceryProductIds) &&
      coupon.groceryProductIds.length > 0;

    if (
      coupon.scope === "BOTH" &&
      normalizedService === "FOOD" &&
      !hasFoodRestrictions &&
      hasGroceryRestrictions
    ) {
      return res.status(400).json({
        success: false,
        message: "This coupon is restricted to selected grocery products",
      });
    }

    if (
      coupon.scope === "BOTH" &&
      normalizedService === "GROCERY" &&
      hasFoodRestrictions &&
      !hasGroceryRestrictions
    ) {
      return res.status(400).json({
        success: false,
        message: "This coupon is restricted to selected food items or restaurants",
      });
    }

    const existingUsage = await CouponUsage.findOne({
      user: userId,
      coupon: coupon._id,
    });

    if (existingUsage) {
      return res.status(400).json({
        success: false,
        message: "You have already used this coupon",
      });
    }

    let cartItems = [];
    let restaurantId = null;
    let subtotal = 0;
    let eligibleSubtotal = 0;

    if (normalizedService === "FOOD") {
      const Cart = require("../models/cartModel");
      const Food = require("../models/foodModels");
      const cart = await Cart.findOne({ user: userId }).lean();

      if (!cart || !Array.isArray(cart.items) || cart.items.length === 0) {
        return res.status(400).json({ success: false, message: "Your food cart is empty" });
      }

      restaurantId = String(cart.restaurant || "");
      if (!restaurantId || !mongoose.isValidObjectId(restaurantId)) {
        return res.status(400).json({ success: false, message: "Please select a valid restaurant cart" });
      }

      if (
        requestedRestaurant &&
        String(requestedRestaurant) !== restaurantId
      ) {
        return res.status(400).json({ success: false, message: "Restaurant does not match your current cart" });
      }

      if (
        Array.isArray(coupon.restaurantIds) &&
        coupon.restaurantIds.length > 0 &&
        !coupon.restaurantIds.some((id) => String(id) === restaurantId)
      ) {
        return res.status(400).json({ success: false, message: "This coupon is not valid for this restaurant" });
      }

      for (const item of cart.items) {
        const foodId = String(item.food || "");
        if (!mongoose.isValidObjectId(foodId)) {
          return res.status(400).json({ success: false, message: "Your cart contains an invalid food item" });
        }

        const food = await Food.findById(foodId).select("_id price restaurant isAvailable").lean();
        if (!food || !food.isAvailable || String(food.restaurant) !== restaurantId) {
          return res.status(400).json({ success: false, message: "A cart item is unavailable. Please refresh your cart" });
        }

        const quantity = Number(item.quantity);
        if (!Number.isInteger(quantity) || quantity < 1) {
          return res.status(400).json({ success: false, message: "Your cart contains an invalid quantity" });
        }

        const lineTotal = roundMoney(Number(food.price) * quantity);
        subtotal = roundMoney(subtotal + lineTotal);

        const restaurantEligible =
          !coupon.restaurantIds?.length ||
          coupon.restaurantIds.some((id) => String(id) === restaurantId);
        const foodEligible =
          !coupon.foodIds?.length ||
          coupon.foodIds.some((id) => String(id) === foodId);

        if (restaurantEligible && foodEligible) {
          eligibleSubtotal = roundMoney(eligibleSubtotal + lineTotal);
        }
      }
    } else {
      const GroceryCart = require("../models/groceryCartModel");
      const GroceryProduct = require("../models/groceryProductModel");
      const cart = await GroceryCart.findOne({ user: userId }).lean();

      if (!cart || !Array.isArray(cart.items) || cart.items.length === 0) {
        return res.status(400).json({ success: false, message: "Your grocery cart is empty" });
      }

      for (const item of cart.items) {
        const productId = String(item.product || "");
        if (!mongoose.isValidObjectId(productId)) {
          return res.status(400).json({ success: false, message: "Your cart contains an invalid grocery product" });
        }

        const product = await GroceryProduct.findById(productId)
          .select("_id price isActive isAvailable")
          .lean();

        if (!product || !product.isActive || !product.isAvailable) {
          return res.status(400).json({ success: false, message: "A grocery product is unavailable. Please refresh your cart" });
        }

        const quantity = Number(item.quantity);
        if (!Number.isInteger(quantity) || quantity < 1) {
          return res.status(400).json({ success: false, message: "Your cart contains an invalid quantity" });
        }

        const lineTotal = roundMoney(Number(product.price) * quantity);
        subtotal = roundMoney(subtotal + lineTotal);

        const productEligible =
          !coupon.groceryProductIds?.length ||
          coupon.groceryProductIds.some((id) => String(id) === productId);

        if (productEligible) {
          eligibleSubtotal = roundMoney(eligibleSubtotal + lineTotal);
        }
      }
    }

    if (eligibleSubtotal <= 0) {
      return res.status(400).json({
        success: false,
        message: "No items in your cart are eligible for this coupon",
      });
    }

    if (eligibleSubtotal < Number(coupon.minimumOrderAmount || 0)) {
      return res.status(400).json({
        success: false,
        message: `Eligible items must total at least ₹${coupon.minimumOrderAmount}`,
      });
    }

    let discountAmount =
      coupon.discountType === "PERCENTAGE"
        ? (eligibleSubtotal * coupon.discountValue) / 100
        : coupon.discountValue;

    if (coupon.maximumDiscount != null) {
      discountAmount = Math.min(discountAmount, coupon.maximumDiscount);
    }

    discountAmount = roundMoney(
      Math.max(0, Math.min(discountAmount, eligibleSubtotal))
    );

    return res.status(200).json({
      success: true,
      message: "Coupon applied successfully",
      coupon: {
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        scope: coupon.scope || "BOTH",
      },
      service: normalizedService,
      subtotal: roundMoney(subtotal),
      eligibleSubtotal: roundMoney(eligibleSubtotal),
      discountAmount,
      finalAmount: roundMoney(Math.max(0, subtotal - discountAmount)),
    });
  } catch (error) {
    console.error("Apply coupon error:", error);
    return res.status(500).json({
      success: false,
      message: "Error in Apply Coupon API",
      error: error.message,
    });
  }
};

// =====================================
// GET ACTIVE COUPONS
// CUSTOMER ONLY
// =====================================

const getActiveCouponsController = async (req, res) => {
  try {
    const coupons = await Coupon.find({
      isActive: true,
      expiryDate: {
        $gte: new Date(),
      },
    })
      .select(
        "code description discountType discountValue minimumOrderAmount maximumDiscount expiryDate"
      )
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: "Active coupons fetched successfully",
      count: coupons.length,
      coupons,
    });
  } catch (error) {
    console.log("Get Active Coupons Error:", error);

    return res.status(500).json({
      success: false,
      message: "Error in Get Active Coupons API",
      error: error.message,
    });
  }
};

// ==================================
// GET AVAILABLE COUPONS
// CUSTOMER ONLY
// ==================================

const getAvailableCouponsController = async (req, res) => {
  try {
    const coupons = await Coupon.find({
      isActive: true,
      expiryDate: {
        $gt: new Date(),
      },
    }).sort({
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,
      message: "Available coupons fetched successfully",
      totalCoupons: coupons.length,
      coupons,
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Error in Get Available Coupons API",
      error: error.message,
    });
  }
};

// ==================================
// GET MY COUPON HISTORY
// CUSTOMER ONLY
// ==================================

const getMyCouponHistoryController = async (req, res) => {
  try {
    const userId = req.user.id;

    const history = await CouponUsage.find({
      user: userId,
    })
      .populate({
        path: "coupon",
        select:
          "code description discountType discountValue",
      })
      .populate({
        path: "order",
      })
      .sort({
        createdAt: -1,
      });

    return res.status(200).json({
      success: true,
      message: "Coupon history fetched successfully",
      count: history.length,
      history,
    });
  } catch (error) {
    console.log(
      "Get My Coupon History Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Error in Get My Coupon History API",
      error: error.message,
    });
  }
};


// ==================================
// GET ALL COUPON USAGE HISTORY
// ADMIN ONLY
// ==================================

const getAllCouponHistoryController = async (
  req,
  res
) => {
  try {
    const history = await CouponUsage.find()
      .populate({
        path: "user",
        select: "name email phone",
      })
      .populate({
        path: "coupon",
        select:
          "code description discountType discountValue",
      })
      .populate({
        path: "order",
      })
      .sort({
        createdAt: -1,
      });

    return res.status(200).json({
      success: true,
      message:
        "All coupon history fetched successfully",
      count: history.length,
      history,
    });
  } catch (error) {
    console.log(
      "Get All Coupon History Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Error in Get All Coupon History API",
      error: error.message,
    });
  }
};


// ===============================
// EXPORT
// ===============================
module.exports = {
  createCouponController,
  getAllCouponsController,
  getSingleCouponController,
  updateCouponController,
  deleteCouponController,
  applyCouponController,
  getActiveCouponsController,
  getAvailableCouponsController,
  getMyCouponHistoryController,
  getAllCouponHistoryController,
};
