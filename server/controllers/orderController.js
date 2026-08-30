const mongoose = require("mongoose");
const Order = require("../models/orderModel");
const Food = require("../models/foodModels");
const Cart = require("../models/cartModel");
const Restaurant = require("../models/restaurant");
const Delivery = require("../models/deliveryModel");
const Notification = require("../models/notificationModel");
const Settings = require("../models/settingsModel");
const Coupon = require("../models/couponModel");

// ===============================
// CREATE ORDER
// CUSTOMER ONLY
// ===============================
const createOrderController = async (req, res) => {
  try {
    const userId = req.user.id;

    const {
      restaurant,
      items,
      deliveryAddress,
      paymentMethod,
      couponcode
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
const discountAmount = 0;

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
// CALCULATE FINAL ORDER TOTAL
// ===============================

const totalAmount =
  Math.max(
    0,
    subtotal +
      deliveryFee -
      discountAmount
  );
    // ===============================
// COUPON VALIDATION
// ===============================

if (couponCode) {
  const coupon = await Coupon.findOne({
    code: couponCode.trim().toUpperCase(),
  });

  if (!coupon) {
    return res.status(400).json({
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
    subtotal <
    (coupon.minimumOrderAmount || 0)
  ) {
    return res.status(400).json({
      success: false,
      message:
        `Minimum order amount is ₹${coupon.minimumOrderAmount}`,
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

  if (coupon.discountType === "PERCENTAGE") {
    discountAmount =
      (subtotal * coupon.discountValue) / 100;
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

  // Discount can never exceed subtotal
  discountAmount = Math.min(
    discountAmount,
    subtotal
  );
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

const order =
  await Order.create({
    user: userId,
    restaurant,
    items: orderItems,

    subtotal,

    deliveryFee,

    discountAmount,

    platformCharge,

    totalAmount,

    deliveryAddress,

    paymentMethod:
      selectedPaymentMethod,

    paymentStatus: "PENDING",

    orderStatus: "PLACED",
  });


    // ===============================
    // CLEAR CART
    // ===============================

    await Cart.findOneAndUpdate(
      { user: userId },
      {
        $set: {
          items: [],
          totalAmount: 0,
          restaurant: null,
        },
      }
    );

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
    // RESPONSE
    // ===============================
    
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

    return res.status(500).json({
      success: false,
      message:
        "Error in Create Order API",
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
        .populate("deliveryPartner")
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
  await Notification.create({
    user: order.user,
    title: notificationData.title,
    message: notificationData.message,
    type: notificationData.type,
    order: order._id,
    isRead: false,
  });
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

// ===============================
// EXPORT
// ===============================

module.exports = {
  createOrderController,
  getUserOrdersController,
  getSingleOrderController,
  getRestaurantOrdersController,
  getAllOrdersController,
  updateOrderStatusController,
  assignDeliveryPartnerController,
  cancelOrderController,
  updatePaymentStatusController,
};
