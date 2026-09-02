const express = require("express");

const {
  createTicketController,
  getMyTicketsController,
  getSingleTicketController,
  getAllTicketsController,
  updateTicketController,
} = require("../controllers/ticketController");

const authMiddleware = require("../middleware/auth.middleware");
const roleMiddleware = require("../middleware/role.middleware");

const router = express.Router();

// ==============================================
// CUSTOMER: CREATE SUPPORT TICKET
// POST /api/tickets/create
// ==============================================

router.post(
  "/create",
  authMiddleware,
  roleMiddleware("customer"),
  createTicketController
);

// ==============================================
// CUSTOMER: GET MY TICKETS
// GET /api/tickets/my-tickets
// ==============================================

router.get(
  "/my-tickets",
  authMiddleware,
  roleMiddleware("customer"),
  getMyTicketsController
);

// ==============================================
// CUSTOMER: GET SINGLE TICKET
// GET /api/tickets/:ticketId
// ==============================================

router.get(
  "/:ticketId",
  authMiddleware,
  roleMiddleware("customer"),
  getSingleTicketController
);

// ==============================================
// ADMIN: GET ALL TICKETS
// GET /api/tickets/admin/all
// ==============================================

router.get(
  "/admin/all",
  authMiddleware,
  roleMiddleware("admin"),
  getAllTicketsController
);

// ==============================================
// ADMIN: UPDATE / REPLY TO TICKET
// PUT /api/tickets/admin/:ticketId
// ==============================================

router.put(
  "/admin/:ticketId",
  authMiddleware,
  roleMiddleware("admin"),
  updateTicketController
);

module.exports = router;
