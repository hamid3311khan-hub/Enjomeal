const mongoose = require("mongoose");
const GroceryOrder = require("../models/groceryOrderModel");
const GroceryCart = require("../models/groceryCartModel");
const GroceryProduct = require("../models/groceryProductModel");
const Address = require("../models/addressModel");
const Settings = require("../models/settingsModel");

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

  try {
    const userId = req.user.id;
    const { addressId, paymentMethod = "COD" } = req.body || {};
    const checkoutKey = String(req.get("Idempotency-Key") || "").trim();

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
      const discountAmount = 0;
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

      // Cart clear is part of the same transaction as stock reservation
      // and order creation. A transaction failure rolls all three back.
      cart.items = [];
      cart.totalAmount = 0;
      await cart.save({ session });

      placedOrder = order;
    });

    if (!placedOrder) {
      return fail(res, 500, "Unable to confirm grocery order");
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
