const express = require("express");

const router = express.Router();

const {
  createTicketController,
  getMyTicketsController,
  getSingleTicketController,
  getAllTicketsController,
  updateTicketController,
} = require("../controllers/ticketController");

const authMiddleware =
  require("../middleware/auth.middleware");

const roleMiddleware =
  require("../middleware/role.middleware");


// ========================================
// CUSTOMER - CREATE TICKET
// ========================================

router.post(
  "/create",
  authMiddleware,
  roleMiddleware("customer"),
  createTicketController
);


// ========================================
// CUSTOMER - GET MY TICKETS
// ========================================

router.get(
  "/my-tickets",
  authMiddleware,
  roleMiddleware("customer"),
  getMyTicketsController
);


// ========================================
// ADMIN - GET ALL TICKETS
// IMPORTANT: STATIC ROUTE BEFORE /:ticketId
// ========================================

router.get(
  "/admin/all",
  authMiddleware,
  roleMiddleware("admin"),
  getAllTicketsController
);


// ========================================
// ADMIN - UPDATE TICKET STATUS
// ========================================

router.put(
  "/admin/:ticketId",
  authMiddleware,
  roleMiddleware("admin"),
  updateTicketController
);


// ========================================
// CUSTOMER - GET SINGLE TICKET
// ALWAYS KEEP DYNAMIC ROUTE LAST
// ========================================

router.get(
  "/:ticketId",
  authMiddleware,
  roleMiddleware("customer"),
  getSingleTicketController
);


module.exports = router;
