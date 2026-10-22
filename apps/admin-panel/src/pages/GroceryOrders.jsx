import { useCallback, useEffect, useState } from "react";
import API from "../api/api";

const STATUSES = [
  "PLACED",
  "CONFIRMED",
  "PACKING",
  "READY_FOR_PICKUP",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
];

const NEXT_STATUS = {
  PLACED: "CONFIRMED",
  CONFIRMED: "PACKING",
  PACKING: "READY_FOR_PICKUP",
  READY_FOR_PICKUP: "OUT_FOR_DELIVERY",
  OUT_FOR_DELIVERY: "DELIVERED",
};

const money = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const dateTime = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString("en-IN");
};

export default function GroceryOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [updatingId, setUpdatingId] = useState("");

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await API.get("/api/grocery/orders/admin");
      const data = response.data;
      setOrders(Array.isArray(data) ? data : data.orders || []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Grocery orders load nahi ho sake. Admin login aur API check karein."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const updateStatus = async (order) => {
    const nextStatus = NEXT_STATUS[order.orderStatus];
    if (!nextStatus) return;

    const confirmed = window.confirm(
      `Order ${order.orderNumber || order._id} ka status ${nextStatus} karna hai?`
    );
    if (!confirmed) return;

    setUpdatingId(order._id);
    setError("");
    setNotice("");

    try {
      const response = await API.put(
        `/api/grocery/orders/admin/${order._id}/status`,
        { orderStatus: nextStatus }
      );

      const updatedOrder = response.data?.order;
      if (updatedOrder) {
        setOrders((current) =>
          current.map((item) =>
            item._id === updatedOrder._id ? updatedOrder : item
          )
        );
      } else {
        await fetchOrders();
      }

      setNotice(`Order status ${nextStatus} ho gaya.`);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Order status update nahi hua."
      );
    } finally {
      setUpdatingId("");
    }
  };

  const visibleOrders =
    filter === "ALL"
      ? orders
      : orders.filter((order) => order.orderStatus === filter);

  const styles = {
    page: { padding: 16, color: "#172033", width: "100%", boxSizing: "border-box" },
    header: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: 12,
      flexWrap: "wrap",
      marginBottom: 18,
    },
    button: {
      border: "1px solid #d0d5dd",
      borderRadius: 8,
      padding: "9px 12px",
      background: "#fff",
      color: "#172033",
      cursor: "pointer",
    },
    card: {
      border: "1px solid #e4e7ec",
      borderRadius: 12,
      padding: 16,
      marginBottom: 14,
      background: "#fff",
      boxShadow: "0 2px 6px rgba(16,24,40,0.04)",
    },
    muted: { color: "#667085", fontSize: 13 },
    badge: {
      display: "inline-block",
      padding: "5px 8px",
      borderRadius: 6,
      background: "#eef2ff",
      color: "#3730a3",
      fontSize: 12,
      fontWeight: 700,
      overflowWrap: "anywhere",
    },
    grid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
      gap: 12,
      marginTop: 12,
    },
  };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h2 style={{ margin: "0 0 6px" }}>Grocery Orders</h2>
          <div style={styles.muted}>
            Total {orders.length} grocery orders
          </div>
        </div>
        <button style={styles.button} onClick={fetchOrders} disabled={loading}>
          {loading ? "Loading..." : "↻ Refresh Orders"}
        </button>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
        <select
          aria-label="Filter grocery orders by status"
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
          style={{ ...styles.button, maxWidth: "100%" }}
        >
          <option value="ALL">All statuses</option>
          {STATUSES.map((status) => (
            <option key={status} value={status}>
              {status.replaceAll("_", " ")}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div role="alert" style={{ padding: 12, marginBottom: 14, borderRadius: 8, background: "#fef3f2", color: "#b42318" }}>
          {error}
        </div>
      )}
      {notice && (
        <div role="status" style={{ padding: 12, marginBottom: 14, borderRadius: 8, background: "#ecfdf3", color: "#027a48" }}>
          {notice}
        </div>
      )}

      {loading ? (
        <p>Grocery orders load ho rahe hain...</p>
      ) : visibleOrders.length === 0 ? (
        <div style={styles.card}>
          Abhi is filter mein koi grocery order nahi mila.
        </div>
      ) : (
        visibleOrders.map((order) => {
          const customer = order.user || {};
          const address = order.deliveryAddress || {};

          return (
            <section key={order._id} style={styles.card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
                <div>
                  <strong>
                    Order #{order.orderNumber || String(order._id).slice(-8)}
                  </strong>
                  <div style={{ ...styles.muted, marginTop: 5 }}>
                    {dateTime(order.createdAt)}
                  </div>
                </div>
                <span style={styles.badge}>
                  {(order.orderStatus || "UNKNOWN").replaceAll("_", " ")}
                </span>
              </div>

              <div style={styles.grid}>
                <div>
                  <strong>Customer</strong>
                  <div>{customer.name || "Name unavailable"}</div>
                  <div style={styles.muted}>{customer.phone || customer.email || "Contact unavailable"}</div>
                </div>
                <div>
                  <strong>Delivery Address</strong>
                  <div>{address.contactName || customer.name || "—"}</div>
                  <div style={styles.muted}>
                    {[address.address, address.landmark, address.city, address.state, address.pincode]
                      .filter(Boolean)
                      .join(", ") || "Address unavailable"}
                  </div>
                  {address.contactPhone && <div style={styles.muted}>{address.contactPhone}</div>}
                </div>
                <div>
                  <strong>Payment</strong>
                  <div>{order.paymentMethod || "—"} · {order.paymentStatus || "—"}</div>
                  <div style={{ marginTop: 5 }}>
                    <strong>Total: {money(order.totalAmount)}</strong>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: 16 }}>
                <strong>Items</strong>
                {(order.items || []).map((item, index) => (
                  <div
                    key={item._id || `${item.product || item.productName}-${index}`}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 12,
                      padding: "9px 0",
                      borderBottom: "1px solid #f0f1f3",
                    }}
                  >
                    <span>
                      {item.productName || "Grocery item"} × {item.quantity} {item.unit || ""}
                    </span>
                    <strong>{money(item.itemTotal)}</strong>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 14, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                <div style={styles.muted}>
                  Delivery partner: {order.deliveryPartner?.name || "Not assigned"}
                </div>
                {NEXT_STATUS[order.orderStatus] && (
                  <button
                    style={{
                      ...styles.button,
                      background: "#175cd3",
                      borderColor: "#175cd3",
                      color: "#fff",
                      opacity: updatingId === order._id ? 0.65 : 1,
                    }}
                    disabled={Boolean(updatingId)}
                    onClick={() => updateStatus(order)}
                  >
                    {updatingId === order._id
                      ? "Updating..."
                      : `Mark ${NEXT_STATUS[order.orderStatus].replaceAll("_", " ")}`}
                  </button>
                )}
              </div>
            </section>
          );
        })
      )}
    </div>
  );
}
