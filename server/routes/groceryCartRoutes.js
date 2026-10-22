const express = require("express");

const {
  addGroceryToCart,
  getGroceryCart,
  updateGroceryCartItem,
  removeGroceryCartItem,
  clearGroceryCart,
} = require("../controllers/groceryCartController");

const authMiddleware = require("../middleware/auth.middleware");
const roleMiddleware = require("../middleware/role.middleware");

const router = express.Router();

router.use(authMiddleware, roleMiddleware("customer"));

router.post("/add", addGroceryToCart);
router.get("/", getGroceryCart);
router.put("/items/:productId", updateGroceryCartItem);
router.delete("/items/:productId", removeGroceryCartItem);
router.delete("/clear", clearGroceryCart);

module.exports = router;
