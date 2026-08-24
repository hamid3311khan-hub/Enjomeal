const express = require("express");

const {
  register,
  login,
  profile,
  resetUserPassword,
} = require("../controllers/auth.controller");

const authMiddleware = require("../middleware/auth.middleware");
const roleMiddleware = require("../middleware/role.middleware");

const router = express.Router();

// =====================================================
// REGISTER
// PUBLIC
// =====================================================
router.post("/register", register);

// =====================================================
// LOGIN
// PUBLIC
// =====================================================
router.post("/login", login);

// =====================================================
// GET MY PROFILE
// AUTHENTICATED USER
// =====================================================
router.get(
  "/profile",
  authMiddleware,
  profile
);

// =====================================================
// RESET USER PASSWORD
// ADMIN ONLY
//  =====================================================
router.put( "/reset-password/:userId", authMiddleware, roleMiddleware("admin"), resetUserPassword);

module.exports = router;