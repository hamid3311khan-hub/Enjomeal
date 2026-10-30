import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import API from "../api/api";

const money = (value) => `₹${Number(value || 0).toFixed(2)}`;

export default function RationRequestDetails() {
  const { requestId } = useParams();
  const navigate = useNavigate();

  const [request, setRequest] = useState(null);
  const [decisions, setDecisions] = useState({});
  const [addresses, setAddresses] = useState([]);
  const [addressId, setAddressId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("COD");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const fetchRequest = useCallback(async () => {
    const { data } = await API.get(`/ration-requests/${requestId}`);
    if (!data.success || !data.request) {
      throw new Error(data.message || "Request details nahi mile.");
    }
    setRequest(data.request);
    const next = {};
    (data.request.items || []).forEach((item) => {
      next[item._id] = item.customerDecision || "PENDING";
    });
    setDecisions(next);
  }, [requestId]);

  const fetchAddresses = useCallback(async () => {
    const { data } = await API.get("/addresses/my");
    const list = Array.isArray(data)
      ? data
      : data.addresses || data.data || data.results || [];
    setAddresses(list);
    const preferred = list.find((item) => item.isDefault || item.isDefaultAddress) || list[0];
    if (preferred) setAddressId(preferred._id);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      await Promise.all([fetchRequest(), fetchAddresses()]);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Details load nahi hui.");
    } finally {
      setLoading(false);
    }
  }, [fetchRequest, fetchAddresses]);

  useEffect(() => {
    load();
  }, [load]);

  const items = request?.items || [];
  const acceptedItems = useMemo(
    () => items.filter((item) => decisions[item._id] === "ACCEPTED"),
    [items, decisions]
  );
  const acceptedTotal = acceptedItems.reduce(
    (sum, item) => sum + Number(item.quantity || 0) * Number(item.quotedPrice || 0),
    0
  );
  const allDecided = items.length > 0 && items.every(
    (item) => ["ACCEPTED", "REMOVED", "DEFERRED"].includes(decisions[item._id])
  );
  const hasDeferred = items.some((item) => decisions[item._id] === "DEFERRED");

  const saveDecisions = async (approveQuotation = false) => {
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const payload = {
        quotationVersion: request.quotationVersion,
        decisions: items.map((item) => ({
          itemId: item._id,
          decision: decisions[item._id] || "PENDING",
        })),
        approveQuotation,
      };
      const { data } = await API.put(
        `/ration-requests/${requestId}/decisions`,
        payload
      );
      if (!data.success) throw new Error(data.message || "Decisions save nahi hue.");
      if (data.request) {
        setRequest(data.request);
        const next = {};
        (data.request.items || []).forEach((item) => {
          next[item._id] = item.customerDecision || "PENDING";
        });
        setDecisions(next);
      } else {
        await fetchRequest();
      }
      setNotice(data.message || (approveQuotation ? "Quotation approved." : "Decisions saved."));
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Save nahi ho paya.");
      if (err.response?.status === 409) {
        try { await fetchRequest(); } catch {}
      }
    } finally {
      setSaving(false);
    }
  };

  const checkout = async () => {
    if (!addressId) {
      setError("Delivery address select karein.");
      return;
    }
    if (checkingOut) return;

    setCheckingOut(true);
    setError("");
    try {
      const storageKey = `enjoMealRationCheckout_${requestId}`;
      let idempotencyKey = sessionStorage.getItem(storageKey);
      if (!idempotencyKey) {
        idempotencyKey = `ration_${requestId}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
        sessionStorage.setItem(storageKey, idempotencyKey);
      }

      const { data } = await API.post(
        `/grocery/orders/ration/${requestId}/checkout`,
        {
          addressId,
          paymentMethod,
          quotationVersion: request.quotationVersion,
        },
        { headers: { "Idempotency-Key": idempotencyKey } }
      );

      if (!data.success || !data.order) {
        throw new Error(data.message || "Checkout complete nahi hua.");
      }
      sessionStorage.removeItem(storageKey);
      navigate(`/grocery/orders/${data.order._id}`, { state: { order: data.order } });
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Checkout fail hua.");
    } finally {
      setCheckingOut(false);
    }
  };

  if (loading) return <main style={{ padding: 20 }}>Request details load ho rahi hain...</main>;

  if (!request) {
    return (
      <main style={{ maxWidth: 750, margin: "auto", padding: 20 }}>
        <h1>Ration Request</h1>
        <p role="alert">{error || "Request nahi mili."}</p>
        <button onClick={load}>Retry</button>
        <p><Link to="/ration-requests">Back to my requests</Link></p>
      </main>
    );
  }

  const status = request.requestStatus;

  return (
    <main style={{ maxWidth: 850, margin: "auto", padding: 20 }}>
      <h1>Custom Ration Request</h1>
      <p><strong>Request Number:</strong> {request.requestNumber || request._id}</p>
      <p><strong>Status:</strong> {String(status).replaceAll("_", " ")}</p>

      {error && <p role="alert" style={{ color: "crimson" }}>{error}</p>}
      {notice && <p role="status" style={{ color: "green" }}>{notice}</p>}

      {status === "SUBMITTED" && (
        <p> आपकी request submit ho gayi hai. Admin quotation prepare kar raha hai. कृपया baad mein dobara check karein.</p>
      )}

      {status === "QUOTATION_READY" && (
        <>
          <h2>Review Your Quotation</h2>
          <p>Har item ke liye apna decision select karein.</p>

          {items.map((item) => (
            <section key={item._id} style={{ border: "1px solid #ddd", borderRadius: 12, padding: 14, marginBottom: 14 }}>
              {item.image && (
                <img
                  src={item.image}
                  alt={item.itemName}
                  style={{ width: 110, height: 90, objectFit: "cover", borderRadius: 8 }}
                />
              )}
              <h3>{item.itemName}</h3>
              <p>Quantity: {item.quantity} {item.unit}</p>
              {item.brand && <p>Brand: {item.brand}</p>}
              {item.description && <p>Description: {item.description}</p>}
              <p>Availability: {item.availability}</p>
              {item.adminNote && <p>Admin note: {item.adminNote}</p>}
              {item.availability === "AVAILABLE" && (
                <>
                  <p>Unit Price: {money(item.quotedPrice)}</p>
                  <p>Item Total: {money(Number(item.quantity || 0) * Number(item.quotedPrice || 0))}</p>
                </>
              )}
              <label>
                Your decision:{" "}
                <select
                  value={decisions[item._id] || "PENDING"}
                  onChange={(event) =>
                    setDecisions((current) => ({ ...current, [item._id]: event.target.value }))
                  }
                >
                  <option value="PENDING" disabled>Select decision</option>
                  {item.availability === "AVAILABLE" && <option value="ACCEPTED">Accept</option>}
                  <option value="REMOVED">Remove</option>
                  <option value="DEFERRED">Defer</option>
                </select>
              </label>
            </section>
          ))}

          <h3>Accepted Items Total: {money(acceptedTotal)}</h3>
          <button type="button" disabled={saving} onClick={() => saveDecisions(false)}>
            {saving ? "Saving..." : "Save Decisions"}
          </button>{" "}
          <button
            type="button"
            disabled={saving || !allDecided || acceptedItems.length === 0 || hasDeferred}
            onClick={() => {
              if (window.confirm("Kya aap selected items ki quotation approve karna chahte hain?")) {
                saveDecisions(true);
              }
            }}
          >
            {saving ? "Please wait..." : "Approve Quotation"}
          </button>
          {hasDeferred && <p>Approval se pehle deferred items ko Accept ya Remove karein.</p>}
        </>
      )}

      {status === "APPROVED" && (
        <section style={{ border: "1px solid #d6eadb", borderRadius: 12, padding: 16, marginTop: 20 }}>
          <h2>Quotation Approved</h2>
          <p>Approved Items Total: {money(request.approvedTotal)}</p>

          <h3>Delivery Address</h3>
          {addresses.length === 0 ? (
            <p>Saved address nahi mila. Pehle apne account mein delivery address add karein.</p>
          ) : (
            addresses.map((item) => (
              <label key={item._id} style={{ display: "block", border: addressId === item._id ? "2px solid #16803c" : "1px solid #ddd", borderRadius: 8, padding: 12, marginBottom: 10 }}>
                <input
                  type="radio"
                  name="ration-address"
                  checked={addressId === item._id}
                  onChange={() => setAddressId(item._id)}
                />{" "}
                <strong>{item.name || "Delivery Address"}</strong>
                <br />
                {item.address}{item.landmark ? `, ${item.landmark}` : ""}
                <br />
                {item.city}, {item.state} - {item.pincode}
                <br />
                Phone: {item.phone}
              </label>
            ))
          )}

          <h3>Payment Method</h3>
          <label>
            <input type="radio" name="ration-payment" checked={paymentMethod === "COD"} onChange={() => setPaymentMethod("COD")} />
            Cash on Delivery
          </label>
          <br />
          <label>
            <input type="radio" name="ration-payment" checked={paymentMethod === "QR"} onChange={() => setPaymentMethod("QR")} />
            QR Payment
          </label>
          {paymentMethod === "QR" && (
            <p>QR payment select karne par payment instructions order confirmation par check karein. Payment verification automatic nahi hai.</p>
          )}
          <br />
          <button type="button" disabled={checkingOut || addresses.length === 0} onClick={checkout}>
            {checkingOut ? "Processing..." : "Place Grocery Order"}
          </button>
        </section>
      )}

      {status === "ORDERED" && (
        <section style={{ marginTop: 20 }}>
          <h2>Order Placed</h2>
          <p>Aapki custom ration request ka order create ho chuka hai.</p>
          {request.groceryOrder && (
            <Link to={`/grocery/orders/${request.groceryOrder}`}>View Grocery Order Details</Link>
          )}
        </section>
      )}

      {status === "CANCELLED" && <p>This ration request has been cancelled.</p>}

      <p style={{ marginTop: 24 }}><Link to="/ration-requests">Back to Custom Ration List</Link></p>
    </main>
  );
}
