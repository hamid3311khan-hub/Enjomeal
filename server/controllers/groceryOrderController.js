const mongoose = require("mongoose");
const GroceryOrder = require("../models/groceryOrderModel");
const GroceryCart = require("../models/groceryCartModel");
const GroceryProduct = require("../models/groceryProductModel");
const Address = require("../models/addressModel");
const Settings = require("../models/settingsModel");
const Coupon = require("../models/couponModel");
const CouponUsage = require("../models/couponUsageModel");

const roundMoney = (value) =>
  Math.round((Number(value) + Number.EPSILON) * 100) / 100;

const makeOrderNumber = () =>
  "GR" + Date.now().toString(36).toUpperCase() +
  Math.random().toString(36).slice(2, 7).toUpperCase();

const fail = (res, status, message) =>
  res.status(status).json({ success: false, message });

const checkoutError = (status, message) => {
  const error = new Error(message);
  error.statusCode = status;
  return error;
};

exports.createGroceryOrder = async (req, res) => {
  let session;
  let checkoutKey = "";

  try {
    const userId = req.user.id;
    const { addressId, paymentMethod = "COD" } = req.body || {};
    const couponCode = String(req.body?.couponCode || "").trim().toUpperCase();
    checkoutKey = String(req.get("Idempotency-Key") || "").trim();

    if (!/^[a-zA-Z0-9_-]{8,100}$/.test(checkoutKey)) {
      return fail(res, 400, "A valid checkout idempotency key is required");
    }

    // A retry with the same customer/key must return the original order.
    const existingOrder = await GroceryOrder.findOne({
      user: userId,
      checkoutKey,
    });

    if (existingOrder) {
      return res.status(200).json({
        success: true,
        message: "Grocery order already placed",
        order: existingOrder,
      });
    }

    if (!mongoose.isValidObjectId(addressId)) {
      return fail(res, 400, "Please select a valid saved delivery address");
    }

    const selectedPayment = String(paymentMethod).toUpperCase();
    if (!["COD", "QR"].includes(selectedPayment)) {
      return fail(res, 400, "Payment method must be COD or QR");
    }

    session = await mongoose.startSession();
    let placedOrder = null;

    await session.withTransaction(async () => {
      const address = await Address.findOne({
        _id: addressId,
        user: userId,
      }).session(session);

      if (!address) {
        throw checkoutError(404, "Saved address not found for this customer");
      }

      const cart = await GroceryCart.findOne({ user: userId }).session(session);

      if (!cart || !Array.isArray(cart.items) || cart.items.length === 0) {
        throw checkoutError(400, "Your grocery cart is empty");
      }

      const orderItems = [];
      let subtotal = 0;

      for (const cartItem of cart.items) {
        const productId =
          cartItem.product && cartItem.product._id
            ? cartItem.product._id
            : cartItem.product;

        if (!mongoose.isValidObjectId(productId)) {
          throw checkoutError(
            400,
            "A cart item has an invalid product reference. Please update your cart"
          );
        }

        const quantity = Number(cartItem.quantity);

        if (!Number.isInteger(quantity) || quantity < 1 || quantity > 100) {
          throw checkoutError(400, "A cart item has an invalid quantity");
        }

        // Reserve stock atomically. Concurrent checkouts cannot reserve
        // more than the quantity currently available.
        const product = await GroceryProduct.findOneAndUpdate(
          {
            _id: productId,
            isActive: true,
            isAvailable: true,
            stockQuantity: { $gte: quantity },
          },
          { $inc: { stockQuantity: -quantity } },
          { new: false, session }
        );

        if (!product) {
          const current = await GroceryProduct.findById(productId)
            .session(session);

          if (!current || !current.isActive || !current.isAvailable) {
            throw checkoutError(
              409,
              "A grocery product is no longer available. Please update your cart"
            );
          }

          throw checkoutError(
            409,
            current.name + ": insufficient stock. Available quantity: " +
              current.stockQuantity
          );
        }

        const price = roundMoney(product.price);
        const itemTotal = roundMoney(price * quantity);
        subtotal = roundMoney(subtotal + itemTotal);

        orderItems.push({
          product: product._id,
          productName: product.name,
          image: product.image || "",
          unit: product.unit,
          quantity,
          price,
          itemTotal,
        });
      }

      let coupon = null;
      let discountAmount = 0;
      let eligibleSubtotal = 0;

      if (couponCode) {
        if (couponCode.length > 50) {
          throw checkoutError(400, "Invalid coupon code");
        }

        coupon = await Coupon.findOne({
          code: couponCode,
        }).session(session);

        if (!coupon || !coupon.isActive) {
          throw checkoutError(400, "Coupon is invalid or inactive");
        }

        const now = new Date();
        if (new Date(coupon.expiryDate) < now) {
          throw checkoutError(400, "Coupon has expired");
        }

        if (coupon.scope === "FOOD") {
          throw checkoutError(400, "This coupon is not valid for Grocery");
        }

        const hasFoodRestrictions =
          (Array.isArray(coupon.restaurantIds) && coupon.restaurantIds.length > 0) ||
          (Array.isArray(coupon.foodIds) && coupon.foodIds.length > 0);
        const hasGroceryRestrictions =
          Array.isArray(coupon.groceryProductIds) &&
          coupon.groceryProductIds.length > 0;

        if (coupon.scope === "BOTH" && hasFoodRestrictions && !hasGroceryRestrictions) {
          throw checkoutError(400, "This coupon is restricted to selected food items or restaurants");
        }

        if (
          coupon.usageLimit != null &&
          Number(coupon.usedCount || 0) >= Number(coupon.usageLimit)
        ) {
          throw checkoutError(400, "Coupon usage limit has been reached");
        }

        const priorUsage = await CouponUsage.findOne({
          user: userId,
          coupon: coupon._id,
        }).session(session);

        if (priorUsage) {
          throw checkoutError(400, "You have already used this coupon");
        }

        const eligibleProductIds = Array.isArray(coupon.groceryProductIds)
          ? coupon.groceryProductIds.map((id) => String(id))
          : [];

        for (const item of orderItems) {
          if (
            eligibleProductIds.length === 0 ||
            eligibleProductIds.includes(String(item.product))
          ) {
            eligibleSubtotal = roundMoney(
              eligibleSubtotal + Number(item.itemTotal || 0)
            );
          }
        }

        if (eligibleSubtotal <= 0) {
          throw checkoutError(
            400,
            "This coupon is not applicable to the products in your cart"
          );
        }

        if (eligibleSubtotal < Number(coupon.minimumOrderAmount || 0)) {
          throw checkoutError(
            400,
            "Eligible grocery items do not meet the coupon minimum order amount"
          );
        }

        if (coupon.discountType === "PERCENTAGE") {
          discountAmount = roundMoney(
            eligibleSubtotal * Number(coupon.discountValue || 0) / 100
          );
        } else if (coupon.discountType === "FIXED") {
          discountAmount = roundMoney(Number(coupon.discountValue || 0));
        } else {
          throw checkoutError(400, "Coupon discount type is invalid");
        }

        if (coupon.maximumDiscount != null) {
          discountAmount = Math.min(
            discountAmount,
            Number(coupon.maximumDiscount)
          );
        }

        discountAmount = roundMoney(
          Math.max(0, Math.min(discountAmount, eligibleSubtotal))
        );
      }

      const settings = await Settings.findOne().session(session);
      const deliveryFee =
        settings && settings.freeDelivery
          ? 0
          : roundMoney(settings ? settings.deliveryFee || 0 : 0);
      const platformCharge = roundMoney(
        settings ? settings.platformCharge || 0 : 0
      );

      // No GST rate is configured. Do not assume a rate.
      const gstAmount = 0;
      const totalAmount = roundMoney(
        Math.max(
          0,
          subtotal + deliveryFee + platformCharge + gstAmount - discountAmount
        )
      );

      const [order] = await GroceryOrder.create(
        [{
          orderNumber: makeOrderNumber(),
          user: userId,
          checkoutKey,
          items: orderItems,
          subtotal,
          deliveryFee,
          platformCharge,
          gstAmount,
          discountAmount,
          ...(coupon ? { couponCode: coupon.code } : {}),
          totalAmount,
          deliveryAddress: {
            addressId: address._id,
            contactName: address.name,
            contactPhone: address.phone,
            address: address.address,
            city: address.city,
            state: address.state,
            pincode: address.pincode,
            landmark: address.landmark || "",
          },
          paymentMethod: selectedPayment,
          paymentStatus: "PENDING",
          orderStatus: "PLACED",
          stockReserved: true,
          stockRestoredAt: null,
        }],
        { session }
      );

      if (coupon) {
        await CouponUsage.create(
          [{
            coupon: coupon._id,
            user: userId,
            groceryOrder: order._id,
          }],
          { session }
        );

        const updatedCoupon = await Coupon.findOneAndUpdate(
          {
            _id: coupon._id,
            isActive: true,
            ...(coupon.usageLimit != null
              ? { usedCount: { $lt: Number(coupon.usageLimit) } }
              : {}),
          },
          { $inc: { usedCount: 1 } },
          { new: true, session }
        );

        if (!updatedCoupon) {
          throw checkoutError(409, "Coupon usage limit has just been reached. Please retry without this coupon");
        }
      }

      // Cart clear is part of the same transaction as stock reservation,
      // coupon usage and order creation. Any failure rolls all changes back.
      cart.items = [];
      cart.totalAmount = 0;
      await cart.save({ session });

      placedOrder = order;
    });

    if (!placedOrder) {
      return fail(res, 500, "Unable to confirm grocery order");
    }

    // Notify admins after the grocery order transaction commits.
    // Notification failures must not turn a successful checkout into a failure.
    try {
      const User = mongoose.model("User");
      const Notification = mongoose.model("Notification");
      const admins = await User.find({
        role: "admin",
        isActive: true,
      }).select("_id");

      const io = req.app.get("io");

      for (const admin of admins) {
        const notification = await Notification.create({
          user: admin._id,
          title: "New Grocery Order Received",
          message: `A new grocery order has been placed. Order ID: ${placedOrder.orderNumber}`,
          type: "GROCERY_ORDER_PLACED",
          groceryOrder: placedOrder._id,
          isRead: false,
        });

        if (io) {
          io.to(`user:${admin._id.toString()}`).emit("notification:new", {
            success: true,
            notification,
          });

          io.to(`user:${admin._id.toString()}`).emit("grocery:order:new", {
            success: true,
            orderId: placedOrder._id.toString(),
            orderNumber: placedOrder.orderNumber,
            orderStatus: placedOrder.orderStatus,
            createdAt: placedOrder.createdAt,
          });
        }
      }
    } catch (notificationError) {
      console.error("Grocery admin notification error:", notificationError.message);
    }

    return res.status(201).json({
      success: true,
      message: "Grocery order placed successfully",
      order: placedOrder,
    });
  } catch (error) {
    console.error("Create grocery order error:", error);

    if (error && error.statusCode) {
      return fail(res, error.statusCode, error.message);
    }

    if (error && error.code === 11000) {
      // A concurrent request may have committed the same checkout key.
      if (checkoutKey) {
        const priorOrder = await GroceryOrder.findOne({
          user: req.user.id,
          checkoutKey,
        }).catch(() => null);

        if (priorOrder) {
          return res.status(200).json({
            success: true,
            message: "Grocery order already placed",
            order: priorOrder,
          });
        }
      }

      return fail(res, 409, "Order number conflict. Please retry");
    }

    if (error && error.name === "ValidationError") {
      return fail(res, 400, error.message);
    }

    // Do not silently fall back to a non-transactional checkout.
    if (
      error &&
      /transaction numbers are only allowed|replica set|does not support transactions|transaction.*not supported/i.test(
        error.message || ""
      )
    ) {
      return fail(
        res,
        503,
        "Safe grocery checkout requires MongoDB transaction support. No non-transactional checkout was attempted."
      );
    }

    return fail(res, 500, "Unable to place grocery order right now");
  } finally {
    if (session) {
      await session.endSession().catch(() => {});
    }
  }
};

