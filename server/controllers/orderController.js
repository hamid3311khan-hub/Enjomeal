const mongoose = require("mongoose");
const Order = require("../models/orderModel");
const Food = require("../models/foodModels");
const Cart = require("../models/cartModel");
const Restaurant = require("../models/restaurant");
const Delivery = require("../models/deliveryModel");
const Notification = require("../models/notificationModel");
const Settings = require("../models/settingsModel");
const Coupon = require("../models/couponModel");
const CouponUsage = require("../models/couponUsageModel");

// ===============================
// CREATE ORDER
// CUSTOMER ONLY
// ===============================
const createOrderController = async (req, res) => {
  try {
    const userId = req.user.id;
    const checkoutKey = String(
      req.get("Idempotency-Key") || ""
    ).trim();

    if (!/^[a-zA-Z0-9_-]{8,100}$/.test(checkoutKey)) {
      return res.status(400).json({
        success: false,
        message: "Invalid or missing checkout key. Please retry checkout.",
      });
    }

    // Return the already-created order when the same checkout is retried.
    const existingOrder = await Order.findOne({
      user: userId,
      checkoutKey,
    });

    if (existingOrder) {
      return res.status(200).json({
        success: true,
        message: "Order already created for this checkout.",
        order: existingOrder,
      });
    }

    const {
      restaurant,
      items,
      deliveryAddress,
      paymentMethod,
      couponCode
    } = req.body;

    // ===============================
    // BASIC VALIDATION
    // ===============================

    if (
      !restaurant ||
      !items ||
      !Array.isArray(items) ||
      items.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Restaurant and items are required",
      });
    }

    if (
      !deliveryAddress ||
      !deliveryAddress.address ||
      !deliveryAddress.city ||
      !deliveryAddress.pincode
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Complete delivery address is required",
      });
    }

    if (
      !mongoose.Types.ObjectId.isValid(
        restaurant
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid restaurant ID",
      });
    }

    // ===============================
    // VALIDATE RESTAURANT
    // ===============================

    const restaurantItem =
      await Restaurant.findById(
        restaurant
      );

    if (!restaurantItem) {
      return res.status(404).json({
        success: false,
        message:
          "Restaurant not found",
      });
    }

    if (
      restaurantItem.approvalStatus !==
        "APPROVED" ||
      !restaurantItem.isActive
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Restaurant is currently unavailable",
      });
    }

        // ===============================
    // DELIVERY RADIUS VALIDATION
    // ===============================

    const restaurantLatitude = Number(
      restaurantItem.latitude
    );

    const restaurantLongitude = Number(
      restaurantItem.longitude
    );

    const customerLatitude = Number(
      deliveryAddress.latitude
    );

    const customerLongitude = Number(
      deliveryAddress.longitude
    );

    // Validate restaurant location
    if (
      !Number.isFinite(restaurantLatitude) ||
      !Number.isFinite(restaurantLongitude)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Restaurant delivery location is not configured. Please ask the restaurant to update Delivery Settings.",
      });
    }

    // Validate customer location
    if (
      !Number.isFinite(customerLatitude) ||
      customerLatitude < -90 ||
      customerLatitude > 90 ||
      !Number.isFinite(customerLongitude) ||
      customerLongitude < -180 ||
      customerLongitude > 180
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Valid delivery location is required. Please use the 'Use My Current Location' option.",
      });
    }

    // Haversine distance calculation
    const toRadians = (degrees) =>
      (degrees * Math.PI) / 180;

    const earthRadiusKm = 6371;

    const latitudeDifference = toRadians(
      customerLatitude - restaurantLatitude
    );

    const longitudeDifference = toRadians(
      customerLongitude - restaurantLongitude
    );

    const a =
      Math.sin(latitudeDifference / 2) ** 2 +
      Math.cos(
        toRadians(restaurantLatitude)
      ) *
        Math.cos(
          toRadians(customerLatitude)
        ) *
        Math.sin(longitudeDifference / 2) ** 2;

    const distanceKm =
      earthRadiusKm *
      2 *
      Math.atan2(
        Math.sqrt(a),
        Math.sqrt(1 - a)
      );

    const maxDeliveryRadiusKm = Number(
      restaurantItem.maxDeliveryRadiusKm || 3
    );

    // Reject order if customer is outside restaurant radius
    if (distanceKm > maxDeliveryRadiusKm) {
      return res.status(400).json({
        success: false,
        message: `This delivery address is ${distanceKm.toFixed(
          2
        )} KM away. This restaurant delivers only up to ${maxDeliveryRadiusKm} KM.`,
      });
    }

    // ===============================
    // PAYMENT METHOD
    // ===============================

    const selectedPaymentMethod =
      paymentMethod || "COD";

    if (
      !["COD", "ONLINE"].includes(
        selectedPaymentMethod
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid payment method",
      });
    }

    // ===============================
    // VALIDATE FOOD ITEMS
    // ===============================

    let subtotal = 0;
const orderItems = [];

// ===============================
// DELIVERY FEE
// ===============================
// Abhi delivery-fee rule finalize nahi hua.
// Isliye temporary 0 rakha gaya hai.
// ==========================================
// PLATFORM SETTINGS
// ==========================================

const settings = await Settings.findOne();

const deliveryFee = settings?.freeDelivery
  ? 0
  : Number(settings?.deliveryFee || 0);

const platformCharge =
  Number(settings?.platformCharge || 0);

// Coupon discount
let  discountAmount = 0;

    for (const item of items) {
      if (
        !item.food ||
        !item.quantity ||
        item.quantity < 1
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid food item or quantity",
        });
      }

      if (
        !mongoose.Types.ObjectId.isValid(
          item.food
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid food ID",
        });
      }

      const foodItem =
        await Food.findById(item.food);

      if (!foodItem) {
        return res.status(404).json({
          success: false,
          message:
            `Food not found: ${item.food}`,
        });
      }

      // ===============================
      // FOOD AVAILABILITY
      // ===============================

      if (!foodItem.isAvailable) {
        return res.status(400).json({
          success: false,
          message:
            `${foodItem.name} is currently unavailable`,
        });
      }

      // ===============================
      // FOOD RESTAURANT CHECK
      // ===============================

      if (
        foodItem.restaurant.toString() !==
        restaurant.toString()
      ) {
        return res.status(400).json({
          success: false,
          message:
            `${foodItem.name} does not belong to this restaurant`,
        });
      }

      // ===============================
      // SNAPSHOT PRICE
      // ===============================

      orderItems.push({
        food: foodItem._id,
        quantity: item.quantity,
        price: foodItem.price,
      });

      subtotal +=
        foodItem.price *
        item.quantity;
    }

    // ===============================
