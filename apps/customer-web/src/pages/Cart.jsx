import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/api";

function Cart() {
  const navigate = useNavigate();

  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingFoodId, setUpdatingFoodId] = useState(null);
  const [clearing, setClearing] = useState(false);

  useEffect(() => {
    fetchCart();
  }, []);

  // ==========================================
  // FETCH CART
  // ==========================================

  const fetchCart = async () => {
    try {
      const token = localStorage.getItem("enjoMealToken");

      if (!token) {
        navigate("/login");
        return;
      }

      const response = await API.get("/cart", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        setCart(response.data.cart);
      }
    } catch (err) {
      console.error("Cart API Error:", err);

      if (err.response?.status === 401) {
        localStorage.removeItem("enjoMealToken");
        localStorage.removeItem("enjoMealUser");
        navigate("/login");
        return;
      }

      if (err.response?.status === 404) {
        setCart(null);
        return;
      }

      setError(
        err.response?.data?.message ||
          "Failed to load cart."
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // UPDATE QUANTITY
  // ==========================================

  const updateQuantity = async (foodId, quantity) => {
    if (quantity < 1) {
      return;
    }

    try {
      const token = localStorage.getItem(
        "enjoMealToken"
      );

      setUpdatingFoodId(foodId);

      const response = await API.put(
        `/cart/items/${foodId}`,
        {
          quantity,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        setCart(response.data.cart);
      }
    } catch (err) {
      console.error(
        "Update Cart Error:",
        err
      );

      alert(
        err.response?.data?.message ||
          "Failed to update quantity."
      );
    } finally {
      setUpdatingFoodId(null);
    }
  };

  // ==========================================
  // REMOVE ITEM
  // ==========================================

  const removeItem = async (foodId) => {
    try {
      const token = localStorage.getItem(
        "enjoMealToken"
      );

      setUpdatingFoodId(foodId);

      const response = await API.delete(
        `/cart/items/${foodId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        setCart(response.data.cart);
      }
    } catch (err) {
      console.error(
        "Remove Cart Item Error:",
        err
      );

      alert(
        err.response?.data?.message ||
          "Failed to remove item."
      );
    } finally {
      setUpdatingFoodId(null);
    }
  };

  // ==========================================
  // CLEAR CART
  // ==========================================

  const clearCart = async () => {
    const confirmClear = window.confirm(
      "Are you sure you want to clear your cart?"
    );

    if (!confirmClear) {
      return;
    }

    try {
      const token = localStorage.getItem(
        "enjoMealToken"
      );

      setClearing(true);

      const response = await API.delete(
        "/cart/clear",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        setCart(response.data.cart);
      }
    } catch (err) {
      console.error(
        "Clear Cart Error:",
        err
      );

      alert(
        err.response?.data?.message ||
          "Failed to clear cart."
      );
    } finally {
      setClearing(false);
    }
  };

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <div style={{ padding: "30px" }}>
        <h2>Loading cart...</h2>
      </div>
    );
  }

  // ==========================================
  // ERROR
  // ==========================================

  if (error) {
    return (
      <div style={{ padding: "30px" }}>
        <p style={{ color: "red" }}>
          {error}
        </p>
      </div>
    );
  }

  // ==========================================
  // EMPTY CART
  // ==========================================

  if (
    !cart ||
    !cart.items ||
    cart.items.length === 0
  ) {
    return (
      <div
        style={{
          minHeight: "100vh",
          padding: "30px",
          background: "#fff8f3",
        }}
      >
        <h1>Your Cart</h1>

        <p>Your cart is empty.</p>

        <button
          onClick={() => navigate("/restaurants")}
          style={{
            padding: "12px 20px",
            border: "none",
            borderRadius: "8px",
            background: "#e85d04",
            color: "#fff",
            cursor: "pointer",
          }}
        >
          Browse Restaurants
        </button>
      </div>
    );
  }

  // ==========================================
  // CART PAGE
  // ==========================================

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "30px",
        background: "#fff8f3",
      }}
    >
      {/* BACK BUTTON */}

      <button
        onClick={() => navigate(-1)}
        style={{
          marginBottom: "20px",
          padding: "10px 16px",
          border: "1px solid #ddd",
          borderRadius: "8px",
          background: "#fff",
          cursor: "pointer",
        }}
      >
        ← Back
      </button>

      {/* HEADER */}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "15px",
          flexWrap: "wrap",
        }}
      >
        <div>
          <h1>Your Cart</h1>

          {cart.restaurant && (
            <p>
              Restaurant:{" "}
              <strong>
                {cart.restaurant.name}
              </strong>
            </p>
          )}
        </div>

        <button
          onClick={clearCart}
          disabled={clearing}
          style={{
            padding: "10px 16px",
            border: "none",
            borderRadius: "8px",
            background: "#dc3545",
            color: "#fff",
            cursor: clearing
              ? "not-allowed"
              : "pointer",
          }}
        >
          {clearing
            ? "Clearing..."
            : "Clear Cart"}
        </button>
      </div>

      {/* CART ITEMS */}

      {cart.items.map((item) => {
        const foodId = item.food?._id;

        const itemTotal =
          Number(item.price) *
          Number(item.quantity);

        const updating =
          updatingFoodId === foodId;

        return (
          <div
            key={foodId}
            style={{
              padding: "20px",
              marginBottom: "15px",
              background: "#fff",
              border: "1px solid #ddd",
              borderRadius: "12px",
            }}
          >
            <h3>
              {item.food?.name || "Food"}
            </h3>

            <p>
              Price: ₹{item.price}
            </p>

            {/* QUANTITY */}

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                margin: "15px 0",
              }}
            >
              <button
                disabled={
                  updating ||
                  item.quantity <= 1
                }
                onClick={() =>
                  updateQuantity(
                    foodId,
                    item.quantity - 1
                  )
                }
                style={{
                  width: "38px",
                  height: "38px",
                  border: "1px solid #ddd",
                  borderRadius: "8px",
                  background: "#fff",
                  cursor:
                    updating ||
                    item.quantity <= 1
                      ? "not-allowed"
                      : "pointer",
                  fontSize: "20px",
                }}
              >
                −
              </button>

              <strong
                style={{
                  minWidth: "30px",
                  textAlign: "center",
                }}
              >
                {item.quantity}
              </strong>

              <button
                disabled={updating}
                onClick={() =>
                  updateQuantity(
                    foodId,
                    item.quantity + 1
                  )
                }
                style={{
                  width: "38px",
                  height: "38px",
                  border: "1px solid #ddd",
                  borderRadius: "8px",
                  background: "#fff",
                  cursor: updating
                    ? "not-allowed"
                    : "pointer",
                  fontSize: "20px",
                }}
              >
                +
              </button>
            </div>

            <strong>
              Item Total: ₹{itemTotal}
            </strong>

            {/* REMOVE */}

            <div style={{ marginTop: "15px" }}>
              <button
                disabled={updating}
                onClick={() =>
                  removeItem(foodId)
                }
                style={{
                  padding: "9px 15px",
                  border: "none",
                  borderRadius: "7px",
                  background: "#f1f1f1",
                  color: "#d00",
                  cursor: updating
                    ? "not-allowed"
                    : "pointer",
                }}
              >
                {updating
                  ? "Updating..."
                  : "Remove"}
              </button>
            </div>
          </div>
        );
      })}

      {/* TOTAL */}

      <div
        style={{
          marginTop: "25px",
          padding: "20px",
          background: "#fff",
          borderRadius: "12px",
          border: "1px solid #ddd",
        }}
      >
        <h2>
          Total: ₹{cart.totalAmount}
        </h2>

        <button
          onClick={() =>
            navigate("/checkout")
          }
          style={{
            width: "100%",
            padding: "14px",
            border: "none",
            borderRadius: "8px",
            background: "#e85d04",
            color: "#fff",
            fontWeight: "700",
            cursor: "pointer",
          }}
        >
          Proceed to Checkout
        </button>
      </div>
    </div>
  );
}

export default Cart;