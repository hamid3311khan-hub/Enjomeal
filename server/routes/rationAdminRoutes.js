const express = require("express");

const {
  getAllRationRequestsAdmin,
  updateRationQuotationAdmin,
} = require("../controllers/rationAdminController");

const authMiddleware = require("../middleware/auth.middleware");
const roleMiddleware = require("../middleware/role.middleware");

const router = express.Router();

router.use(authMiddleware, roleMiddleware("admin"));

router.get("/", getAllRationRequestsAdmin);
router.put("/:requestId/quotation", updateRationQuotationAdmin);

module.exports = router;