// COUPON VALIDATION
// ===============================

if (couponCode) {
  const coupon = await Coupon.findOne({
    code: String(couponCode).trim().toUpperCase(),
  });

  if (!coupon) {
    return res.status(400).json({ success: false, message: "Invalid coupon code" });
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

  if (coupon.scope === "GROCERY") {
    return res.status(400).json({
      success: false,
      message: "This coupon is only valid for grocery orders",
    });
  }

  const hasFoodRestrictions =
    (Array.isArray(coupon.restaurantIds) && coupon.restaurantIds.length > 0) ||
    (Array.isArray(coupon.foodIds) && coupon.foodIds.length > 0);
  const hasGroceryRestrictions =
    Array.isArray(coupon.groceryProductIds) &&
    coupon.groceryProductIds.length > 0;

  if (coupon.scope === "BOTH" && !hasFoodRestrictions && hasGroceryRestrictions) {
    return res.status(400).json({
      success: false,
      message: "This coupon is restricted to selected grocery products",
    });
  }

  const existingCouponUsage = await CouponUsage.findOne({
    coupon: coupon._id,
    user: userId,
  });

  if (existingCouponUsage) {
    return res.status(400).json({
      success: false,
      message: "You have already used this coupon",
    });
  }

  const selectedRestaurantId = String(restaurant);
  const restaurantEligible =
    !coupon.restaurantIds?.length ||
    coupon.restaurantIds.some((id) => String(id) === selectedRestaurantId);

  if (!restaurantEligible) {
    return res.status(400).json({
      success: false,
      message: "This coupon is not valid for the selected restaurant",
    });
  }

  let eligibleSubtotal = 0;

  for (const item of orderItems) {
    const foodId = String(item.food);
    const foodEligible =
      !coupon.foodIds?.length ||
      coupon.foodIds.some((id) => String(id) === foodId);

    if (restaurantEligible && foodEligible) {
      eligibleSubtotal += Number(item.price) * Number(item.quantity);
    }
  }

  eligibleSubtotal = Math.round(eligibleSubtotal * 100) / 100;

  if (eligibleSubtotal <= 0) {
    return res.status(400).json({
      success: false,
      message: "No items in this order are eligible for the coupon",
    });
  }

  if (eligibleSubtotal < Number(coupon.minimumOrderAmount || 0)) {
    return res.status(400).json({
      success: false,
      message: `Eligible items must total at least ₹${coupon.minimumOrderAmount}`,
    });
  }

  if (coupon.discountType === "PERCENTAGE") {
    discountAmount = (eligibleSubtotal * coupon.discountValue) / 100;
  } else {
    discountAmount = coupon.discountValue;
  }

  if (coupon.maximumDiscount != null) {
    discountAmount = Math.min(discountAmount, coupon.maximumDiscount);
  }

  discountAmount =
    Math.round(Math.min(discountAmount, eligibleSubtotal) * 100) / 100;
}

    // ===============================
// FINAL ORDER TOTAL
// ===============================

const totalAmount = Math.max(
  0,
  subtotal +
    deliveryFee +
    platformCharge -
    discountAmount
);

// ===============================
// CREATE ORDER
// ===============================


let order;
const session = await mongoose.startSession();

try {
  await session.withTransaction(async () => {
    let transactionCoupon = null;

    if (couponCode) {
      transactionCoupon = await Coupon.findOne({
        code: String(couponCode).trim().toUpperCase(),
      }).session(session);

      if (
        !transactionCoupon ||
        !transactionCoupon.isActive ||
        !transactionCoupon.expiryDate ||
        new Date(transactionCoupon.expiryDate) < new Date()
      ) {
        throw new Error("Coupon is no longer valid. Please try again.");
      }

      if (transactionCoupon.scope === "GROCERY") {
        throw new Error("This coupon is only valid for grocery orders.");
      }

      const hasFoodRestrictions =
        (Array.isArray(transactionCoupon.restaurantIds) &&
          transactionCoupon.restaurantIds.length > 0) ||
        (Array.isArray(transactionCoupon.foodIds) &&
          transactionCoupon.foodIds.length > 0);

      const hasGroceryRestrictions =
        Array.isArray(transactionCoupon.groceryProductIds) &&
        transactionCoupon.groceryProductIds.length > 0;

      if (
        transactionCoupon.scope === "BOTH" &&
        !hasFoodRestrictions &&
        hasGroceryRestrictions
      ) {
        throw new Error("This coupon is restricted to selected grocery products.");
      }

      const selectedRestaurantId = String(restaurant);
      const restaurantEligible =
        !transactionCoupon.restaurantIds?.length ||
        transactionCoupon.restaurantIds.some(
          (id) => String(id) === selectedRestaurantId
        );

      if (!restaurantEligible) {
        throw new Error("This coupon is not valid for the selected restaurant.");
      }

      let eligibleSubtotal = 0;

      for (const item of orderItems) {
        const foodId = String(item.food);
        const foodEligible =
          !transactionCoupon.foodIds?.length ||
          transactionCoupon.foodIds.some((id) => String(id) === foodId);

        if (foodEligible) {
          eligibleSubtotal += Number(item.price) * Number(item.quantity);
        }
      }

      eligibleSubtotal = Math.round(eligibleSubtotal * 100) / 100;

      if (eligibleSubtotal <= 0) {
        throw new Error("No items in this order are eligible for the coupon.");
      }

      if (
        eligibleSubtotal <
        Number(transactionCoupon.minimumOrderAmount || 0)
      ) {
        throw new Error(
          `Eligible items must total at least ₹${transactionCoupon.minimumOrderAmount}`
        );
      }

      if (transactionCoupon.discountType === "PERCENTAGE") {
        discountAmount =
          (eligibleSubtotal * Number(transactionCoupon.discountValue || 0)) / 100;
      } else if (transactionCoupon.discountType === "FIXED") {
        discountAmount = Number(transactionCoupon.discountValue || 0);
      } else {
        throw new Error("Coupon discount type is invalid.");
      }

      if (transactionCoupon.maximumDiscount != null) {
        discountAmount = Math.min(
          discountAmount,
          Number(transactionCoupon.maximumDiscount)
        );
      }

      discountAmount =
        Math.round(
          Math.min(Math.max(0, discountAmount), eligibleSubtotal) * 100
        ) / 100;

      const priorUsage = await CouponUsage.findOne({
        coupon: transactionCoupon._id,
        user: userId,
      }).session(session);

      if (priorUsage) {
        throw new Error("You have already used this coupon.");
      }

      const couponFilter = {
        _id: transactionCoupon._id,
        isActive: true,
        expiryDate: { $gte: new Date() },
      };

      if (transactionCoupon.usageLimit != null) {
        couponFilter.usedCount = { $lt: transactionCoupon.usageLimit };
      }

      const couponUpdate = await Coupon.updateOne(
        couponFilter,
        { $inc: { usedCount: 1 } },
        { session }
      );

      if (couponUpdate.matchedCount !== 1) {
        throw new Error("Coupon usage limit reached. Please try another coupon.");
      }
    }

    const transactionTotalAmount = Math.round(
      Math.max(
        0,
        subtotal + deliveryFee + platformCharge - discountAmount
      ) * 100
    ) / 100;

    order = new Order({
      user: userId,
      checkoutKey,
      restaurant,
      items: orderItems,
      subtotal,
      deliveryFee,
      discountAmount,
      platformCharge,
      totalAmount: transactionTotalAmount,
      deliveryAddress,
      paymentMethod: selectedPaymentMethod,
      paymentStatus: "PENDING",
      orderStatus: "PLACED",
    });

    await order.save({ session });

    if (transactionCoupon) {
      await CouponUsage.create(
        [{
          coupon: transactionCoupon._id,
          user: userId,
          order: order._id,
        }],
        { session }
      );
    }

    await Cart.findOneAndUpdate(
      { user: userId },
      { $set: { items: [], totalAmount: 0, restaurant: null } },
      { session }
    );
  });
} finally {
  await session.endSession();
}



    // A committed order must not be reported as failed if response population fails.
    try {
      await order.populate(
        "user",
        "name email phone"
      );

      await order.populate(
        "restaurant"
      );

      await order.populate(
        "items.food"
      );
    } catch (populateError) {
      console.error("Order created, but response population failed:", populateError);
    }

    // Notifications and socket alerts must not turn a committed order into a failed checkout.
    try {
      // ===============================
  // CREATE ORDER NOTIFICATION
  // ===============================

  await Notification.create({
    user: userId,
    title: "Order Placed",
    message: "Your order has been placed successfully.",
    type: "ORDER_PLACED",
    order: order._id,
    isRead: false,
  });


      // ===============================
  // ADMIN NEW ORDER NOTIFICATION
  // ===============================

  const User = mongoose.model("User");

  const admins = await User.find({
    role: "admin",
    isActive: true,
  }).select("_id");

  const io = req.app.get("io");

  for (const admin of admins) {
    const adminNotification =
      await Notification.create({
        user: admin._id,
        title: "New Order Received",
        message: `A new order has been placed. Order ID: ${order._id}`,
        type: "ORDER_PLACED",
        order: order._id,
        isRead: false,
      });

    if (io) {
      io.to(`user:${admin._id.toString()}`).emit(
        "notification:new",
        {
          success: true,
          notification: adminNotification,
        }
      );
    }
  }

      // ===============================
      // RESPONSE
      // ===============================

      // RESTAURANT NEW ORDER SOCKET EVENT
  if (io && order.restaurant && order.restaurant._id) {
    io.to(`restaurant:${order.restaurant._id.toString()}`).emit(
      "order:new",
      {
        success: true,
        orderId: order._id.toString(),
        restaurantId: order.restaurant._id.toString(),
        orderStatus: order.orderStatus,
        createdAt: order.createdAt,
      }
    );
  }


    } catch (notificationError) {
      console.error("Order created, but post-commit notification failed:", notificationError);
    }

    return res.status(201).json({
      success: true,
      message:
        "Order created successfully",
      order,
    });
  } catch (error) {
    console.error(
      "Create Order Error:",
      error
    );

    // Recover safely if another request created the same checkout first.
    if (error && error.code === 11000) {
      try {
        const checkoutKey = String(
          req.get("Idempotency-Key") || ""
        ).trim();

        if (/^[a-zA-Z0-9_-]{8,100}$/.test(checkoutKey)) {
          const existingOrder = await Order.findOne({
            user: req.user.id,
            checkoutKey,
          });

          if (existingOrder) {
            return res.status(200).json({
              success: true,
              message: "Order already created for this checkout.",
              order: existingOrder,
            });
          }
        }
      } catch (lookupError) {
        console.error(
          "Could not recover duplicate checkout:",
          lookupError.message
        );
      }
    }

    const clientErrors = [
      "Coupon is no longer valid. Please try again.",
      "You have already used this coupon.",
      "Coupon usage limit reached. Please try another coupon.",
      "This coupon is only valid for grocery orders.",
      "This coupon is restricted to selected grocery products.",
      "This coupon is not valid for the selected restaurant.",
      "No items in this order are eligible for the coupon.",
      "Coupon discount type is invalid.",
    ];

    const isClientError =
      clientErrors.includes(error.message) ||
      error.message.startsWith("Eligible items must total at least ₹");

    const statusCode = isClientError ? 400 : 500;

    return res.status(statusCode).json({
      success: false,
      message:
        statusCode === 400 ? error.message : "Error in Create Order API",
      error: error.message,
    });
  }
};