exports.cancelGroceryOrder = async (req, res) => {
  let session;
  try {
    const { orderId } = req.params;
    if (!mongoose.isValidObjectId(orderId)) return fail(res, 400, "Invalid grocery order ID");
    session = await mongoose.startSession();
    let resultOrder = null;
    let alreadyCancelled = false;
    await session.withTransaction(async () => {
      const order = await GroceryOrder.findOne({ _id: orderId, user: req.user.id }).session(session);
      if (!order) throw checkoutError(404, "Grocery order not found");
      if (order.orderStatus === "CANCELLED") { alreadyCancelled = true; resultOrder = order; return; }
      if (order.orderStatus !== "PLACED") throw checkoutError(409, "This order can no longer be cancelled online");
      if (order.stockReserved && !order.stockRestoredAt) {
        for (const item of order.items) {
          const restored = await GroceryProduct.updateOne({ _id: item.product }, { $inc: { stockQuantity: item.quantity } }, { session });
          if (restored.matchedCount !== 1) throw checkoutError(409, "Product missing; cancellation was not completed");
        }
        order.stockReserved = false;
        order.stockRestoredAt = new Date();
      }
      order.orderStatus = "CANCELLED";
      order.cancelledAt = new Date();
      order.cancelledBy = req.user.id;
      order.cancellationReason = typeof req.body?.reason === "string" ? req.body.reason.trim().slice(0, 500) : "Cancelled by customer";
      await order.save({ session });
      resultOrder = order;
    });
    return res.status(200).json({ success: true, message: alreadyCancelled ? "Order was already cancelled" : "Grocery order cancelled successfully", order: resultOrder });
  } catch (error) {
    console.error("Cancel grocery order error:", error);
    if (error && error.statusCode) return fail(res, error.statusCode, error.message);
    if (/transaction numbers are only allowed|replica set|does not support transactions|transaction.*not supported/i.test(error.message || "")) return fail(res, 503, "Safe cancellation requires MongoDB transaction support.");
    return fail(res, 500, "Unable to cancel grocery order right now");
  } finally {
    if (session) await session.endSession().catch(() => {});
  }
};

