import { useCallback, useEffect, useState } from "react";
import API from "../api/api";

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

export default function RationRequests() {
  const [requests, setRequests] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [quotationItems, setQuotationItems] = useState([]);
  const [adminNote, setAdminNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [filter, setFilter] = useState("ALL");

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await API.get("/api/admin/ration-requests");
      const data = response.data;
      const list = Array.isArray(data)
        ? data
        : data.requests || [];

      setRequests(list);

      setSelectedId((current) =>
        list.some((item) => item._id === current)
          ? current
          : list[0]?._id || ""
      );
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Ration requests load nahi hui. Admin login aur API check karein."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const selectedRequest =
    requests.find((item) => item._id === selectedId) || null;

  useEffect(() => {
    if (!selectedRequest) {
      setQuotationItems([]);
      setAdminNote("");
      return;
    }

    setQuotationItems(
      (selectedRequest.items || []).map((item) => ({
        itemId: item._id,
        availability:
          item.availability === "AVAILABLE" ||
          item.availability === "UNAVAILABLE"
            ? item.availability
            : "AVAILABLE",
        quotedPrice:
          item.quotedPrice === null || item.quotedPrice === undefined
            ? ""
            : String(item.quotedPrice),
        adminNote: item.adminNote || "",
      }))
    );
    setAdminNote(selectedRequest.adminNote || "");
  }, [selectedId, selectedRequest?._id]);

  const updateItem = (itemId, field, value) => {
    setQuotationItems((current) =>
      current.map((item) =>
        item.itemId === itemId ? { ...item, [field]: value } : item
      )
    );
  };

  const saveQuotation = async () => {
    if (!selectedRequest) return;

    if (
      ["ORDERED", "CANCELLED"].includes(selectedRequest.requestStatus)
    ) {
      setError("Ordered ya cancelled request ka quotation edit nahi kar sakte.");
      return;
    }

    for (const item of quotationItems) {
      if (!item.itemId) {
        setError("Request item ID missing hai. Refresh karke dobara check karein.");
        return;
      }

      if (item.availability === "AVAILABLE") {
        const price = Number(item.quotedPrice);
        if (
          item.quotedPrice === "" ||
          !Number.isFinite(price) ||
          price < 0 ||
          price > 10000000
        ) {
          setError("Har available item ka valid unit price enter karein.");
          return;
        }
      }
    }

    if (
      !window.confirm(
        "Quotation save karne par purani customer approval reset ho jayegi. Continue?"
      )
    ) {
      return;
    }

    setSaving(true);
    setError("");
    setNotice("");

    try {
      const response = await API.put(
        `/api/admin/ration-requests/${selectedRequest._id}/quotation`,
        {
          items: quotationItems.map((item) => ({
            itemId: item.itemId,
            availability: item.availability,
            quotedPrice:
              item.availability === "AVAILABLE"
                ? Number(item.quotedPrice)
                : null,
            adminNote: item.adminNote,
          })),
          adminNote,
        }
      );

      setNotice(
        response.data?.message ||
          "Quotation save ho gaya. Customer approval required hai."
      );
      await fetchRequests();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Quotation save nahi hua. Latest request refresh karke check karein."
      );
    } finally {
      setSaving(false);
    }
  };

  const visibleRequests =
    filter === "ALL"
      ? requests
      : requests.filter((item) => item.requestStatus === filter);

  const locked =
    !selectedRequest ||
    ["ORDERED", "CANCELLED"].includes(selectedRequest.requestStatus);

  const styles = {
    page: {
      padding: 16,
      color: "#172033",
      width: "100%",
      boxSizing: "border-box",
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
      border: "1px solid #e2e8f0",
      borderRadius: 12,
      padding: 14,
      marginBottom: 12,
      background: "#fff",
    },
    field: {
      width: "100%",
      boxSizing: "border-box",
      padding: 10,
      border: "1px solid #cbd5e1",
      borderRadius: 8,
      marginTop: 5,
      background: "#fff",
      color: "#172033",
    },
  };

  return (
    <div style={styles.page}>
      <h2>Custom Ration Requests</h2>
      <button style={styles.button} onClick={fetchRequests} disabled={loading}>
        {loading ? "Loading..." : "Refresh Requests"}
      </button>

      {error && <p style={{ color: "red" }}>{error}</p>}
      {notice && <p style={{ color: "green" }}>{notice}</p>}

      <label>
        Filter:
        <select style={styles.field} value={filter} onChange={(e) => setFilter(e.target.value)}>
          {["ALL", "SUBMITTED", "QUOTATION_READY", "APPROVED", "ORDERED", "CANCELLED"].map((status) => (
            <option key={status} value={status}>{status}</option>
          ))}
        </select>
      </label>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 300px), 1fr))", gap: 16, marginTop: 16 }}>
        <section>
          {visibleRequests.map((request) => (
            <button key={request._id} style={{ ...styles.card, ...styles.button, display: "block", width: "100%", textAlign: "left", border: request._id === selectedId ? "2px solid #2563eb" : "1px solid #e2e8f0" }} onClick={() => { setSelectedId(request._id); setError(""); setNotice(""); }}>
              <strong>{request.customerName || request.customer?.name || "Customer"}</strong>
              <p>{request.customerPhone || request.customer?.phone || "Phone unavailable"}</p>
              <p>Status: {request.requestStatus}</p>
              <small>{dateTime(request.createdAt)}</small>
            </button>
          ))}
          {!loading && visibleRequests.length === 0 && <p>No requests found.</p>}
        </section>

        <section>
          {!selectedRequest ? <p>Request select karein.</p> : (
            <div style={styles.card}>
              <h3>Customer Details</h3>
              <p>Name: {selectedRequest.customerName || selectedRequest.customer?.name || "—"}</p>
              <p>Phone: {selectedRequest.customerPhone || selectedRequest.customer?.phone || "—"}</p>
              <p>Email: {selectedRequest.customerEmail || selectedRequest.customer?.email || "—"}</p>
              <p>Address: {selectedRequest.address || "—"}</p>
              <p>Customer note: {selectedRequest.customerNote || "—"}</p>
              <p>Quotation version: {selectedRequest.quotationVersion || 0}</p>

              <h3>Items & Quotation</h3>
              {quotationItems.map((item, index) => {
                const source = (selectedRequest.items || []).find((x) => x._id === item.itemId) || {};
                return (
                  <div key={item.itemId || index} style={{ ...styles.card, background: "#f8fafc" }}>
                    <strong>{source.itemName || "Item"}</strong>
                    <p>Quantity: {source.quantity ?? "—"} {source.unit || ""}</p>
                    {source.brand && <p>Brand: {source.brand}</p>}
                    {source.description && <p>{source.description}</p>}
                    {source.image && <p><a href={source.image} target="_blank" rel="noreferrer">View photo</a></p>}

                    <label>Availability
                      <select style={styles.field} value={item.availability} disabled={locked} onChange={(e) => updateItem(item.itemId, "availability", e.target.value)}>
                        <option value="AVAILABLE">Available</option>
                        <option value="UNAVAILABLE">Unavailable</option>
                      </select>
                    </label>

                    <label>Unit price (₹)
                      <input style={styles.field} type="number" min="0" step="0.01" value={item.quotedPrice} disabled={locked || item.availability !== "AVAILABLE"} onChange={(e) => updateItem(item.itemId, "quotedPrice", e.target.value)} />
                    </label>

                    <p>Item total: {item.availability === "AVAILABLE" && item.quotedPrice !== "" ? money(Number(item.quotedPrice) * Number(source.quantity || 0)) : "—"}</p>

                    <label>Item note
                      <textarea style={styles.field} rows={2} value={item.adminNote} disabled={locked} onChange={(e) => updateItem(item.itemId, "adminNote", e.target.value)} />
                    </label>
                  </div>
                );
              })}

              <label>Note for customer
                <textarea style={styles.field} rows={3} value={adminNote} disabled={locked} onChange={(e) => setAdminNote(e.target.value)} />
              </label>

              <button style={{ ...styles.button, marginTop: 12 }} disabled={locked || saving} onClick={() => {
                if (window.confirm("Quotation save karne par purani customer approval reset ho sakti hai. Continue?")) saveQuotation();
              }}>
                {saving ? "Saving..." : "Save Quotation"}
              </button>
              {locked && <p>Ordered/cancelled requests read-only hain.</p>}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
