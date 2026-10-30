const express = require("express");

const {
  createRationRequest,
  getMyRationRequests,
  getMyRationRequestById,
  submitRationDecisions,
} = require("../controllers/rationRequestController");

const authMiddleware = require("../middleware/auth.middleware");
const roleMiddleware = require("../middleware/role.middleware");

const router = express.Router();

router.use(authMiddleware, roleMiddleware("customer"));

router.post("/", createRationRequest);
router.get("/my-requests", getMyRationRequests);
router.get("/:requestId", getMyRationRequestById);
router.put("/:requestId/decisions", submitRationDecisions);

module.exports = router;
