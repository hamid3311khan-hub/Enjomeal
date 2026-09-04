const express = require("express");

const router = express.Router();

const {
  createTicketController,
  getMyTicketsController,
  getSingleTicketController,
  getAllTicketsController,
  updateTicketController,
} = require(
  "../controllers/ticketController"
);

const authMiddleware =
  require(
    "../middleware/auth.middleware"
  );

const roleMiddleware =
  require(
    "../middleware/role.middleware"
  );

// =====================================================
// CUSTOMER - CREATE TICKET
// POST /api/tickets/create
// =====================================================

router.post(
  "/create",
  authMiddleware,
  roleMiddleware("customer"),
  createTicketController
);

// =====================================================
// CUSTOMER - GET MY TICKETS
// GET /api/tickets/my-tickets
// =====================================================

router.get(
  "/my-tickets",
  authMiddleware,
  roleMiddleware("customer"),
  getMyTicketsController
);

// =====================================================
// ADMIN - GET ALL TICKETS
// GET /api/tickets/admin
// =====================================================

router.get(
  "/admin",
  authMiddleware,
  roleMiddleware("admin"),
  getAllTicketsController
);

// =====================================================
// ADMIN - UPDATE TICKET
// PATCH /api/tickets/:ticketId/status
// =====================================================

router.patch(
  "/:ticketId/status",
  authMiddleware,
  roleMiddleware("admin"),
  updateTicketController
);

// =====================================================
// CUSTOMER - GET SINGLE TICKET
// GET /api/tickets/:ticketId
// DYNAMIC ROUTE MUST BE LAST
// =====================================================

router.get(
  "/:ticketId",
  authMiddleware,
  roleMiddleware("customer"),
  getSingleTicketController
);

module.exports = router;
