import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import API from "../api/api";

function Checkout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [cart, setCart] = useState(null);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [error, setError] = useState("");
  // =====================================================
// COUPON / OFFER
// =====================================================

const [couponCode, setCouponCode] = useState("");
const [coupon, setCoupon] = useState(null);
const [couponLoading, setCouponLoading] = useState(false);
const [couponError, setCouponError] = useState("");
const [couponSuccess, setCouponSuccess] = useState("");
const [availableCoupons, setAvailableCoupons] = useState([]);
const [couponsLoading, setCouponsLoading] = useState(false);

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
    fetchSettings();
  fetchAvailableCoupons();
  fetchCart();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await API.get("/settings");
      if (response.data.success) {
        setSettings(response.data.settings);
      }
    } catch (err) {
      console.error("Settings Error:", err);
    }
  };

  const fetchAvailableCoupons = async () => {
    try {
      setCouponsLoading(true);
      const token = localStorage.getItem("enjoMealToken");
      if (!token) return;

      const response = await API.get("/coupons/active", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        setAvailableCoupons(response.data.coupons || []);
      }
    } catch (err) {
      console.error("Available Coupons Error:", err);
    } finally {
      setCouponsLoading(false);
    }
  };
  // =================================================
// AUTO APPLY COUPON FROM COUPONS PAGE
// =================================================

