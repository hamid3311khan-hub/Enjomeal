const mongoose = require("mongoose");
const RationRequest = require("../models/rationRequestModel");
const Address = require("../models/addressModel");

const ALLOWED_UNITS = [
  "kg", "g", "litre", "ml", "piece",
  "pack", "dozen", "bottle", "box",
];

const cleanText = (value, maxLength) =>
  typeof value === "string"
    ? value.trim().slice(0, maxLength)
    : "";

const roundMoney = (value) =>
  Math.round((Number(value) + Number.EPSILON) * 100) / 100;

exports.createRationRequest = async (req, res, next) => {
  try {
    const { items, addressId, customerNote } = req.body;

    if (!Array.isArray(items) || items.length < 1 || items.length > 50) {
      return res.status(400).json({
        success: false,
        message: "Please provide between 1 and 50 ration items.",
      });
    }

    const normalizedItems = [];

    for (const item of items) {
      if (!item || typeof item !== "object") {
        return res.status(400).json({
          success: false,
          message: "Each ration item must be an object.",
        });
      }

      const itemName = cleanText(item.itemName, 150);
      const quantity = Number(item.quantity);
      const unit = cleanText(item.unit, 20);
      const image = cleanText(item.image, 2048);

      if (!itemName || !Number.isFinite(quantity) ||
          quantity < 0.001 || quantity > 100000 ||
          !ALLOWED_UNITS.includes(unit)) {
        return res.status(400).json({
          success: false,
          message: "Each item needs a valid name, quantity and unit.",
        });
      }

      if (image && (!/^https:\/\/res\.cloudinary\.com\//i.test(image))) {
        return res.status(400).json({
          success: false,
          message: "Item photos must use an approved Cloudinary HTTPS URL.",
        });
      }

      normalizedItems.push({
        itemName,
        quantity,
        unit,
        brand: cleanText(item.brand, 100),
        description: cleanText(item.description, 1000),
        image,
        imagePublicId: "",
      });
    }

    let address = null;

    if (addressId) {
      if (!mongoose.Types.ObjectId.isValid(addressId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid delivery address.",
        });
      }

      address = await Address.findOne({
        _id: addressId,
        user: req.user.id,
      }).select("_id");

      if (!address) {
        return res.status(404).json({
          success: false,
          message: "Delivery address not found.",
        });
      }
    }

    const request = new RationRequest({
      user: req.user.id,
      items: normalizedItems,
      address: address ? address._id : null,
      customerNote: cleanText(customerNote, 1000),
    });

    request.requestNumber = `RR-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${request._id.toString().slice(-6).toUpperCase()}`;
    await request.save();

    return res.status(201).json({
      success: true,
      message: "Ration request submitted successfully.",
      request,
    });
  } catch (error) {
    return next(error);
  }
};

exports.getMyRationRequests = async (req, res, next) => {
  try {
    const requests = await RationRequest.find({
      user: req.user.id,
    })
      .sort({ createdAt: -1 })
      .populate("address")
      .lean();

    return res.status(200).json({
      success: true,
      count: requests.length,
      requests,
    });
  } catch (error) {
    return next(error);
  }
};

exports.getMyRationRequestById = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.requestId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ration request ID.",
      });
    }

    const request = await RationRequest.findOne({
      _id: req.params.requestId,
      user: req.user.id,
    }).populate("address");

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Ration request not found.",
      });
    }

    return res.status(200).json({
      success: true,
      request,
    });
  } catch (error) {
    return next(error);
  }
};


exports.submitRationDecisions = async (req, res, next) => {
  try {
    const { quotationVersion, decisions, approveQuotation } = req.body;

    if (!Number.isInteger(quotationVersion) || !Array.isArray(decisions)) {
      return res.status(400).json({
        success: false,
        message: "A valid quotation version and item decisions are required.",
      });
    }

    if (typeof approveQuotation !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "Please specify whether to approve the quotation.",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.requestId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ration request ID.",
      });
    }

    const request = await RationRequest.findOne({
      _id: req.params.requestId,
      user: req.user.id,
    });

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Ration request not found.",
      });
    }

    if (request.requestStatus !== "QUOTATION_READY") {
      return res.status(409).json({
        success: false,
        message: "This request does not have an editable quotation.",
      });
    }

    if (request.quotationVersion !== quotationVersion) {
      return res.status(409).json({
        success: false,
        message: "Quotation changed. Refresh and review the latest prices.",
        currentQuotationVersion: request.quotationVersion,
      });
    }

    if (decisions.length !== request.items.length) {
      return res.status(400).json({
        success: false,
        message: "Please submit a decision for every requested item.",
      });
    }

    const decisionMap = new Map();

    for (const entry of decisions) {
      if (!entry || !mongoose.Types.ObjectId.isValid(entry.itemId) ||
          !["ACCEPTED", "REMOVED", "DEFERRED"].includes(entry.decision)) {
        return res.status(400).json({
          success: false,
          message: "An item decision is invalid.",
        });
      }

      const key = String(entry.itemId);
      if (decisionMap.has(key)) {
        return res.status(400).json({
          success: false,
          message: "Duplicate item decisions are not allowed.",
        });
      }
      decisionMap.set(key, entry.decision);
    }

    for (const item of request.items) {
      const decision = decisionMap.get(String(item._id));

      if (!decision) {
        return res.status(400).json({
          success: false,
          message: "A decision is missing for an item.",
        });
      }

      if (item.availability === "PENDING") {
        return res.status(409).json({
          success: false,
          message: "Please wait until the admin quotes every item.",
        });
      }

      if (decision === "ACCEPTED" &&
          (item.availability !== "AVAILABLE" ||
           !Number.isFinite(item.quotedPrice) ||
           item.quotedPrice < 0)) {
        return res.status(400).json({
          success: false,
          message: "Only available items with a quoted price can be accepted.",
        });
      }
    }

    if (approveQuotation) {
      const hasDeferred = request.items.some(
        item => decisionMap.get(String(item._id)) === "DEFERRED"
      );
      const acceptedCount = request.items.filter(
        item => decisionMap.get(String(item._id)) === "ACCEPTED"
      ).length;

      if (hasDeferred || acceptedCount === 0) {
        return res.status(400).json({
          success: false,
          message: "To approve, resolve deferred items and accept at least one item.",
        });
      }
    }

    for (const item of request.items) {
      item.customerDecision = decisionMap.get(String(item._id));
    }

    if (approveQuotation) {
      const approvedTotal = request.items.reduce((sum, item) => {
        if (decisionMap.get(String(item._id)) !== "ACCEPTED") return sum;
        const itemTotal = roundMoney(
          Number(item.quantity) * Number(item.quotedPrice)
        );
        return roundMoney(sum + itemTotal);
      }, 0);

      request.approvedTotal = roundMoney(approvedTotal);
      request.requestStatus = "APPROVED";
      request.customerApprovedAt = new Date();
      request.customerApprovedVersion = request.quotationVersion;
    } else {
      request.approvedTotal = null;
      request.customerApprovedAt = null;
      request.customerApprovedVersion = null;
    }

    await request.save();

    return res.status(200).json({
      success: true,
      message: approveQuotation
        ? "Quotation approved. You can now proceed to checkout."
        : "Item decisions saved successfully.",
      request,
    });
  } catch (error) {
    if (error && error.name === "VersionError") {
      return res.status(409).json({
        success: false,
        message: "This ration request changed while you were saving. Refresh and review the latest details.",
      });
    }
    return next(error);
  }
};