// ===============================
// GET USER ORDERS
// CUSTOMER ONLY
// ===============================
const getUserOrdersController = async (
  req,
  res
) => {
  try {
    const userId = req.user.id;

    const orders =
      await Order.find({
        user: userId,
      })
        .populate("restaurant")
        .populate("items.food")
        .populate(
  "deliveryPartner",
  "name phone email vehicleType vehicleNumber profilePhoto isAvailable"
)
        .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message:
        "Orders fetched successfully",
      count: orders.length,
      orders,
    });
  } catch (error) {
    console.error(
      "Get User Orders Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Error in Get User Orders API",
      error: error.message,
    });
  }
};

// ===============================
// GET RESTAURANT ORDERS
// RESTAURANT ONLY
// ===============================
const getRestaurantOrdersController =
  async (req, res) => {
    try {
      // ===============================
      // FIND RESTAURANT
      // ===============================

      const restaurant =
        await Restaurant.findOne({
          owner: req.user.id,
        });

      if (!restaurant) {
        return res.status(404).json({
          success: false,
          message:
            "Restaurant profile not found",
        });
      }

      // ===============================
      // RESTAURANT STATUS
      // ===============================

      if (
        restaurant.approvalStatus !==
          "APPROVED" ||
        !restaurant.isActive
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Restaurant account is not active or approved",
        });
      }

      // ===============================
      // FETCH OWN ORDERS ONLY
      // ===============================

      const orders =
        await Order.find({
          restaurant:
            restaurant._id,
        })
          .populate(
            "user",
            "name email phone"
          )
          .populate("restaurant")
          .populate("items.food")
          .populate("deliveryPartner")
          .sort({ createdAt: -1 });

      // ===============================
      // RESPONSE
      // ===============================

      return res.status(200).json({
        success: true,
        message:
          "Restaurant orders fetched successfully",
        count: orders.length,
        orders,
      });
    } catch (error) {
      console.error(
        "Get Restaurant Orders Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Error in Get Restaurant Orders API",
        error: error.message,
      });
    }
  };