useEffect(() => {
  const codeFromPage = location.state?.couponCode;

  if (!codeFromPage || !cart) {
    return;
  }

  setCouponCode(codeFromPage);

  applyCoupon(codeFromPage);

  // Clear navigation state after applying
  navigate("/checkout", {
    replace: true,
    state: {},
  });
}, [cart, location.state]);

  const fetchCart = async () => {
    try {
      const token = localStorage.getItem("enjoMealToken");

      if (!token) {
        navigate("/login", { replace: true });
        return;
      }

      const response = await API.get("/cart", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

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
      } else {
        setError(
          response.data.message ||
            "Failed to load checkout."
        );
      }
    } catch (err) {
      console.error("Checkout Cart Error:", err);

      if (err.response?.status === 401) {
        localStorage.removeItem("enjoMealToken");
        localStorage.removeItem("enjoMealUser");

        navigate("/login", {
          replace: true,
        });

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
// APPLY COUPON
// =====================================================

const applyCoupon = async (codeFromPage = null) => {
  const code = (
  codeFromPage || couponCode
).trim().toUpperCase();

  if (!code) {
    setCouponError("Please enter a coupon code.");
    setCouponSuccess("");
    return;
  }

  if (!cart?.restaurant?._id) {
    setCouponError("Restaurant information is missing.");
    setCouponSuccess("");
    return;
  }

  try {
    setCouponLoading(true);
    setCouponError("");
    setCouponSuccess("");

    const token = localStorage.getItem(
      "enjoMealToken"
    );

    if (!token) {
      navigate("/login", {
        replace: true,
      });
      return;
    }

    const subtotal = cart.items.reduce(
      (total, item) =>
        total +
        Number(item.price || 0) *
          Number(item.quantity || 0),
      0
    );

    const response = await API.post(
      "/coupons/apply",
      {
        code,
        orderAmount: subtotal,
        restaurant: cart.restaurant._id,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (response.data.success) {
      setCoupon(
        response.data.coupon || response.data
      );

      setCouponCode(code);

      setCouponSuccess(
        response.data.message ||
          "Coupon applied successfully."
      );
    } else {
      setCoupon(null);

      setCouponError(
        response.data.message ||
          "Invalid coupon."
      );
    }
  } catch (err) {
    console.error(
      "Apply Coupon Error:",
      err
    );

    setCoupon(null);

    setCouponError(
      err.response?.data?.message ||
        "Failed to apply coupon."
    );
  } finally {
    setCouponLoading(false);
  }
};

  // =====================================================
// PRICE CALCULATION
// =====================================================

const subtotal =
  cart?.items?.reduce(
    (total, item) =>
      total +
      Number(item.price || 0) *
        Number(item.quantity || 0),
    0
  ) || 0;

const calculateDiscount = () => {
  if (!coupon) {
    return 0;
  }

  const type =
    coupon.discountType ||
    coupon.type;

  const value =
    Number(
      coupon.discountValue ??
        coupon.value ??
        0
    );

  if (value <= 0) {
    return 0;
  }

  let discount = 0;

  if (
    type === "PERCENTAGE" ||
    type === "percentage"
  ) {
    discount =
      (subtotal * value) / 100;
  } else if (
    type === "FIXED" ||
    type === "fixed"
  ) {
    discount = value;
  }

  const maximumDiscount = Number(
    coupon.maxDiscount ??
      coupon.maximumDiscount ??
      0
  );

  if (
    maximumDiscount > 0 &&
    discount > maximumDiscount
  ) {
    discount = maximumDiscount;
  }

  return Math.min(
    Math.max(discount, 0),
    subtotal
  );
};

const discountAmount =
  calculateDiscount();

  const deliveryFee = settings?.freeDelivery
  ? 0
  : Number(settings?.deliveryFee || 0);

const platformCharge =
  Number(settings?.platformCharge || 0);

const finalTotal = Math.max(
  0,
  subtotal +
    deliveryFee +
    platformCharge -
    discountAmount
);

  // =====================================================
  // PLACE ORDER
  // =====================================================

  const handlePlaceOrder = async (event) => {
    event.preventDefault();

    if (placingOrder) {
      return;
    }

    setError("");

    // ===================================================
    // CART VALIDATION
    // ===================================================

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

    // ===================================================
    // ADDRESS VALIDATION
    // ===================================================

    const address = formData.address.trim();
    const city = formData.city.trim();
    const pincode = formData.pincode.trim();

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

    // ===================================================
    // PAYMENT VALIDATION
    // ===================================================

    if (
      !["COD", "ONLINE"].includes(
        formData.paymentMethod
      )
    ) {
      setError("Invalid payment method.");
      return;
    }

    // ===================================================
    // ONLINE PAYMENT
    // ===================================================

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

      // =================================================
      // PREPARE ITEMS
      // =================================================

      const items = cart.items.map(
        (item) => ({
          food: item.food?._id,
          quantity: Number(item.quantity),
        })
      );

      // =================================================
      // VALIDATE ITEMS
      // =================================================

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

      // =================================================
      // CREATE ORDER
      // =================================================

      const token = localStorage.getItem(
        "enjoMealToken"
      );

      const response = await API.post(
  "/orders/create",
  {
    restaurant: cart.restaurant._id,

    items,

    deliveryAddress: {
      address,
      city,
      pincode,
    },

    paymentMethod:
      formData.paymentMethod,

    // Coupon code — backend will validate again
    couponCode:
      coupon?.code ||
      couponCode ||
      null,
  },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // =================================================
      // SUCCESS
      // =================================================

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

      if (err.response?.status === 401) {
        localStorage.removeItem("enjoMealToken");
        localStorage.removeItem("enjoMealUser");

        navigate("/login", {
          replace: true,
        });

        return;
      }

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
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "#fff8f3",
          padding: "20px",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "400px",
            padding: "30px",
            background: "#fff",
            borderRadius: "16px",
            boxShadow:
              "0 10px 30px rgba(0,0,0,0.08)",
            textAlign: "center",
          }}
        >
          <h2>Loading checkout...</h2>

          <p
            style={{
              color: "#777",
            }}
          >
            Please wait.
          </p>
        </div>
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
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "#fff8f3",
          padding: "20px",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "400px",
            padding: "30px",
            background: "#fff",
            borderRadius: "16px",
            textAlign: "center",
            boxShadow:
              "0 10px 30px rgba(0,0,0,0.08)",
          }}
        >
          <h2>Your cart is empty.</h2>

          <button
            onClick={() =>
              navigate("/cart")
            }
            style={primaryButtonStyle}
          >
            Go to Cart
          </button>
        </div>
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
        background: "#fff8f3",
        padding: "20px",
        boxSizing: "border-box",
      }}
    >
      {/* =================================================
          HEADER
      ================================================= */}

      <header
        style={{
          maxWidth: "1100px",
          margin: "0 auto 25px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "15px",
          flexWrap: "wrap",
        }}
      >
        <button
          onClick={() =>
            navigate("/cart")
          }
          style={backButtonStyle}
        >
          ← Back to Cart
        </button>

        <h1
          style={{
            margin: 0,
            color: "#e85d04",
            fontSize: "28px",
          }}
        >
          ENJOMEAL
        </h1>
      </header>

      {/* =================================================
          PAGE TITLE
      ================================================= */}

      <section
        style={{
          maxWidth: "1100px",
          margin: "0 auto 25px",
        }}
      >
        <h2
          style={{
            margin: "0 0 6px",
            fontSize: "30px",
          }}
        >
          Checkout
        </h2>

        <p
          style={{
            margin: 0,
            color: "#777",
          }}
        >
          Complete your order details below.
        </p>
      </section>

      {/* =================================================
          ERROR
      ================================================= */}

      {error && (
        <div
          style={{
            maxWidth: "1100px",
            margin: "0 auto 20px",
            padding: "14px 16px",
            background: "#ffe5e5",
            border: "1px solid #ffb3b3",
            borderRadius: "10px",
            color: "#b00000",
            fontWeight: "600",
            boxSizing: "border-box",
          }}
        >
          {error}
        </div>
      )}
            {/* =================================================
          CHECKOUT GRID
      ================================================= */}

      <div
        className="checkout-grid"
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns:
            "minmax(0, 1.5fr) minmax(280px, 0.8fr)",
          gap: "20px",
          alignItems: "start",
        }}
      >
        {/* =================================================
            LEFT COLUMN
        ================================================= */}

        <div
          style={{
            background: "#fff",
            padding: "25px",
            borderRadius: "16px",
            border: "1px solid #eee",
            boxShadow:
              "0 8px 25px rgba(0,0,0,0.05)",
            boxSizing: "border-box",
          }}
        >
          {/* RESTAURANT */}

          <div>
            <p
              style={{
                margin: 0,
                color: "#777",
                fontSize: "14px",
              }}
            >
              Restaurant
            </p>

            <h2
              style={{
                margin: "6px 0 0",
              }}
            >
              🍽️{" "}
              {cart.restaurant?.name ||
                "Restaurant"}
            </h2>
          </div>

          <hr style={dividerStyle} />

          {/* DELIVERY ADDRESS */}

          <h2
            style={{
              marginTop: 0,
            }}
          >
            📍 Delivery Address
          </h2>

          <form onSubmit={handlePlaceOrder}>
            {/* ADDRESS */}

            <label style={labelStyle}>
              Full Address
            </label>

            <textarea
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="House no, street, area..."
              required
              rows="4"
              style={{
                ...inputStyle,
                resize: "vertical",
              }}
            />

            {/* CITY */}

            <label style={labelStyle}>
              City
            </label>

            <input
              type="text"
              name="city"
              value={formData.city}
              onChange={handleChange}
              placeholder="Enter city"
              required
              style={inputStyle}
            />

            {/* PINCODE */}

            <label style={labelStyle}>
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
              style={inputStyle}
            />

            {/* =================================================
    COUPON / OFFER
================================================= */}