exports.getMyGroceryOrders = async (req, res) => {
  try {
    const orders = await GroceryOrder.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .limit(100)
      .populate("deliveryPartner", "name phone");

    return res.status(200).json({
      success: true,
      total: orders.length,
      orders,
    });
  } catch (error) {
    console.error("Get my grocery orders error:", error);
    return fail(res, 500, "Unable to fetch grocery orders");
  }
};

exports.getMyGroceryOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;

    if (!mongoose.isValidObjectId(orderId)) {
      return fail(res, 400, "Invalid grocery order ID");
    }

    const order = await GroceryOrder.findOne({
      _id: orderId,
      user: req.user.id,
    }).populate("deliveryPartner", "name phone");

    if (!order) {
      return fail(res, 404, "Grocery order not found");
    }

    return res.status(200).json({ success: true, order });
  } catch (error) {
    console.error("Get grocery order error:", error);
    return fail(res, 500, "Unable to fetch grocery order");
  }
};


// ADMIN: LIST GROCERY ORDERS
exports.getAllGroceryOrdersAdmin = async (req, res) => {
  try {
    const orders = await GroceryOrder.find({})
      .sort({ createdAt: -1 })
      .limit(500)
      .populate("user", "name phone email")
      .populate("deliveryPartner", "name phone");

    return res.status(200).json({
      success: true,
      total: orders.length,
      orders,
    });
  } catch (error) {
    console.error("Admin grocery orders error:", error);
    return fail(res, 500, "Unable to fetch grocery orders");
  }
};

