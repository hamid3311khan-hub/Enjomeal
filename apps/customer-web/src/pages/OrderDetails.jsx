import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import API from "../api/api";

function OrderDetails() {
  const { orderId } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      const response = await API.get(
        `/orders/${orderId}`
      );

      if (response.data.success) {
        setOrder(response.data.order);
      } else {
        setError("Order not found.");
      }
    } catch (err) {
      console.error("Order Details Error:", err);

      if (err.response?.status === 401) {
        localStorage.removeItem("enjoMealToken");
        localStorage.removeItem("enjoMealUser");

        navigate("/login");
        return;
      }

      setError(
        err.response?.data?.message ||
          "Failed to load order details."
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // CANCEL ORDER
  // ==========================================

  const handleCancelOrder = async () => {
    const confirmCancel = window.confirm(
      "Are you sure you want to cancel this order?"
    );

    if (!confirmCancel) {
      return;
    }

    try {
      setCancelling(true);
      setError("");

      const response = await API.put(
        `/orders/${orderId}/cancel`
      );

      if (response.data.success) {
        setOrder(response.data.order);

        alert("Order cancelled successfully.");
      }
    } catch (err) {
      console.error(
        "Cancel Order Error:",
        err
      );

      if (err.response?.status === 401) {
        localStorage.removeItem("enjoMealToken");
        localStorage.removeItem("enjoMealUser");

        navigate("/login");
        return;
      }

      setError(
        err.response?.data?.message ||
          "Failed to cancel order."
      );
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: "30px" }}>
        <h2>Loading order...</h2>
      </div>
    );
  }

  if (error && !order) {
    return (
      <div style={{ padding: "30px" }}>
        <p style={{ color: "red" }}>
          {error}
        </p>

        <button
          onClick={() =>
            navigate("/restaurants")
          }
        >
          Browse Restaurants
        </button>
      </div>
    );
  }

  if (!order) {
    return (
      <div style={{ padding: "30px" }}>
        <h2>Order not found.</h2>

        <button
          onClick={() =>
            navigate("/restaurants")
          }
        >
          Browse Restaurants
        </button>
      </div>
    );
  }

  const canCancel =
    order.orderStatus === "PLACED" ||
    order.orderStatus === "CONFIRMED";

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "30px",
        background: "#fff8f3",
      }}
    >
      <button
        onClick={() =>
          navigate("/my-orders")
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
        ← My Orders
      </button>

      <h1>Order Details</h1>

      {error && (
        <p style={{ color: "red" }}>
          {error}
        </p>
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
        <h2>
          Order #{order._id}
        </h2>

        <p>
          <strong>Status:</strong>{" "}
          {order.orderStatus}
        </p>

        <p>
          <strong>Payment:</strong>{" "}
          {order.paymentMethod}
        </p>

        <p>
          <strong>Payment Status:</strong>{" "}
          {order.paymentStatus}
        </p>

        <hr />

        <h3>Restaurant</h3>

        <p>
          {order.restaurant?.name ||
            "Restaurant"}
        </p>

        <hr />

        <h3>Items</h3>

        {order.items?.map((item, index) => (
          <div
            key={
              item.food?._id || index
            }
            style={{
              padding: "12px 0",
              borderBottom:
                "1px solid #eee",
            }}
          >
            <strong>
              {item.food?.name ||
                item.foodName ||
                "Food"}
            </strong>

            <p>
              Quantity: {item.quantity}
            </p>

            <p>
              Price: ₹{item.price}
            </p>

            <strong>
              Item Total: ₹
              {item.itemTotal ??
                Number(item.price) *
                  Number(item.quantity)}
            </strong>
          </div>
        ))}

        <hr />

        <h2>
          Subtotal: ₹
          {order.subtotal}
        </h2>

        <p>
          Delivery Fee: ₹
          {order.deliveryFee || 0}
        </p>

        <p>
          Discount: ₹
          {order.discountAmount || 0}
        </p>

        <h2>
          Total: ₹
          {order.totalAmount}
        </h2>

        <hr />

        <h3>Delivery Address</h3>

        <p>
          {order.deliveryAddress?.address}
        </p>

        <p>
          {order.deliveryAddress?.city}
        </p>

        <p>
          Pincode:{" "}
          {order.deliveryAddress?.pincode}
        </p>

        {/* CANCEL ORDER */}

        {canCancel && (
          <>
            <hr />

            <button
              onClick={
                handleCancelOrder
              }
              disabled={cancelling}
              style={{
                width: "100%",
                padding: "14px",
                border: "none",
                borderRadius: "8px",
                background: cancelling
                  ? "#aaa"
                  : "#dc3545",
                color: "#fff",
                fontWeight: "700",
                cursor: cancelling
                  ? "not-allowed"
                  : "pointer",
              }}
            >
              {cancelling
                ? "Cancelling..."
                : "Cancel Order"}
            </button>
          </>
        )}

        {order.orderStatus ===
          "CANCELLED" && (
          <p
            style={{
              marginTop: "20px",
              padding: "12px",
              background: "#ffe5e5",
              color: "#b00020",
              borderRadius: "8px",
              fontWeight: "600",
            }}
          >
            This order has been cancelled.
          </p>
        )}
      </div>
    </div>
  );
}

export default OrderDetails;