// ===============================
// GET ALL ORDERS
// ADMIN ONLY
// ===============================
const getAllOrdersController =
  async (req, res) => {
    try {
      const orders =
        await Order.find({})
          .populate(
            "user",
            "name email phone"
          )
          .populate("restaurant")
          .populate("items.food")
          .populate("deliveryPartner")
          .sort({ createdAt: -1 });

      return res.status(200).json({
        success: true,
        message:
          "All orders fetched successfully",
        count: orders.length,
        orders,
      });
    } catch (error) {
      console.error(
        "Get All Orders Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Error in Get All Orders API",
        error: error.message,
      });
    }
  };

// ===============================
// GET SINGLE ORDER
// AUTHENTICATED USERS
// ===============================
const getSingleOrderController = async (
  req,
  res
) => {
  try {
    const { orderId } = req.params;

    if (
      !mongoose.Types.ObjectId.isValid(
        orderId
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid order ID",
      });
    }

    const order =
      await Order.findById(orderId)
        .populate(
          "user",
          "name email phone"
        )
        .populate("restaurant")
        .populate("items.food")
        .populate("deliveryPartner");

    if (!order) {
      return res.status(404).json({
        success: false,
        message:
          "Order not found",
      });
    }

    // ===============================
    // CUSTOMER AUTHORIZATION
    // ===============================

    if (req.user.role === "customer") {
      if (
        order.user._id.toString() !==
        req.user.id.toString()
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Access denied. This order does not belong to you.",
        });
      }
    }

    // ===============================
    // RESTAURANT AUTHORIZATION
    // ===============================

    if (
      req.user.role === "restaurant"
    ) {
      const restaurant =
        await Restaurant.findOne({
          owner: req.user.id,
        });

      if (!restaurant) {
        return res.status(403).json({
          success: false,
          message:
            "Restaurant profile not found",
        });
      }

      if (
        order.restaurant._id.toString() !==
        restaurant._id.toString()
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Access denied. This order belongs to another restaurant.",
        });
      }
    }

    // ===============================
    // DELIVERY AUTHORIZATION
    // ===============================

    if (req.user.role === "delivery") {
      const delivery =
        await Delivery.findOne({
          user: req.user.id,
        });

      if (!delivery) {
        return res.status(403).json({
          success: false,
          message:
            "Delivery partner profile not found",
        });
      }

      if (!delivery.isActive) {
        return res.status(403).json({
          success: false,
          message:
            "Delivery partner account is inactive",
        });
      }

      if (
        !order.deliveryPartner ||
        order.deliveryPartner._id.toString() !==
          delivery._id.toString()
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Access denied. This order is not assigned to you.",
        });
      }
    }

    return res.status(200).json({
      success: true,
      message:
        "Order fetched successfully",
      order,
    });
  } catch (error) {
    console.error(
      "Get Single Order Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Error in Get Single Order API",
      error: error.message,
    });
  }
};