// ADMIN: UPDATE GROCERY ORDER STATUS
// Cancellation is intentionally excluded because it must restore reserved stock safely.
exports.updateGroceryOrderStatusAdmin = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { orderStatus } = req.body || {};

    if (!mongoose.isValidObjectId(orderId)) {
      return fail(res, 400, "Invalid grocery order ID");
    }

    const allowedStatuses = [
      "CONFIRMED",
      "PACKING",
      "READY_FOR_PICKUP",
      "OUT_FOR_DELIVERY",
      "DELIVERED",
    ];

    if (!allowedStatuses.includes(orderStatus)) {
      return fail(res, 400, "Invalid grocery order status");
    }

    const order = await GroceryOrder.findById(orderId);

    if (!order) {
      return fail(res, 404, "Grocery order not found");
    }

    if (order.orderStatus === "CANCELLED") {
      return fail(res, 409, "Cancelled orders cannot be updated");
    }

    if (order.orderStatus === "DELIVERED") {
      return fail(res, 409, "Delivered orders cannot be updated");
    }

    const allowedNextStatuses = {
      PLACED: ["CONFIRMED"],
      CONFIRMED: ["PACKING"],
      PACKING: ["READY_FOR_PICKUP"],
      READY_FOR_PICKUP: ["OUT_FOR_DELIVERY"],
      OUT_FOR_DELIVERY: ["DELIVERED"],
    };

    if (!(allowedNextStatuses[order.orderStatus] || []).includes(orderStatus)) {
      return fail(
        res,
        409,
        "Invalid status transition from " + order.orderStatus + " to " + orderStatus
      );
    }

    order.orderStatus = orderStatus;

    if (orderStatus === "DELIVERED") {
      order.deliveredAt = new Date();
    }

    await order.save();

    await order.populate("user", "name phone email");
    await order.populate("deliveryPartner", "name phone");

    return res.status(200).json({
      success: true,
      message: "Grocery order status updated",
      order,
    });
  } catch (error) {
    console.error("Admin grocery order status update error:", error);
    return fail(res, 500, "Unable to update grocery order status");
  }
};
