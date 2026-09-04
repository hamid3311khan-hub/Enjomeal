const mongoose = require("mongoose");

const Ticket = require("../models/ticketModel");

// =====================================================
// CREATE SUPPORT TICKET
// CUSTOMER ONLY
// =====================================================

const createTicketController = async (req, res) => {
  try {
    const customerId = req.user.id || req.user._id;

    const { subject, message, category, description } = req.body;

    // Frontend kabhi "description" bhejta hai, kabhi "message"
    const finalMessage = (message || description || "").toString().trim();
    const finalSubject = (subject || "").toString().trim();

    if (!finalSubject || !finalMessage) {
      return res.status(400).json({
        success: false,
        message: "Subject and message are required",
      });
    }

    // Category ko Model ke enum se match karwana
    let finalCategory = "OTHER";
    if (category) {
      const c = category.toString().toUpperCase().trim();
      if (c.includes("ORDER")) finalCategory = "ORDER ISSUE";
      else if (c.includes("PAYMENT")) finalCategory = "PAYMENT";
      else if (c.includes("DELIVERY")) finalCategory = "DELIVERY";
      else if (c.includes("REFUND")) finalCategory = "REFUND";
      else if (c.includes("ACCOUNT")) finalCategory = "ACCOUNT";
      else if (["ORDER ISSUE", "PAYMENT", "DELIVERY", "REFUND", "ACCOUNT", "OTHER"].includes(c)) {
        finalCategory = c;
      }
    }

    const ticket = await Ticket.create({
      customer: customerId,
      subject: finalSubject,
      message: finalMessage,
      category: finalCategory,
    });

    await ticket.populate("customer", "name email");

    return res.status(201).json({
      success: true,
      message: "Support ticket created successfully",
      ticketNumber: ticket.ticketNumber,
      ticket,
    });
  } catch (error) {
    console.error("Create Ticket Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to create support ticket",
      error: error.message,
    });
  }
};

// =====================================================
// GET MY TICKETS
// CUSTOMER ONLY
// =====================================================

const getMyTicketsController = async (req, res) => {
  try {
    const customerId = req.user.id || req.user._id;

    const tickets = await Ticket.find({
      customer: customerId,
    })
      .sort({
        createdAt: -1,
      })
      .populate("repliedBy", "name email");

    return res.status(200).json({
      success: true,
      totalTickets: tickets.length,
      tickets,
    });
  } catch (error) {
    console.error("Get My Tickets Error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to fetch support tickets",
    });
  }
};

// =====================================================
// GET SINGLE TICKET
// CUSTOMER ONLY
// =====================================================

const getSingleTicketController = async (req, res) => {
  try {
    const { ticketId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(ticketId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ticket ID",
      });
    }

    const ticket = await Ticket.findOne({
      _id: ticketId,
      customer: req.user.id || req.user._id,
    })
      .populate("customer", "name email")
      .populate("repliedBy", "name email");

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    return res.status(200).json({
      success: true,
      ticket,
    });
  } catch (error) {
    console.error("Get Ticket Error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to fetch support ticket",
    });
  }
};

// =====================================================
// GET ALL TICKETS
// ADMIN ONLY
// =====================================================

const getAllTicketsController = async (req, res) => {
  try {
    const tickets = await Ticket.find()
      .sort({
        createdAt: -1,
      })
      .populate("customer", "name email")
      .populate("repliedBy", "name email");

    return res.status(200).json({
      success: true,
      totalTickets: tickets.length,
      tickets,
    });
  } catch (error) {
    console.error("Get All Tickets Error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to fetch support tickets",
    });
  }
};

// =====================================================
// UPDATE TICKET
// ADMIN ONLY
// =====================================================

const updateTicketController = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { status, adminReply } = req.body;

    if (!mongoose.Types.ObjectId.isValid(ticketId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ticket ID",
      });
    }

    const ticket = await Ticket.findById(ticketId);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    if (status !== undefined) {
      const allowedStatuses = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"];
      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid ticket status",
        });
      }
      ticket.status = status;
    }

    if (adminReply !== undefined && typeof adminReply === "string" && adminReply.trim()) {
      ticket.adminReply = adminReply.trim();
      ticket.repliedBy = req.user.id || req.user._id;
      ticket.repliedAt = new Date();
    }

    await ticket.save();
    await ticket.populate("customer", "name email");
    await ticket.populate("repliedBy", "name email");

    return res.status(200).json({
      success: true,
      message: "Ticket updated successfully",
      ticket,
    });
  } catch (error) {
    console.error("Update Ticket Error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to update support ticket",
    });
  }
};

// =====================================================
// EXPORT
// =====================================================

module.exports = {
  createTicketController,
  getMyTicketsController,
  getSingleTicketController,
  getAllTicketsController,
  updateTicketController,
};