// ===============================
// UPDATE ORDER STATUS
// RESTAURANT / DELIVERY / ADMIN
// ===============================
const updateOrderStatusController = async (
  req,
  res
) => {
  try {
    const { orderId } = req.params;
    const { orderStatus } = req.body;

    // ===============================
    // VALIDATE ORDER ID
    // ===============================

    if (
      !mongoose.Types.ObjectId.isValid(
        orderId
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID",
      });
    }

    // ===============================
    // ALLOWED STATUS
    // ===============================

    const allowedStatuses = [
      "PLACED",
      "CONFIRMED",
      "PREPARING",
      "READY",
      "OUT_FOR_DELIVERY",
      "DELIVERED",
      "CANCELLED",
    ];

    if (
      !orderStatus ||
      !allowedStatuses.includes(
        orderStatus
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid order status",
      });
    }

    // ===============================
    // FIND ORDER
    // ===============================

    const order =
      await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // =================================================
    // RESTAURANT STATUS FLOW
    // =================================================

    if (req.user.role === "restaurant") {
      const restaurant =
        await Restaurant.findOne({
          owner: req.user.id,
        });

      if (!restaurant) {
        return res.status(403).json({
          success: false,
          message:
            "Restaurant profile not found",
        });
      }

      if (
        restaurant.approvalStatus !==
          "APPROVED" ||
        !restaurant.isActive
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Restaurant account is not active or approved",
        });
      }

      // Own order only
      if (
        order.restaurant.toString() !==
        restaurant._id.toString()
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Access denied. This order belongs to another restaurant.",
        });
      }

      // Restaurant allowed transitions
      const restaurantTransitions = {
        PLACED: ["CONFIRMED", "CANCELLED"],
        CONFIRMED: ["PREPARING", "CANCELLED"],
        PREPARING: ["READY"],
        READY: [],
        OUT_FOR_DELIVERY: [],
        DELIVERED: [],
        CANCELLED: [],
      };

      const allowedNextStatuses =
        restaurantTransitions[
          order.orderStatus
        ] || [];

      if (
        !allowedNextStatuses.includes(
          orderStatus
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            `Restaurant cannot change order from ${order.orderStatus} to ${orderStatus}`,
        });
      }
    }

    // =================================================
    // DELIVERY PARTNER STATUS FLOW
    // =================================================

    if (req.user.role === "delivery") {
      const delivery =
        await Delivery.findOne({
          user: req.user.id,
        });

      if (!delivery) {
        return res.status(403).json({
          success: false,
          message:
            "Delivery partner profile not found",
        });
      }

      if (!delivery.isActive) {
        return res.status(403).json({
          success: false,
          message:
            "Delivery partner account is inactive",
        });
      }

      // Own assigned order only
      if (
        !order.deliveryPartner ||
        order.deliveryPartner.toString() !==
          delivery._id.toString()
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Access denied. This order is not assigned to you.",
        });
      }

      // Delivery partner allowed flow
      if (
        order.orderStatus === "READY" &&
        orderStatus === "OUT_FOR_DELIVERY"
      ) {
        // allowed
      } else if (
        order.orderStatus ===
          "OUT_FOR_DELIVERY" &&
        orderStatus === "DELIVERED"
      ) {
        // allowed
      } else {
        return res.status(400).json({
          success: false,
          message:
            `Delivery partner cannot change order from ${order.orderStatus} to ${orderStatus}`,
        });
      }
    }

    // =================================================
    // ADMIN
    // =================================================

    if (req.user.role === "admin") {
      // Admin can update any valid status.
      // No restaurant/delivery ownership restriction.
    }

    // ===============================
// UPDATE STATUS
// ===============================

order.orderStatus = orderStatus;

await order.save();

// ===============================
// CREATE ORDER STATUS NOTIFICATION
// ===============================

const statusNotificationMap = {
  CONFIRMED: {
    title: "Order Confirmed",
    message: "Your order has been confirmed by the restaurant.",
    type: "ORDER_CONFIRMED",
  },

  PREPARING: {
    title: "Order Preparing",
    message: "Your order is now being prepared.",
    type: "ORDER_PREPARING",
  },

  READY: {
    title: "Order Ready",
    message: "Your order is ready for delivery.",
    type: "ORDER_READY",
  },

  OUT_FOR_DELIVERY: {
    title: "Out for Delivery",
    message: "Your order is out for delivery.",
    type: "OUT_FOR_DELIVERY",
  },

  DELIVERED: {
    title: "Order Delivered",
    message: "Your order has been delivered successfully.",
    type: "ORDER_DELIVERED",
  },

  CANCELLED: {
    title: "Order Cancelled",
    message: "Your order has been cancelled.",
    type: "ORDER_CANCELLED",
  },
};

const notificationData =
  statusNotificationMap[orderStatus];

if (notificationData) {
  const notification =
    await Notification.create({
      user: order.user,
      title: notificationData.title,
      message: notificationData.message,
      type: notificationData.type,
      order: order._id,
      isRead: false,
    });

  const io = req.app.get("io");

  if (io) {
    io.to(
      `user:${order.user.toString()}`
    ).emit(
      "notification:new",
      {
        success: true,
        notification,
      }
    );
  }
}

// ===============================
// AUTO ONLINE AFTER DELIVERY
// ===============================

