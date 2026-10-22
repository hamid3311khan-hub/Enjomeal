import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../api/api";

const money = (value) => `₹${Number(value || 0).toFixed(2)}`;

const readableStatus = (status) =>
  String(status || "PLACED").replaceAll("_", " ");

export default function GroceryMyOrders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");

  const fetchOrders = useCallback(async () => {
    setError("");
    try {
      const { data } = await API.get("/grocery/orders/my-orders");
      if (!data.success) throw new Error(data.message || "Orders load nahi hue.");
      setOrders(Array.isArray(data.orders) ? data.orders : []);
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem("enjoMealToken");
        localStorage.removeItem("enjoMealUser");
        navigate("/login");
        return;
      }
      setError(err.response?.data?.message || err.message || "Grocery orders load nahi ho paye.");
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const cancelOrder = async (order) => {
    const label = order.orderNumber || order._id;
    if (!window.confirm(`Grocery order ${label} cancel karna hai? Stock sirf successful cancellation par restore hoga.`)) return;

    setBusyId(order._id);
    setError("");
    try {
      const { data } = await API.post(
        `/grocery/orders/${order._id}/cancel`,
        { reason: "Cancelled by customer" }
      );
      if (!data.success) throw new Error(data.message || "Order cancel nahi hua.");
      await fetchOrders();
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Order cancel nahi ho paya.");
    } finally {
      setBusyId("");
    }
  };

  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: 20, minHeight: "70vh" }}>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 20 }}>
        <Link to="/grocery">← Grocery Shopping</Link>
        <Link to="/grocery/cart">Grocery Cart</Link>
      </div>
      <h1>My Grocery Orders</h1>
      <button onClick={fetchOrders} disabled={loading} style={{ padding: "9px 14px", marginBottom: 16 }}>
        Refresh Orders
      </button>

      {error && <p role="alert" style={{ color: "crimson" }}>{error}</p>}
      {loading ? <p>Grocery orders load ho rahe hain...</p> : orders.length === 0 ? (
        <section style={{ padding: 20, border: "1px solid #ddd", borderRadius: 12 }}>
          <h2>Abhi koi grocery order nahi hai</h2>
          <Link to="/grocery">Grocery shopping shuru karein</Link>
        </section>
      ) : orders.map((order) => (
        <section key={order._id} style={{ padding: 18, marginBottom: 16, border: "1px solid #ddd", borderRadius: 12, background: "#fff" }}>
          <h2 style={{ marginTop: 0 }}>Order {order.orderNumber || order._id}</h2>
          <p><strong>Status:</strong> {readableStatus(order.orderStatus)}</p>
          <p><strong>Payment:</strong> {order.paymentMethod || "COD"} ({order.paymentStatus || "PENDING"})</p>
          <p><strong>Total:</strong> {money(order.totalAmount)}</p>
          <p><strong>Date:</strong> {order.createdAt ? new Date(order.createdAt).toLocaleString() : "—"}</p>
          <p><strong>Items:</strong> {(order.items || []).map((item) => `${item.productName || "Grocery item"} × ${item.quantity}`).join(", ") || "—"}</p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button onClick={() => navigate(`/grocery/orders/${order._id}`)} style={{ padding: "10px 14px" }}>
              View Order Details
            </button>
            {order.orderStatus === "PLACED" && (
              <button
                onClick={() => cancelOrder(order)}
                disabled={busyId === order._id}
                style={{ padding: "10px 14px", color: "#b42318" }}
              >
                {busyId === order._id ? "Cancelling..." : "Cancel Order"}
              </button>
            )}
          </div>
        </section>
      ))}
    </main>
  );
}