<div
  style={{
    marginTop: "25px",
    marginBottom: "25px",
    padding: "16px",
    border: "1px solid #eee",
    borderRadius: "12px",
    background: "#fffaf5",
  }}
>
{/* AVAILABLE COUPONS */}
{availableCoupons.length > 0 && (
  <div
    style={{
      marginBottom: "15px",
      padding: "12px",
      border: "1px solid #eee",
      borderRadius: "10px",
      background: "#fff",
    }}
  >
    <h3 style={{ marginTop: 0 }}>
      🎁 Available Coupons
    </h3>

    {availableCoupons.map((item) => (
      <div
        key={item._id || item.code}
        style={{
          padding: "12px",
          marginBottom: "10px",
          border: "1px solid #ddd",
          borderRadius: "8px",
        }}
      >
        <strong>{item.code}</strong>

        <div style={{ marginTop: "5px" }}>
          {item.discountType === "PERCENTAGE"
            ? `${item.discountValue}% OFF`
            : `₹${item.discountValue} OFF`}
        </div>

        {item.minimumOrderAmount > 0 && (
          <small>
            Minimum order: ₹{item.minimumOrderAmount}
          </small>
        )}

        <br />

        <button
          type="button"
          onClick={() => {
            setCouponCode(item.code);
            setCouponError("");
            setCouponSuccess("");
          }}
          style={{
            marginTop: "8px",
            padding: "8px 14px",
            border: "none",
            borderRadius: "6px",
            background: "#e85d04",
            color: "#fff",
            fontWeight: "600",
            cursor: "pointer",
          }}
        >
          Use Coupon
        </button>
      </div>
    ))}
  </div>
)}

  <h2 style={{ marginTop: 0 }}>
    🏷️ Apply Coupon
  </h2>

  <div
    style={{
      display: "flex",
      gap: "10px",
      flexWrap: "wrap",
    }}
  >
    <input
      type="text"
      value={couponCode}
      onChange={(event) => {
        setCouponCode(
          event.target.value.toUpperCase()
        );
        setCouponError("");
        setCouponSuccess("");
      }}
      placeholder="Enter coupon code"
      disabled={couponLoading || !!coupon}
      style={{
        ...inputStyle,
        flex: "1 1 200px",
        marginBottom: 0,
      }}
    />

    {!coupon ? (
      <button
        type="button"
        onClick={applyCoupon}
        disabled={
          couponLoading ||
          !couponCode.trim()
        }
        style={{
          padding: "12px 18px",
          border: "none",
          borderRadius: "9px",
          background:
            couponLoading ||
            !couponCode.trim()
              ? "#aaa"
              : "#e85d04",
          color: "#fff",
          fontWeight: "700",
          cursor:
            couponLoading ||
            !couponCode.trim()
              ? "not-allowed"
              : "pointer",
        }}
      >
        {couponLoading
          ? "Applying..."
          : "Apply"}
      </button>
    ) : (
      <button
        type="button"
        onClick={() => {
          setCoupon(null);
          setCouponCode("");
          setCouponError("");
          setCouponSuccess("");
        }}
        style={{
          padding: "12px 18px",
          border: "1px solid #ddd",
          borderRadius: "9px",
          background: "#fff",
          fontWeight: "700",
          cursor: "pointer",
        }}
      >
        Remove
      </button>
    )}
  </div>

  {couponError && (
    <p
      style={{
        margin: "10px 0 0",
        color: "#c62828",
        fontSize: "14px",
        fontWeight: "600",
      }}
    >
      {couponError}
    </p>
  )}

  {couponSuccess && (
    <p
      style={{
        margin: "10px 0 0",
        color: "#2e7d32",
        fontSize: "14px",
        fontWeight: "600",
      }}
    >
      ✓ {couponSuccess}
    </p>
  )}

  {coupon && (
    <p
      style={{
        margin: "10px 0 0",
        color: "#2e7d32",
        fontSize: "14px",
        fontWeight: "600",
      }}
    >
      🎉 Coupon applied successfully.
    </p>
  )}
