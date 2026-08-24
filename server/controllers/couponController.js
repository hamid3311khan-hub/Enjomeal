const mongoose = require("mongoose");
const Coupon = require("../models/couponModel");

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
    } = req.body;

    if (
      !code ||
      !discountType ||
      discountValue === undefined ||
      !expiryDate
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Code, discount type, discount value and expiry date are required",
      });
    }

    const normalizedCode = code.trim().toUpperCase();

    if (!["PERCENTAGE", "FIXED"].includes(discountType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid discount type",
      });
    }

    if (discountValue <= 0) {
      return res.status(400).json({
        success: false,
        message: "Discount value must be greater than 0",
      });
    }

    if (discountType === "PERCENTAGE" && discountValue > 100) {
      return res.status(400).json({
        success: false,
        message: "Percentage discount cannot exceed 100",
      });
    }

    const existingCoupon = await Coupon.findOne({
      code: normalizedCode,
    });

    if (existingCoupon) {
      return res.status(400).json({
        success: false,
        message: "Coupon code already exists",
      });
    }

    const coupon = await Coupon.create({
      code: normalizedCode,
      description,
      discountType,
      discountValue,
      minimumOrderAmount: minimumOrderAmount || 0,
      maximumDiscount: maximumDiscount || null,
      expiryDate,
      usageLimit: usageLimit || null,
      usedCount: 0,
      isActive: isActive !== undefined ? isActive : true,
    });

    return res.status(201).json({
      success: true,
      message: "Coupon created successfully",
      coupon,
    });
  } catch (error) {
    console.log(error);

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

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Coupon not found",
      });
    }

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

    const {
      description,
      discountType,
      discountValue,
      minimumOrderAmount,
      maximumDiscount,
      expiryDate,
      usageLimit,
      isActive,
    } = req.body;

    if (discountType !== undefined) {
      if (!["PERCENTAGE", "FIXED"].includes(discountType)) {
        return res.status(400).json({
          success: false,
          message: "Invalid discount type",
        });
      }

      coupon.discountType = discountType;
    }

    if (discountValue !== undefined) {
      if (discountValue <= 0) {
        return res.status(400).json({
          success: false,
          message: "Discount value must be greater than 0",
        });
      }

      if (
        (discountType || coupon.discountType) === "PERCENTAGE" &&
        discountValue > 100
      ) {
        return res.status(400).json({
          success: false,
          message: "Percentage discount cannot exceed 100",
        });
      }

      coupon.discountValue = discountValue;
    }

    if (description !== undefined) {
      coupon.description = description;
    }

    if (minimumOrderAmount !== undefined) {
      coupon.minimumOrderAmount = minimumOrderAmount;
    }

    if (maximumDiscount !== undefined) {
      coupon.maximumDiscount = maximumDiscount;
    }

    if (expiryDate !== undefined) {
      coupon.expiryDate = expiryDate;
    }

    if (usageLimit !== undefined) {
      coupon.usageLimit = usageLimit;
    }

    if (isActive !== undefined) {
      coupon.isActive = isActive;
    }

    await coupon.save();

    return res.status(200).json({
      success: true,
      message: "Coupon updated successfully",
      coupon,
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Error in Update Coupon API",
      error: error.message,
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
    const { code, orderAmount } = req.body;

    if (!code || orderAmount === undefined) {
      return res.status(400).json({
        success: false,
        message: "Coupon code and order amount are required",
      });
    }

    if (orderAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Order amount must be greater than 0",
      });
    }

    const coupon = await Coupon.findOne({
      code: code.trim().toUpperCase(),
    });

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Invalid coupon code",
      });
    }

    if (!coupon.isActive) {
      return res.status(400).json({
        success: false,
        message: "Coupon is inactive",
      });
    }

    if (new Date(coupon.expiryDate) < new Date()) {
      return res.status(400).json({
        success: false,
        message: "Coupon has expired",
      });
    }

    if (
      orderAmount < (coupon.minimumOrderAmount || 0)
    ) {
      return res.status(400).json({
        success: false,
        message: `Minimum order amount is ₹${coupon.minimumOrderAmount}`,
      });
    }

    if (
      coupon.usageLimit !== null &&
      coupon.usedCount >= coupon.usageLimit
    ) {
      return res.status(400).json({
        success: false,
        message: "Coupon usage limit reached",
      });
    }

    let discountAmount = 0;

    if (coupon.discountType === "PERCENTAGE") {
      discountAmount =
        (orderAmount * coupon.discountValue) / 100;
    } else {
      discountAmount = coupon.discountValue;
    }

    if (
      coupon.maximumDiscount !== null &&
      coupon.maximumDiscount > 0
    ) {
      discountAmount = Math.min(
        discountAmount,
        coupon.maximumDiscount
      );
    }

    discountAmount = Math.min(
      discountAmount,
      orderAmount
    );

    const finalAmount = orderAmount - discountAmount;

    return res.status(200).json({
      success: true,
      message: "Coupon applied successfully",
      coupon: {
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
      },
      orderAmount,
      discountAmount,
      finalAmount,
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Error in Apply Coupon API",
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
};