if (
  req.user.role === "delivery" &&
  orderStatus === "DELIVERED" &&
  order.deliveryPartner
) {
  await Delivery.findByIdAndUpdate(
    order.deliveryPartner,
    {
      isAvailable: true,
    }
  );
}

    // ===============================
    // POPULATE UPDATED ORDER
    // ===============================

    await order.populate(
      "user",
      "name email phone"
    );

    await order.populate(
      "restaurant"
    );

    await order.populate(
      "items.food"
    );

    await order.populate(
      "deliveryPartner"
    );

    return res.status(200).json({
      success: true,
      message:
        "Order status updated successfully",
      order,
    });
  } catch (error) {
    console.error(
      "Update Order Status Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Error in Update Order Status API",
      error: error.message,
    });
  }
};
// ===============================
// ASSIGN DELIVERY PARTNER
// RESTAURANT / ADMIN
// ===============================
const assignDeliveryPartnerController = async (
  req,
  res
) => {
  try {
    const { orderId } = req.params;
    const { deliveryPartner } = req.body;

    // ===============================
    // VALIDATION
    // ===============================

    if (
      !mongoose.Types.ObjectId.isValid(orderId) ||
      !mongoose.Types.ObjectId.isValid(
        deliveryPartner
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid order ID or delivery partner ID",
      });
    }

    // ===============================
    // FIND ORDER
    // ===============================

    const order =
      await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // ===============================
    // RESTAURANT AUTHORIZATION
    // ===============================

    if (req.user.role === "restaurant") {
      const restaurant =
        await Restaurant.findOne({
          owner: req.user.id,
        });

      if (!restaurant) {
        return res.status(403).json({
          success: false,
          message:
            "Restaurant profile not found",
        });
      }

      if (
        restaurant.approvalStatus !==
          "APPROVED" ||
        !restaurant.isActive
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Restaurant account is not active or approved",
        });
      }

      // Own restaurant order only
      if (
        order.restaurant.toString() !==
        restaurant._id.toString()
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Access denied. This order belongs to another restaurant.",
        });
      }
    }

    // ===============================
    // ORDER STATUS CHECK
    // ===============================

    if (order.orderStatus !== "READY") {
      return res.status(400).json({
        success: false,
        message:
          "Delivery partner can only be assigned when order is READY.",
      });
    }

    // ===============================
    // FIND DELIVERY PARTNER
    // ===============================

    const delivery =
      await Delivery.findById(
        deliveryPartner
      );

    if (!delivery) {
      return res.status(404).json({
        success: false,
        message:
          "Delivery partner not found",
      });
    }

    // ===============================
    // ACTIVE CHECK
    // ===============================

    if (!delivery.isActive) {
      return res.status(400).json({
        success: false,
        message:
          "Delivery partner is inactive",
      });
    }

    // ===============================
    // AVAILABILITY CHECK
    // ===============================

    if (!delivery.isAvailable) {
      return res.status(400).json({
        success: false,
        message:
          "Delivery partner is currently unavailable",
      });
    }

    // ===============================
    // CHECK LINKED USER
    // ===============================

    if (!delivery.user) {
      return res.status(400).json({
        success: false,
        message:
          "Delivery partner is not linked to a user account",
      });
    }

    const deliveryUser =
      await mongoose.model("User").findById(
        delivery.user
      );

    if (!deliveryUser) {
      return res.status(400).json({
        success: false,
        message:
          "Linked delivery user account not found",
      });
    }

    if (
      deliveryUser.role !== "delivery"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid delivery partner user role",
      });
    }

    if (!deliveryUser.isActive) {
      return res.status(400).json({
        success: false,
        message:
          "Linked delivery user account is inactive",
      });
    }

    // ===============================
    // PREVENT SAME PARTNER REASSIGN
    // ===============================

    if (
      order.deliveryPartner &&
      order.deliveryPartner.toString() ===
        delivery._id.toString()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "This delivery partner is already assigned to this order",
      });
    }

    // ===============================
    // ASSIGN PARTNER
    // ===============================

    order.deliveryPartner =
      delivery._id;

    await order.save();

    // ===============================
// DELIVERY ASSIGNED NOTIFICATION
// ===============================

// Notify Delivery Partner
await Notification.create({
  user: delivery.user,
  title: "New Delivery Assigned",
  message: "A new order has been assigned to you.",
  type: "DELIVERY_ASSIGNED",
  order: order._id,
  isRead: false,
});

// Notify Customer
await Notification.create({
  user: order.user,
  title: "Delivery Partner Assigned",
  message: "A delivery partner has been assigned to your order.",
  type: "DELIVERY_ASSIGNED",
  order: order._id,
  isRead: false,
});

    // ===============================
    // MARK PARTNER UNAVAILABLE
    // ===============================

    delivery.isAvailable = false;

    await delivery.save();

    // ===============================
    // POPULATE
    // ===============================

    await order.populate(
      "user",
      "name email phone"
    );

    await order.populate(
      "restaurant"
    );

    await order.populate(
      "items.food"
    );

    await order.populate(
      "deliveryPartner"
    );

    return res.status(200).json({
      success: true,
      message:
        "Delivery partner assigned successfully",
      order,
    });
  } catch (error) {
    console.error(
      "Assign Delivery Partner Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Error in Assign Delivery Partner API",
      error: error.message,
    });
  }
};

// ===============================
// CANCEL ORDER
// CUSTOMER / RESTAURANT / ADMIN
// ===============================
const cancelOrderController = async (
  req,
  res
) => {
  try {
    const { orderId } = req.params;

    // ===============================
    // VALIDATE ORDER ID
    // ===============================

    if (
      !mongoose.Types.ObjectId.isValid(
        orderId
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID",
      });
    }

    // ===============================
    // FIND ORDER
    // ===============================

    const order =
      await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // ===============================
    // ALREADY CANCELLED
    // ===============================

    if (
      order.orderStatus === "CANCELLED"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Order is already cancelled",
      });
    }

    // ===============================
    // ALREADY DELIVERED
    // ===============================

    if (
      order.orderStatus === "DELIVERED"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Delivered order cannot be cancelled",
      });
    }

    // ===============================
    // OUT FOR DELIVERY
    // ===============================

    if (
      order.orderStatus ===
      "OUT_FOR_DELIVERY"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Order cannot be cancelled after going out for delivery",
      });
    }

    // ===============================
    // CUSTOMER
    // ===============================

    if (req.user.role === "customer") {
      if (
        order.user.toString() !==
        req.user.id.toString()
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Access denied. This order does not belong to you.",
        });
      }

      // Customer cancellation allowed
      // before preparation starts
      if (
        ![
          "PLACED",
          "CONFIRMED",
        ].includes(
          order.orderStatus
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Order can no longer be cancelled",
        });
      }
    }

    // ===============================
    // RESTAURANT
    // ===============================

    if (req.user.role === "restaurant") {
      const restaurant =
        await Restaurant.findOne({
          owner: req.user.id,
        });

      if (!restaurant) {
        return res.status(403).json({
          success: false,
          message:
            "Restaurant profile not found",
        });
      }

      if (
        order.restaurant.toString() !==
        restaurant._id.toString()
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Access denied. This order belongs to another restaurant.",
        });
      }

      if (
        ![
          "PLACED",
          "CONFIRMED",
        ].includes(
          order.orderStatus
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Restaurant can no longer cancel this order",
        });
      }
    }

    // ===============================
    // DELIVERY PARTNER
    // ===============================

    if (req.user.role === "delivery") {
      return res.status(403).json({
        success: false,
        message:
          "Delivery partner cannot cancel orders",
      });
    }

    // ===============================
    // CANCEL ORDER
    // ===============================

    order.orderStatus = "CANCELLED";

    // ===============================
