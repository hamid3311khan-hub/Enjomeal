import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/api";

function MyOrders() {
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await API.get(
        "/orders/My-orders"
      );

      if (response.data.success) {
        setOrders(response.data.orders || []);
      }
    } catch (err) {
      console.error("My Orders Error:", err);

      if (err.response?.status === 401) {
        localStorage.removeItem("enjoMealToken");
        localStorage.removeItem("enjoMealUser");
        navigate("/login");
        return;
      }

      setError(
        err.response?.data?.message ||
          "Failed to load orders."
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: "30px" }}>
        <h2>Loading your orders...</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "30px" }}>
        <p style={{ color: "red" }}>{error}</p>

        <button onClick={() => navigate("/")}>
          Browse Restaurants
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "30px",
        background: "#fff8f3",
      }}
    >
      <button
        onClick={() => navigate("/")}
        style={{
          marginBottom: "20px",
          padding: "10px 16px",
          border: "1px solid #ddd",
          borderRadius: "8px",
          background: "#fff",
          cursor: "pointer",
        }}
      >
        ← Restaurants
      </button>

      <h1>My Orders</h1>

      {orders.length === 0 ? (
        <div
          style={{
            padding: "25px",
            background: "#fff",
            borderRadius: "12px",
            border: "1px solid #ddd",
          }}
        >
          <h2>No orders yet</h2>

          <p>
            You haven't placed any orders yet.
          </p>

          <button
            onClick={() => navigate("/")}
            style={{
              padding: "12px 20px",
              border: "none",
              borderRadius: "8px",
              background: "#e85d04",
              color: "#fff",
              fontWeight: "700",
              cursor: "pointer",
            }}
          >
            Order Food
          </button>
        </div>
      ) : (
        orders.map((order) => (
          <div
            key={order._id}
            style={{
              marginBottom: "18px",
              padding: "20px",
              background: "#fff",
              border: "1px solid #ddd",
              borderRadius: "12px",
            }}
          >
            <h2>
              {order.restaurant?.name ||
                "Restaurant"}
            </h2>

            <p>
              <strong>Order ID:</strong>{" "}
              {order._id}
            </p>

            <p>
              <strong>Status:</strong>{" "}
              {order.orderStatus}
            </p>

            <p>
              <strong>Payment:</strong>{" "}
              {order.paymentMethod} (
              {order.paymentStatus})
            </p>

            <p>
              <strong>Total:</strong> ₹
              {order.totalAmount}
            </p>

            <p>
              <strong>Date:</strong>{" "}
              {new Date(
                order.createdAt
              ).toLocaleString()}
            </p>

            <button
              onClick={() =>
                navigate(`/orders/${order._id}`)
              }
              style={{
                padding: "11px 18px",
                border: "none",
                borderRadius: "8px",
                background: "#e85d04",
                color: "#fff",
                fontWeight: "700",
                cursor: "pointer",
              }}
            >
              View Order Details
            </button>
          </div>
        ))
      )}
    </div>
  );
}

export default MyOrders;