</div>

            {/* PAYMENT */}

            <h2
              style={{
                marginTop: "25px",
              }}
            >
              💳 Payment Method
            </h2>

            {/* COD */}

            <div
              style={{
                border: "2px solid #e85d04",
                borderRadius: "10px",
                padding: "15px",
                marginBottom: "12px",
                background: "#fff8f3",
              }}
            >
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  cursor: "pointer",
                  fontWeight: "600",
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
                />

                Cash on Delivery
              </label>

              <p
                style={{
                  margin: "7px 0 0 27px",
                  color: "#777",
                  fontSize: "13px",
                }}
              >
                Pay when your order is delivered.
              </p>
            </div>

            {/* ONLINE */}

            <div
              style={{
                border: "1px solid #ddd",
                borderRadius: "10px",
                padding: "15px",
                opacity: 0.6,
              }}
            >
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  fontWeight: "600",
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
                />

                Online Payment
              </label>

              <p
                style={{
                  margin: "7px 0 0 27px",
                  color: "#777",
                  fontSize: "13px",
                }}
              >
                Coming soon
              </p>
            </div>

            {/* PLACE ORDER */}

            <button
              type="submit"
              disabled={placingOrder}
              style={{
                width: "100%",
                marginTop: "25px",
                padding: "15px",
                border: "none",
                borderRadius: "10px",
                background: placingOrder
                  ? "#aaa"
                  : "#e85d04",
                color: "#fff",
                fontWeight: "700",
                fontSize: "16px",
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

        {/* =================================================
            RIGHT COLUMN
        ================================================= */}

        <div
          style={{
            background: "#fff",
            padding: "22px",
            borderRadius: "16px",
            border: "1px solid #eee",
            boxShadow:
              "0 8px 25px rgba(0,0,0,0.05)",
            boxSizing: "border-box",
          }}
        >
          <h2
            style={{
              marginTop: 0,
            }}
          >
            🛒 Order Summary
          </h2>

          {cart.items.map((item) => {
            const itemTotal =
              Number(item.price) *
              Number(item.quantity);

            return (
              <div
                key={item.food?._id}
                style={{
                  padding: "13px 0",
                  borderBottom:
                    "1px solid #eee",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent:
                      "space-between",
                    alignItems: "flex-start",
                    gap: "10px",
                  }}
                >
                  <div
                    style={{
                      minWidth: 0,
                    }}
                  >
                    <strong>
                      {item.food?.name ||
                        "Food"}
                    </strong>

                    <p
                      style={{
                        margin: "5px 0 0",
                        color: "#777",
                        fontSize: "14px",
                      }}
                    >
                      ₹{item.price} ×{" "}
                      {item.quantity}
                    </p>
                  </div>

                  <strong>
                    ₹{itemTotal}
                  </strong>
                </div>
              </div>
            );
          })}

          {/* PRICE BREAKDOWN */}

<div
  style={{
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "10px",
  }}
>
  <span>Items Total</span>
  <span>₹{subtotal.toFixed(2)}</span>
</div>

<div
  style={{
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "10px",
  }}
>
  <span>Coupon Discount</span>

  <span
    style={{
      color: "#16a34a",
      fontWeight: "600",
    }}
  >
    - ₹{discountAmount.toFixed(2)}
  </span>
</div>

<div
  style={{
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "12px",
  }}
>
  <span>Delivery Fee</span>
<span>₹{deliveryFee.toFixed(2)}</span>
</div>

<div
  style={{
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "12px",
  }}
>
  <span>Platform Charge</span>
  <span>₹{platformCharge.toFixed(2)}</span>
</div>

<hr
  style={{
    border: "none",
    borderTop: "1px solid #ddd",
    margin: "12px 0",
  }}
/>

<div
  style={{
    display: "flex",
    justifyContent: "space-between",
    fontSize: "18px",
    fontWeight: "700",
  }}
>
  <span>Total</span>

  <span>
  ₹{finalTotal.toFixed(2)}
</span>
</div>

          {/* SECURITY NOTE */}

          <div
            style={{
              marginTop: "20px",
              padding: "12px",
              background: "#fff8f3",
              borderRadius: "10px",
              fontSize: "13px",
              color: "#666",
              lineHeight: "1.5",
            }}
          >
            🔒 Your order details are securely
            processed.
          </div>
        </div>
      </div>

      {/* =================================================
          RESPONSIVE CSS
      ================================================= */}

      <style>
        {`
          @media (max-width: 768px) {
            .checkout-grid {
              grid-template-columns: 1fr !important;
            }
          }

          @media (max-width: 480px) {
            .checkout-grid {
              gap: 15px !important;
            }
          }
        `}
      </style>
    </div>
  );
}

// =====================================================
// STYLES
// =====================================================

const inputStyle = {
  width: "100%",
  padding: "13px",
  marginTop: "7px",
  marginBottom: "17px",
  boxSizing: "border-box",
  border: "1px solid #ddd",
  borderRadius: "9px",
  fontSize: "15px",
  outline: "none",
};

const labelStyle = {
  display: "block",
  fontWeight: "600",
};

const dividerStyle = {
  border: "none",
  borderTop: "1px solid #eee",
  margin: "20px 0",
};

const backButtonStyle = {
  padding: "10px 16px",
  border: "1px solid #ddd",
  borderRadius: "9px",
  background: "#fff",
  cursor: "pointer",
  fontWeight: "600",
};

const primaryButtonStyle = {
  padding: "12px 20px",
  border: "none",
  borderRadius: "9px",
  background: "#e85d04",
  color: "#fff",
  cursor: "pointer",
  fontWeight: "700",
};

export default Checkout;