// ORDER CANCELLED NOTIFICATION
// ===============================

await Notification.create({
  user: order.user,
  title: "Order Cancelled",
  message: "Your order has been cancelled.",
  type: "ORDER_CANCELLED",
  order: order._id,
  isRead: false,
});

    // If partner was somehow assigned,
    // make them available again
    if (order.deliveryPartner) {
      await Delivery.findByIdAndUpdate(
        order.deliveryPartner,
        {
          isAvailable: true,
        }
      );
    }

    await order.save();

    // ===============================
    // POPULATE
    // ===============================

    await order.populate(
      "user",
      "name email phone"
    );

    await order.populate(
      "restaurant"
    );

    await order.populate(
      "items.food"
    );

    await order.populate(
      "deliveryPartner"
    );

    return res.status(200).json({
      success: true,
      message:
        "Order cancelled successfully",
      order,
    });
  } catch (error) {
    console.error(
      "Cancel Order Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Error in Cancel Order API",
      error: error.message,
    });
  }
};
// ===============================
// UPDATE PAYMENT STATUS
// ADMIN ONLY
// ===============================
const updatePaymentStatusController = async (
  req,
  res
) => {
  try {
    const { orderId } = req.params;
    const { paymentStatus } = req.body;

    // ===============================
    // VALIDATE ORDER ID
    // ===============================

    if (
      !mongoose.Types.ObjectId.isValid(
        orderId
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID",
      });
    }

    // ===============================
    // VALID PAYMENT STATUS
    // ===============================

    const allowedStatuses = [
      "PENDING",
      "PAID",
      "FAILED",
    ];

    if (
      !paymentStatus ||
      !allowedStatuses.includes(
        paymentStatus
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid payment status",
      });
    }

    // ===============================
    // FIND ORDER
    // ===============================

    const order =
      await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }


    // ===============================
    // UPDATE PAYMENT STATUS
    // ===============================

    order.paymentStatus =
      paymentStatus;

    await order.save();

    // ===============================
    // POPULATE
    // ===============================

    await order.populate(
      "user",
      "name email phone"
    );

    await order.populate(
      "restaurant"
    );

    await order.populate(
      "items.food"
    );

    await order.populate(
      "deliveryPartner"
    );

    return res.status(200).json({
      success: true,
      message:
        "Payment status updated successfully",
      order,
    });
  } catch (error) {
    console.error(
      "Update Payment Status Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Error in Update Payment Status API",
      error: error.message,
    });
  }
};

// =====================================
// RESTAURANT-WISE REPORT
// ADMIN ONLY
// =====================================

const getRestaurantReportsController = async (
  req,
  res
) => {
  try {
    const { startDate, endDate } = req.query;

    // =====================================
    // DATE FILTER
    // =====================================

    const matchStage = {};

    if (startDate || endDate) {
      matchStage.createdAt = {};

      if (startDate) {
        const start = new Date(startDate);

        if (isNaN(start.getTime())) {
          return res.status(400).json({
            success: false,
            message: "Invalid start date",
          });
        }

        start.setHours(0, 0, 0, 0);

        matchStage.createdAt.$gte = start;
      }

      if (endDate) {
        const end = new Date(endDate);

        if (isNaN(end.getTime())) {
          return res.status(400).json({
            success: false,
            message: "Invalid end date",
          });
        }

        end.setHours(23, 59, 59, 999);

        matchStage.createdAt.$lte = end;
      }
    }

    // =====================================
    // RESTAURANT-WISE AGGREGATION
    // =====================================

    const reports = await Order.aggregate([
      {
        $match: matchStage,
      },

      {
        $group: {
          _id: "$restaurant",

          // Total orders
          totalOrders: {
            $sum: 1,
          },

          // Delivered orders
          completedOrders: {
            $sum: {
              $cond: [
                {
                  $eq: [
                    "$orderStatus",
                    "DELIVERED",
                  ],
                },
                1,
                0,
              ],
            },
          },

          // Cancelled orders
          cancelledOrders: {
            $sum: {
              $cond: [
                {
                  $eq: [
                    "$orderStatus",
                    "CANCELLED",
                  ],
                },
                1,
                0,
              ],
            },
          },

          // Food sales
          foodSales: {
            $sum: "$subtotal",
          },

          // Discount
          discount: {
            $sum: "$discountAmount",
          },

          // Delivery charges
          deliveryCharges: {
            $sum: "$deliveryFee",
          },

          // Platform charges
          platformCharges: {
            $sum: "$platformCharge",
          },

          // Customer collection
          customerCollection: {
            $sum: "$totalAmount",
          },

          // Delivered restaurant sales
          restaurantSales: {
            $sum: {
              $cond: [
                {
                  $eq: [
                    "$orderStatus",
                    "DELIVERED",
                  ],
                },
                {
                  $max: [
                    {
                      $subtract: [
                        "$subtotal",
                        "$discountAmount",
                      ],
                    },
                    0,
                  ],
                },
                0,
              ],
            },
          },
        },
      },

      // =====================================
      // RESTAURANT DETAILS
      // =====================================

      {
        $lookup: {
          from: "restaurants",
          localField: "_id",
          foreignField: "_id",
          as: "restaurant",
        },
      },

      {
        $unwind: {
          path: "$restaurant",
          preserveNullAndEmptyArrays: true,
        },
      },

      // =====================================
      // FINAL RESPONSE FIELDS
      // =====================================

      {
        $project: {
          _id: 0,

          restaurantId: "$_id",

          restaurantName: {
            $ifNull: [
              "$restaurant.name",
              "Unknown Restaurant",
            ],
          },

          totalOrders: 1,
          completedOrders: 1,
          cancelledOrders: 1,

          foodSales: 1,
          discount: 1,

          deliveryCharges: 1,
          platformCharges: 1,

          customerCollection: 1,

          // Amount belonging to restaurant
          // from successfully delivered orders
          restaurantSales: 1,
        },
      },

      // =====================================
      // SORT BY RESTAURANT NAME
      // =====================================

      {
        $sort: {
          restaurantName: 1,
        },
      },
    ]);

    // =====================================
    // GRAND TOTAL
    // =====================================

    const grandTotal = reports.reduce(
      (total, report) => {
        total.totalOrders +=
          report.totalOrders || 0;

        total.completedOrders +=
          report.completedOrders || 0;

        total.cancelledOrders +=
          report.cancelledOrders || 0;

        total.foodSales +=
          report.foodSales || 0;

        total.discount +=
          report.discount || 0;

        total.deliveryCharges +=
          report.deliveryCharges || 0;

        total.platformCharges +=
          report.platformCharges || 0;

        total.customerCollection +=
          report.customerCollection || 0;

        total.restaurantSales +=
          report.restaurantSales || 0;

        return total;
      },
      {
        totalOrders: 0,
        completedOrders: 0,
        cancelledOrders: 0,

        foodSales: 0,
        discount: 0,

        deliveryCharges: 0,
        platformCharges: 0,

        customerCollection: 0,

        restaurantSales: 0,
      }
    );

    // =====================================
    // RESPONSE
    // =====================================

    return res.status(200).json({
      success: true,

      message:
        "Restaurant reports fetched successfully",

      filters: {
        startDate: startDate || null,
        endDate: endDate || null,
      },

      count: reports.length,

      reports,

      grandTotal,
    });
  } catch (error) {
    console.error(
      "Restaurant Reports Error:",
      error
    );

    return res.status(500).json({
      success: false,

      message:
        "Error in Restaurant Reports API",

      error: error.message,
    });
  }
};

