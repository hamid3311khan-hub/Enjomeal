import { useEffect, useState } from "react";
import { Link, useParams, useLocation } from "react-router-dom";
import API from "../api/api";

export default function GroceryOrderDetails() {
  const { orderId } = useParams();
  const location = useLocation();

  const [order, setOrder] = useState(location.state?.order || null);
  const [loading, setLoading] = useState(!location.state?.order);
  const [error, setError] = useState("");
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    let active = true;

    API.get(`/grocery/orders/${orderId}`)
      .then(({ data }) => {
        if (active && data.success && data.order) {
          setOrder(data.order);
          setError("");
        } else if (active) {
          setError("Grocery order details nahi mile.");
        }
      })
      .catch((err) => {
        if (active) {
          setError(
            err.response?.data?.message ||
              "Order details load nahi ho paye. Please refresh karke try karein."
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [orderId]);

  const cancelOrder = async () => {
    if (order?.orderStatus !== "PLACED" || cancelling) return;
    const confirmed = window.confirm("Kya aap is grocery order ko cancel karna chahte hain?");
    if (!confirmed) return;

    setCancelling(true);
    setError("");
    try {
      const { data } = await API.post(
        `/grocery/orders/${order._id}/cancel`,
        { reason: "Cancelled by customer" }
      );
      if (!data.success || !data.order) {
        throw new Error(data.message || "Order cancel nahi ho paya.");
      }
      setOrder(data.order);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Order cancel nahi ho paya. Please dobara try karein."
      );
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return <main style={{ padding: 24 }}>Order details load ho rahi hain...</main>;
  }

  if (!order) {
    return (
      <main style={{ maxWidth: 700, margin: "auto", padding: 20 }}>
        <h1>Grocery Order</h1>
        <p role="alert" style={{ color: "crimson" }}>
          {error || "Order nahi mila."}
        </p>
        <button onClick={() => window.location.reload()}>Try Again</button>
        <p><Link to="/grocery">Continue Shopping</Link></p>
      </main>
    );
  }

  const address = order.deliveryAddress || {};
  const items = Array.isArray(order.items) ? order.items : [];
  const money = (value) => `₹${Number(value || 0).toFixed(2)}`;

  const statusLabel = String(order.orderStatus || "PLACED")
    .replaceAll("_", " ");

  return (
    <main style={{ maxWidth: 800, margin: "auto", padding: 20 }}>
      <section
        style={{
          border: "1px solid #d6eadb",
          borderRadius: 12,
          padding: 20,
          marginBottom: 20,
        }}
      >
        <h1>Grocery Order Confirmation</h1>
        <p style={{ color: "green", fontWeight: 600 }}>
          Order details successfully loaded.
        </p>
        <p>
          <strong>Order Number:</strong>{" "}
          {order.orderNumber || order._id}
        </p>
        <p>
          <strong>Order Status:</strong> {statusLabel}
        </p>
        <p>
          <strong>Payment Method:</strong> {order.paymentMethod || "COD"}
        </p>
        <p>
          <strong>Payment Status:</strong>{" "}
          {order.paymentStatus || "PENDING"}
        </p>
        {error && <p role="alert">{error}</p>}
      </section>

      <section
        style={{
          border: "1px solid #ddd",
          borderRadius: 12,
          padding: 20,
          marginBottom: 20,
        }}
      >
        <h2>Items Ordered</h2>
        {items.length === 0 ? (
          <p>Order items ki details available nahi hain.</p>
        ) : (
          items.map((item, index) => (
            <div
              key={item._id || item.product || index}
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
                borderBottom: "1px solid #eee",
                padding: "10px 0",
              }}
            >
              <span>
                {item.productName || item.name || "Grocery Product"}
                {" × "}
                {item.quantity}
                {item.unit ? ` ${item.unit}` : ""}
              </span>
              <strong>{money(item.itemTotal)}</strong>
            </div>
          ))
        )}

        <div style={{ marginTop: 16 }}>
          <p>Subtotal: {money(order.subtotal)}</p>
          <p>Delivery Fee: {money(order.deliveryFee)}</p>
          <p>Platform Charge: {money(order.platformCharge)}</p>
          <p>GST: {money(order.gstAmount)}</p>
          {Number(order.discountAmount || 0) > 0 && (
            <p>Discount: −{money(order.discountAmount)}</p>
          )}
          <h3>Total: {money(order.totalAmount)}</h3>
        </div>
      </section>

      <section
        style={{
          border: "1px solid #ddd",
          borderRadius: 12,
          padding: 20,
          marginBottom: 20,
        }}
      >
        <h2>Delivery Address</h2>
        <p><strong>{address.contactName || address.name || "Customer"}</strong></p>
        <p>
          {address.address}
          {address.landmark ? `, ${address.landmark}` : ""}
        </p>
        <p>
          {[address.city, address.state, address.pincode]
            .filter(Boolean)
            .join(", ")}
        </p>
        {address.contactPhone && <p>Phone: {address.contactPhone}</p>}
      </section>

      <button onClick={() => window.location.reload()}>
        Refresh Order Status
      </button>
      {order.orderType !== "RATION" && order.orderStatus === "PLACED" && (
        <button
          onClick={cancelOrder}
          disabled={cancelling}
          style={{ marginLeft: 12, color: "#b42318", padding: "8px 12px" }}
        >
          {cancelling ? "Cancelling..." : "Cancel Order"}
        </button>
      )}
      <Link
        to="/grocery/orders"
        style={{ display: "inline-block", marginLeft: 16 }}
      >
        My Grocery Orders
      </Link>
      <Link
        to="/grocery"
        style={{ display: "inline-block", marginLeft: 16 }}
      >
        Continue Grocery Shopping
      </Link>
    </main>
  );
}
