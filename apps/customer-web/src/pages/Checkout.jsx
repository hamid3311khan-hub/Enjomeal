import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/api";

function Checkout() {
  const navigate = useNavigate();

  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    address: "",
    city: "",
    pincode: "",
    paymentMethod: "COD",
  });

  // =====================================================
  // FETCH CART
  // =====================================================

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      const response = await API.get("/cart");

      if (response.data.success) {
        const cartData = response.data.cart;

        if (
          !cartData ||
          !cartData.items ||
          cartData.items.length === 0
        ) {
          navigate("/cart", { replace: true });
          return;
        }

        setCart(cartData);
      }
    } catch (err) {
      console.error("Checkout Cart Error:", err);

      if (err.response?.status === 401) {
        return;
      }

      setError(
        err.response?.data?.message ||
          "Failed to load checkout."
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // FORM CHANGE
  // =====================================================

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
  };

  // =====================================================
  // PLACE ORDER
  // =====================================================

  const handlePlaceOrder = async (event) => {
    event.preventDefault();

    if (placingOrder) {
      return;
    }

    setError("");

    // ---------------------------------------------
    // CART VALIDATION
    // ---------------------------------------------

    if (!cart?._id) {
      setError("Cart information is missing.");
      return;
    }

    if (!cart?.restaurant?._id) {
      setError("Restaurant information is missing.");
      return;
    }

    if (
      !cart.items ||
      cart.items.length === 0
    ) {
      setError("Your cart is empty.");
      return;
    }

    // ---------------------------------------------
    // ADDRESS VALIDATION
    // ---------------------------------------------

    const address =
      formData.address.trim();

    const city =
      formData.city.trim();

    const pincode =
      formData.pincode.trim();

    if (address.length < 5) {
      setError(
        "Please enter a complete delivery address."
      );
      return;
    }

    if (city.length < 2) {
      setError("Please enter a valid city.");
      return;
    }

    if (!/^\d{6}$/.test(pincode)) {
      setError(
        "Please enter a valid 6-digit pincode."
      );
      return;
    }

    // ---------------------------------------------
    // PAYMENT VALIDATION
    // ---------------------------------------------

    if (
      !["COD", "ONLINE"].includes(
        formData.paymentMethod
      )
    ) {
      setError("Invalid payment method.");
      return;
    }

    // ---------------------------------------------
    // ONLINE PAYMENT
    // MVP: NOT INTEGRATED YET
    // ---------------------------------------------

    if (
      formData.paymentMethod === "ONLINE"
    ) {
      setError(
        "Online payment is not available yet. Please select Cash on Delivery."
      );
      return;
    }

    try {
      setPlacingOrder(true);

      // -------------------------------------------
      // PREPARE ORDER ITEMS
      // -------------------------------------------

      const items = cart.items.map(
        (item) => ({
          food: item.food?._id,
          quantity: Number(item.quantity),
        })
      );

      // -------------------------------------------
      // CHECK FOOD IDS
      // -------------------------------------------

      const invalidItem = items.some(
        (item) =>
          !item.food ||
          !item.quantity ||
          item.quantity < 1
      );

      if (invalidItem) {
        setError(
          "Some cart items are invalid. Please refresh your cart."
        );
        setPlacingOrder(false);
        return;
      }

      // -------------------------------------------
      // CREATE ORDER
      // -------------------------------------------

      const response = await API.post(
        "/orders/create",
        {
          restaurant:
            cart.restaurant._id,

          items,

          deliveryAddress: {
            address,
            city,
            pincode,
          },

          paymentMethod:
            formData.paymentMethod,
        }
      );

      // -------------------------------------------
      // SUCCESS
      // -------------------------------------------

      if (response.data.success) {
        const orderId =
          response.data.order?._id;

        if (!orderId) {
          setError(
            "Order created but order ID is missing."
          );
          return;
        }

        navigate(
          `/orders/${orderId}`,
          {
            replace: true,
          }
        );

        return;
      }

      setError(
        response.data.message ||
          "Failed to place order."
      );
    } catch (err) {
      console.error(
        "Place Order Error:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Failed to place order. Please try again."
      );
    } finally {
      setPlacingOrder(false);
    }
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div
        style={{
          padding: "30px",
        }}
      >
        <h2>Loading checkout...</h2>
      </div>
    );
  }

  // =====================================================
  // CART NOT FOUND
  // =====================================================

  if (!cart) {
    return (
      <div
        style={{
          padding: "30px",
        }}
      >
        <h2>Your cart is empty.</h2>

        <button
          onClick={() =>
            navigate("/cart")
          }
          style={{
            padding: "12px 20px",
            border: "none",
            borderRadius: "8px",
            background: "#e85d04",
            color: "#fff",
            cursor: "pointer",
          }}
        >
          Go to Cart
        </button>
      </div>
    );
  }

  // =====================================================
  // CHECKOUT PAGE
  // =====================================================

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "30px",
        background: "#fff8f3",
      }}
    >
      {/* BACK */}

      <button
        onClick={() =>
          navigate("/cart")
        }
        style={{
          marginBottom: "20px",
          padding: "10px 16px",
          border: "1px solid #ddd",
          borderRadius: "8px",
          background: "#fff",
          cursor: "pointer",
        }}
      >
        ← Back to Cart
      </button>

      <h1>Checkout</h1>

      {/* ERROR */}

      {error && (
        <div
          style={{
            maxWidth: "700px",
            marginBottom: "15px",
            padding: "12px 15px",
            background: "#ffe5e5",
            border: "1px solid #ffb3b3",
            borderRadius: "8px",
            color: "#c00",
          }}
        >
          {error}
        </div>
      )}

      <div
        style={{
          maxWidth: "700px",
          padding: "25px",
          background: "#fff",
          border: "1px solid #ddd",
          borderRadius: "12px",
        }}
      >
        {/* RESTAURANT */}

        <h2>Restaurant</h2>

        <p>
          <strong>
            {cart.restaurant?.name ||
              "Restaurant"}
          </strong>
        </p>

        <hr />

        {/* ORDER SUMMARY */}

        <h2>Order Summary</h2>

        {cart.items.map((item) => {
          const itemTotal =
            Number(item.price) *
            Number(item.quantity);

          return (
            <div
              key={item.food?._id}
              style={{
                display: "flex",
                justifyContent:
                  "space-between",
                gap: "15px",
                padding: "12px 0",
                borderBottom:
                  "1px solid #eee",
              }}
            >
              <span>
                {item.food?.name ||
                  "Food"}{" "}
                × {item.quantity}
              </span>

              <strong>
                ₹{itemTotal}
              </strong>
            </div>
          );
        })}

        <h2
          style={{
            textAlign: "right",
            marginTop: "20px",
          }}
        >
          Total: ₹{cart.totalAmount}
        </h2>

        <hr />

        {/* DELIVERY ADDRESS */}

        <h2>Delivery Address</h2>

        <form
          onSubmit={handlePlaceOrder}
        >
          {/* ADDRESS */}

          <label>
            Address
          </label>

          <textarea
            name="address"
            value={formData.address}
            onChange={handleChange}
            placeholder="House no, street, area..."
            required
            rows="4"
            style={{
              width: "100%",
              padding: "12px",
              marginTop: "7px",
              marginBottom: "15px",
              boxSizing: "border-box",
              border: "1px solid #ddd",
              borderRadius: "8px",
              resize: "vertical",
            }}
          />

          {/* CITY */}

          <label>
            City
          </label>

          <input
            type="text"
            name="city"
            value={formData.city}
            onChange={handleChange}
            placeholder="Enter city"
            required
            style={{
              width: "100%",
              padding: "12px",
              marginTop: "7px",
              marginBottom: "15px",
              boxSizing: "border-box",
              border: "1px solid #ddd",
              borderRadius: "8px",
            }}
          />

          {/* PINCODE */}

          <label>
            Pincode
          </label>

          <input
            type="text"
            name="pincode"
            value={formData.pincode}
            onChange={handleChange}
            placeholder="6-digit pincode"
            maxLength="6"
            inputMode="numeric"
            required
            style={{
              width: "100%",
              padding: "12px",
              marginTop: "7px",
              marginBottom: "20px",
              boxSizing: "border-box",
              border: "1px solid #ddd",
              borderRadius: "8px",
            }}
          />

          {/* PAYMENT */}

          <h2>Payment Method</h2>

          {/* COD */}

          <label
            style={{
              display: "block",
              marginBottom: "12px",
            }}
          >
            <input
              type="radio"
              name="paymentMethod"
              value="COD"
              checked={
                formData.paymentMethod ===
                "COD"
              }
              onChange={handleChange}
            />{" "}
            Cash on Delivery
          </label>

          {/* ONLINE */}

          <label
            style={{
              display: "block",
              color: "#999",
            }}
          >
            <input
              type="radio"
              name="paymentMethod"
              value="ONLINE"
              checked={
                formData.paymentMethod ===
                "ONLINE"
              }
              onChange={handleChange}
            />{" "}
            Online Payment
            <small
              style={{
                marginLeft: "8px",
              }}
            >
              (Coming soon)
            </small>
          </label>

          {/* PLACE ORDER */}

          <button
            type="submit"
            disabled={placingOrder}
            style={{
              width: "100%",
              marginTop: "25px",
              padding: "15px",
              border: "none",
              borderRadius: "8px",
              background: placingOrder
                ? "#aaa"
                : "#e85d04",
              color: "#fff",
              fontWeight: "700",
              cursor: placingOrder
                ? "not-allowed"
                : "pointer",
            }}
          >
            {placingOrder
              ? "Placing Order..."
              : "Place Order"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Checkout;