// =====================================
// MY RESTAURANT REPORT
// RESTAURANT ONLY
// =====================================

const getMyRestaurantReportController = async (
  req,
  res
) => {
  try {
    // =====================================
    // FIND LOGGED-IN RESTAURANT
    // =====================================

    const restaurant = await Restaurant.findOne({
      owner: req.user.id,
    });

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: "Restaurant profile not found",
      });
    }

    // =====================================
    // RESTAURANT STATUS
    // =====================================

    if (
      restaurant.approvalStatus !== "APPROVED" ||
      !restaurant.isActive
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Restaurant account is not active or approved",
      });
    }

    // =====================================
    // DATE FILTER
    // =====================================

    const { startDate, endDate } = req.query;

    const matchStage = {
      restaurant: restaurant._id,
    };

    if (startDate || endDate) {
      matchStage.createdAt = {};

      if (startDate) {
        const start = new Date(startDate);

        if (isNaN(start.getTime())) {
          return res.status(400).json({
            success: false,
            message: "Invalid start date",
          });
        }

        start.setHours(0, 0, 0, 0);

        matchStage.createdAt.$gte = start;
      }

      if (endDate) {
        const end = new Date(endDate);

        if (isNaN(end.getTime())) {
          return res.status(400).json({
            success: false,
            message: "Invalid end date",
          });
        }

        end.setHours(23, 59, 59, 999);

        matchStage.createdAt.$lte = end;
      }
    }

    // =====================================
    // RESTAURANT REPORT
    // =====================================

    const report = await Order.aggregate([
      {
        $match: matchStage,
      },

      {
        $group: {
          _id: null,

          // Total orders
          totalOrders: {
            $sum: 1,
          },

          // Delivered orders
          completedOrders: {
            $sum: {
              $cond: [
                {
                  $eq: [
                    "$orderStatus",
                    "DELIVERED",
                  ],
                },
                1,
                0,
              ],
            },
          },

          // Cancelled orders
          cancelledOrders: {
            $sum: {
              $cond: [
                {
                  $eq: [
                    "$orderStatus",
                    "CANCELLED",
                  ],
                },
                1,
                0,
              ],
            },
          },

          // Food sales
          foodSales: {
            $sum: "$subtotal",
          },

          // Discount
          discount: {
            $sum: "$discountAmount",
          },

          // Delivery charges
          deliveryCharges: {
            $sum: "$deliveryFee",
          },

          // Platform charges
          platformCharges: {
            $sum: "$platformCharge",
          },

          // Total amount collected from customers
          customerCollection: {
            $sum: "$totalAmount",
          },

          // Restaurant's actual sales
          // from delivered orders
          restaurantSales: {
            $sum: {
              $cond: [
                {
                  $eq: [
                    "$orderStatus",
                    "DELIVERED",
                  ],
                },
                {
                  $max: [
                    {
                      $subtract: [
                        "$subtotal",
                        "$discountAmount",
                      ],
                    },
                    0,
                  ],
                },
                0,
              ],
            },
          },
        },
      },

      {
        $project: {
          _id: 0,

          totalOrders: 1,
          completedOrders: 1,
          cancelledOrders: 1,

          foodSales: 1,
          discount: 1,

          deliveryCharges: 1,
          platformCharges: 1,

          customerCollection: 1,
          restaurantSales: 1,
        },
      },
    ]);

    // =====================================
    // EMPTY REPORT
    // =====================================

    const summary = report[0] || {
      totalOrders: 0,
      completedOrders: 0,
      cancelledOrders: 0,

      foodSales: 0,
      discount: 0,

      deliveryCharges: 0,
      platformCharges: 0,

      customerCollection: 0,
      restaurantSales: 0,
    };

    // =====================================
    // RESPONSE
    // =====================================

    return res.status(200).json({
      success: true,

      message:
        "My restaurant report fetched successfully",

      restaurant: {
        id: restaurant._id,
        name: restaurant.name,
      },

      filters: {
        startDate: startDate || null,
        endDate: endDate || null,
      },

      summary,
    });
  } catch (error) {
    console.error(
      "My Restaurant Report Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Error in My Restaurant Report API",
      error: error.message,
    });
  }
};

// ===============================
// EXPORT
// ===============================

module.exports = {
  createOrderController,
  getUserOrdersController,
  getSingleOrderController,
  getRestaurantOrdersController,
  getMyRestaurantReportController,
  getAllOrdersController,
  getRestaurantReportsController,
  updateOrderStatusController,
  assignDeliveryPartnerController,
  cancelOrderController,
  updatePaymentStatusController,
};
