const mongoose = require("mongoose");

const Ticket = require(
  "../models/ticketModel"
);

// =====================================================
// CREATE SUPPORT TICKET
// CUSTOMER ONLY
// =====================================================

const createTicketController =
  async (req, res) => {
    try {
      const customerId = req.user.id;

      const {
        subject,
        message,
        category,
      } = req.body;

      if (
        !subject ||
        !subject.trim() ||
        !message ||
        !message.trim()
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Subject and message are required",
        });
      }

      const ticket = await Ticket.create({
        customer: customerId,

        subject: subject.trim(),

        message: message.trim(),

        category: category || "OTHER",
      });

      await ticket.populate(
        "customer",
        "name email"
      );

      return res.status(201).json({
        success: true,

        message:
          "Support ticket created successfully",

        ticketNumber:
          ticket.ticketNumber,

        ticket,
      });
    } catch (error) {
      console.error(
        "Create Ticket Error:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          "Unable to create support ticket",
      });
    }
  };

// =====================================================
// GET MY TICKETS
// CUSTOMER ONLY
// =====================================================

const getMyTicketsController =
  async (req, res) => {
    try {
      const customerId = req.user.id;

      const tickets =
        await Ticket.find({
          customer: customerId,
        })
          .sort({
            createdAt: -1,
          })
          .populate(
            "repliedBy",
            "name email"
          );

      return res.status(200).json({
        success: true,

        totalTickets:
          tickets.length,

        tickets,
      });
    } catch (error) {
      console.error(
        "Get My Tickets Error:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          "Unable to fetch support tickets",
      });
    }
  };

// =====================================================
// GET SINGLE TICKET
// CUSTOMER ONLY
// =====================================================

const getSingleTicketController =
  async (req, res) => {
    try {
      const { ticketId } = req.params;

      if (
        !mongoose.Types.ObjectId.isValid(
          ticketId
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid ticket ID",
        });
      }

      const ticket =
        await Ticket.findOne({
          _id: ticketId,
          customer: req.user.id,
        })
          .populate(
            "customer",
            "name email"
          )
          .populate(
            "repliedBy",
            "name email"
          );

      if (!ticket) {
        return res.status(404).json({
          success: false,
          message:
            "Ticket not found",
        });
      }

      return res.status(200).json({
        success: true,
        ticket,
      });
    } catch (error) {
      console.error(
        "Get Ticket Error:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          "Unable to fetch support ticket",
      });
    }
  };

// =====================================================
// GET ALL TICKETS
// ADMIN ONLY
// =====================================================

const getAllTicketsController =
  async (req, res) => {
    try {
      const tickets =
        await Ticket.find()
          .sort({
            createdAt: -1,
          })
          .populate(
            "customer",
            "name email"
          )
          .populate(
            "repliedBy",
            "name email"
          );

      return res.status(200).json({
        success: true,

        totalTickets:
          tickets.length,

        tickets,
      });
    } catch (error) {
      console.error(
        "Get All Tickets Error:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          "Unable to fetch support tickets",
      });
    }
  };

// =====================================================
// UPDATE TICKET
// ADMIN ONLY
// =====================================================

const updateTicketController =
  async (req, res) => {
    try {
      const { ticketId } = req.params;

      const {
        status,
        adminReply,
      } = req.body;

      if (
        !mongoose.Types.ObjectId.isValid(
          ticketId
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid ticket ID",
        });
      }

      const ticket =
        await Ticket.findById(ticketId);

      if (!ticket) {
        return res.status(404).json({
          success: false,
          message:
            "Ticket not found",
        });
      }

      if (status !== undefined) {
        const allowedStatuses = [
          "OPEN",
          "IN_PROGRESS",
          "RESOLVED",
          "CLOSED",
        ];

        if (
          !allowedStatuses.includes(status)
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Invalid ticket status",
          });
        }

        ticket.status = status;
      }

      if (
        adminReply !== undefined &&
        typeof adminReply === "string" &&
        adminReply.trim()
      ) {
        ticket.adminReply =
          adminReply.trim();

        ticket.repliedBy =
          req.user.id;

        ticket.repliedAt =
          new Date();
      }

      await ticket.save();

      await ticket.populate(
        "customer",
        "name email"
      );

      await ticket.populate(
        "repliedBy",
        "name email"
      );

      return res.status(200).json({
        success: true,

        message:
          "Ticket updated successfully",

        ticket,
      });
    } catch (error) {
      console.error(
        "Update Ticket Error:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          "Unable to update support ticket",
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
