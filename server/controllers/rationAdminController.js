const mongoose = require("mongoose");
const RationRequest = require("../models/rationRequestModel");

exports.getAllRationRequestsAdmin = async (req, res, next) => {
  try {
    const requests = await RationRequest.find({})
      .sort({ createdAt: -1 })
      .limit(500)
      .populate("user", "name phone email")
      .populate("address")
      .lean();

    return res.status(200).json({
      success: true,
      total: requests.length,
      requests,
    });
  } catch (error) {
    return next(error);
  }
};

exports.updateRationQuotationAdmin = async (req, res, next) => {
  try {
    const { requestId } = req.params;
    const { items, adminNote } = req.body || {};

    if (!mongoose.isValidObjectId(requestId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ration request ID.",
      });
    }

    if (!Array.isArray(items) || items.length < 1 || items.length > 50) {
      return res.status(400).json({
        success: false,
        message: "Provide valid quotation items.",
      });
    }

    const request = await RationRequest.findById(requestId);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Ration request not found.",
      });
    }

    if (["ORDERED", "CANCELLED"].includes(request.requestStatus)) {
      return res.status(409).json({
        success: false,
        message: "This request can no longer be quoted.",
      });
    }

    if (items.length !== request.items.length) {
      return res.status(400).json({
        success: false,
        message: "Submit a quotation decision for every requested item.",
      });
    }

    const seen = new Set();

    for (const update of items) {
      if (!update || !mongoose.isValidObjectId(update.itemId)) {
        return res.status(400).json({
          success: false,
          message: "Every quotation item needs a valid itemId.",
        });
      }

      const itemId = String(update.itemId);

      if (seen.has(itemId)) {
        return res.status(400).json({
          success: false,
          message: "Duplicate quotation item.",
        });
      }
      seen.add(itemId);

      const item = request.items.id(itemId);

      if (!item) {
        return res.status(400).json({
          success: false,
          message: "Quotation contains an item not in this request.",
        });
      }

      if (!["AVAILABLE", "UNAVAILABLE"].includes(update.availability)) {
        return res.status(400).json({
          success: false,
          message: "Availability must be AVAILABLE or UNAVAILABLE.",
        });
      }

      if (update.availability === "AVAILABLE") {
        const price = Number(update.quotedPrice);

        if (!Number.isFinite(price) || price < 0 || price > 10000000) {
          return res.status(400).json({
            success: false,
            message: "Available items need a valid non-negative unit price.",
          });
        }

        item.quotedPrice = Math.round(price * 100) / 100;
      } else {
        item.quotedPrice = null;
      }

      item.availability = update.availability;
      item.adminNote =
        typeof update.adminNote === "string"
          ? update.adminNote.trim().slice(0, 500)
          : "";
      item.customerDecision = "PENDING";
    }


    if (seen.size !== request.items.length) {
      return res.status(400).json({
        success: false,
        message: "Quotation must include every requested item exactly once.",
      });
    }

    // A new quotation invalidates every previous customer decision.
    for (const item of request.items) {
      item.customerDecision = "PENDING";
    }

    const total = request.items.reduce((sum, item) => {
      if (item.availability !== "AVAILABLE") return sum;
      return sum + item.quantity * Number(item.quotedPrice || 0);
    }, 0);

    request.quotationTotal = Math.round(total * 100) / 100;
    request.approvedTotal = null;
    request.quotationVersion += 1;
    request.quotationUpdatedAt = new Date();
    request.customerApprovedAt = null;
    request.customerApprovedVersion = null;
    request.requestStatus = "QUOTATION_READY";

    if (typeof adminNote === "string") {
      request.adminNote = adminNote.trim().slice(0, 1000);
    }

    await request.save();

    return res.status(200).json({
      success: true,
      message: "Quotation updated. Customer approval is required.",
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
