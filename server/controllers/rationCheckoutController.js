const mongoose = require("mongoose");
const GroceryOrder = require("../models/groceryOrderModel");
const RationRequest = require("../models/rationRequestModel");
const Address = require("../models/addressModel");
const Settings = require("../models/settingsModel");

const roundMoney = (value) =>
  Math.round((Number(value) + Number.EPSILON) * 100) / 100;

const checkoutError = (status, message) => {
  const error = new Error(message);
  error.statusCode = status;
  return error;
};

const fail = (res, status, message) =>
  res.status(status).json({ success: false, message });

const makeOrderNumber = () =>
  "GR" + Date.now().toString(36).toUpperCase() +
  Math.random().toString(36).slice(2, 7).toUpperCase();

exports.checkoutApprovedRationRequest = async (req, res) => {
  let session;

  try {
    const userId = req.user.id;
    const requestId = req.params.requestId;
    const { addressId, paymentMethod = "COD", quotationVersion } = req.body || {};
    const checkoutKey = String(req.get("Idempotency-Key") || "").trim();

    if (!/^[a-zA-Z0-9_-]{8,100}$/.test(checkoutKey)) {
      return fail(res, 400, "A valid checkout idempotency key is required");
    }

    if (!mongoose.isValidObjectId(requestId)) {
      return fail(res, 400, "Invalid ration request ID");
    }

    if (!mongoose.isValidObjectId(addressId)) {
      return fail(res, 400, "Please select a valid saved delivery address");
    }

    if (!Number.isInteger(quotationVersion)) {
      return fail(res, 400, "A valid approved quotation version is required");
    }

    const selectedPayment = String(paymentMethod).toUpperCase();
    if (!["COD", "QR"].includes(selectedPayment)) {
      return fail(res, 400, "Payment method must be COD or QR");
    }

    const priorOrder = await GroceryOrder.findOne({
      user: userId,
      checkoutKey,
    });

    if (priorOrder) {
      if (
        priorOrder.orderType === "RATION" &&
        String(priorOrder.rationRequest) === String(requestId)
      ) {
        return res.status(200).json({
          success: true,
          message: "Ration order already placed",
          order: priorOrder,
        });
      }

      return fail(res, 409, "This checkout key has already been used");
    }

    const alreadyOrdered = await RationRequest.findOne({
      _id: requestId,
      user: userId,
      requestStatus: "ORDERED",
    });

    if (alreadyOrdered && alreadyOrdered.groceryOrder) {
      const existingRationOrder = await GroceryOrder.findOne({
        _id: alreadyOrdered.groceryOrder,
        user: userId,
        orderType: "RATION",
      });

      if (existingRationOrder) {
        return res.status(200).json({
          success: true,
          message: "Ration order already placed",
          order: existingRationOrder,
        });
      }
    }

    session = await mongoose.startSession();
    let placedOrder = null;

    await session.withTransaction(async () => {
      const request = await RationRequest.findOne({
        _id: requestId,
        user: userId,
      }).session(session);

      if (!request) {
        throw checkoutError(404, "Ration request not found");
      }

      if (request.requestStatus !== "APPROVED") {
        throw checkoutError(409, "Please approve the latest quotation before checkout");
      }

      if (
        request.quotationVersion !== quotationVersion ||
        request.customerApprovedVersion !== request.quotationVersion
      ) {
        throw checkoutError(409, "Quotation changed or approval is outdated. Review and approve it again");
      }

      if (!Number.isFinite(request.approvedTotal) || request.approvedTotal < 0) {
        throw checkoutError(409, "Approved quotation total is invalid");
      }

      const acceptedItems = request.items.filter(
        (item) => item.customerDecision === "ACCEPTED"
      );

      if (!acceptedItems.length) {
        throw checkoutError(400, "No accepted ration items are available for checkout");
      }

      if (request.items.some((item) => item.customerDecision === "DEFERRED" ||
          item.customerDecision === "PENDING")) {
        throw checkoutError(409, "Resolve every ration item before checkout");
      }

      let subtotal = 0;
      const orderItems = acceptedItems.map((item) => {
        const quantity = Number(item.quantity);
        const price = Number(item.quotedPrice);

        if (
          !Number.isFinite(quantity) || quantity < 0.001 || quantity > 100000 ||
          !Number.isFinite(price) || price < 0 ||
          item.availability !== "AVAILABLE"
        ) {
          throw checkoutError(409, "An accepted ration item has invalid availability, quantity or price");
        }

        const itemTotal = roundMoney(quantity * price);
        subtotal = roundMoney(subtotal + itemTotal);

        return {
          source: "RATION",
          productName: item.itemName,
          image: item.image || "",
          unit: item.unit,
          quantity,
          price,
          itemTotal,
        };
      });

      if (roundMoney(subtotal) !== roundMoney(request.approvedTotal)) {
        throw checkoutError(409, "Approved amount does not match the current quotation. Review and approve again");
      }

      const address = await Address.findOne({
        _id: addressId,
        user: userId,
      }).session(session);

      if (!address) {
        throw checkoutError(404, "Saved address not found for this customer");
      }

      const settings = await Settings.findOne().session(session);
      const deliveryFee = roundMoney(
        settings && settings.freeDelivery ? 0 : (settings?.deliveryFee || 0)
      );
      const platformCharge = roundMoney(settings?.platformCharge || 0);
      // GST stays zero until an explicit GST rate is configured.
      const gstAmount = 0;
      const totalAmount = roundMoney(
        subtotal + deliveryFee + platformCharge + gstAmount
      );

      const [order] = await GroceryOrder.create([{
        orderNumber: makeOrderNumber(),
        checkoutKey,
        user: userId,
        orderType: "RATION",
        rationRequest: request._id,
        items: orderItems,
        subtotal,
        deliveryFee,
        platformCharge,
        gstAmount,
        discountAmount: 0,
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
        stockReserved: false,
        stockRestoredAt: null,
      }], { session });

      request.requestStatus = "ORDERED";
      request.groceryOrder = order._id;
      await request.save({ session });

      placedOrder = order;
    });

    if (!placedOrder) {
      return fail(res, 500, "Unable to confirm ration order");
    }

    // Notify admins after transaction commit; notification failure must not
    // turn a committed order into a failed checkout response.
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
          title: "New Custom Ration Order",
          message: "A customer has checked out an approved ration request. Order ID: " + placedOrder.orderNumber,
          type: "GROCERY_ORDER_PLACED",
          groceryOrder: placedOrder._id,
          isRead: false,
        });

        if (io) {
          io.to("user:" + admin._id.toString()).emit("notification:new", {
            success: true,
            notification,
          });
          io.to("user:" + admin._id.toString()).emit("grocery:order:new", {
            success: true,
            orderId: placedOrder._id.toString(),
            orderNumber: placedOrder.orderNumber,
            orderStatus: placedOrder.orderStatus,
            createdAt: placedOrder.createdAt,
          });
        }
      }
    } catch (notificationError) {
      console.error("Ration order notification error:", notificationError.message);
    }

    return res.status(201).json({
      success: true,
      message: "Approved ration order placed successfully",
      order: placedOrder,
    });
  } catch (error) {
    console.error("Ration checkout error:", error);

    if (error && error.statusCode) {
      return fail(res, error.statusCode, error.message);
    }

    if (error && error.code === 11000) {
      const requestId = req.params.requestId;
      const checkoutKey = String(req.get("Idempotency-Key") || "").trim();

      let priorOrder = await GroceryOrder.findOne({
        user: req.user.id,
        checkoutKey,
      }).catch(() => null);

      if (
        !priorOrder ||
        priorOrder.orderType !== "RATION" ||
        String(priorOrder.rationRequest) !== String(requestId)
      ) {
        priorOrder = await GroceryOrder.findOne({
          user: req.user.id,
          orderType: "RATION",
          rationRequest: requestId,
        }).catch(() => null);
      }

      if (
        priorOrder &&
        priorOrder.orderType === "RATION" &&
        String(priorOrder.rationRequest) === String(requestId)
      ) {
        return res.status(200).json({
          success: true,
          message: "Ration order already placed",
          order: priorOrder,
        });
      }

      return fail(res, 409, "This request may already have an order. Refresh and check order history");
    }

    if (error && error.name === "VersionError") {
      return fail(res, 409, "Ration request changed during checkout. Refresh and review the latest quotation");
    }

    if (error && error.name === "ValidationError") {
      return fail(res, 400, error.message);
    }

    if (
      error &&
      /transaction numbers are only allowed|replica set|does not support transactions|transaction.*not supported/i.test(
        error.message || ""
      )
    ) {
      return fail(res, 503, "Safe ration checkout requires MongoDB transaction support. No non-transactional checkout was attempted.");
    }

    return fail(res, 500, "Unable to place ration order right now");
  } finally {
    if (session) {
      await session.endSession().catch(() => {});
    }
  }
};
