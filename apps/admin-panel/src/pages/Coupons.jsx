import { useEffect, useState } from "react";

const API = "https://enjomeal-api.onrender.com/api/coupons";

function Coupons() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    code: "",
    description: "",
    discountType: "PERCENTAGE",
    discountValue: "",
    minimumOrderAmount: "0",
    maximumDiscount: "",
    expiryDate: "",
    usageLimit: "",
    isActive: true,
  });

  const getToken = () =>
    localStorage.getItem("enjoMealToken") ||
    localStorage.getItem("enjoMealtoken");

  const headers = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${getToken()}`,
  });

  const loadCoupons = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API}/all`, {
        headers: headers(),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to load coupons");
      }

      setCoupons(data.coupons || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCoupons();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setMessage("");
      setError("");

      const payload = {
        code: form.code.trim().toUpperCase(),
        description: form.description.trim(),
        discountType: form.discountType,
        discountValue: Number(form.discountValue),
        minimumOrderAmount: Number(form.minimumOrderAmount || 0),
        maximumDiscount:
          form.maximumDiscount === ""
            ? null
            : Number(form.maximumDiscount),
        expiryDate: form.expiryDate,
        usageLimit:
          form.usageLimit === "" ? null : Number(form.usageLimit),
        isActive: form.isActive,
      };

      const response = await fetch(`${API}/create`, {
        method: "POST",
        headers: headers(),
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to create coupon");
      }

      setMessage("Coupon created successfully.");

      setForm({
        code: "",
        description: "",
        discountType: "PERCENTAGE",
        discountValue: "",
        minimumOrderAmount: "0",
        maximumDiscount: "",
        expiryDate: "",
        usageLimit: "",
        isActive: true,
      });

      loadCoupons();
    } catch (err) {
      setError(err.message);
    }
  };

  const deleteCoupon = async (id) => {
    if (!window.confirm("Delete this coupon?")) return;

    try {
      setMessage("");
      setError("");

      const response = await fetch(`${API}/${id}`, {
        method: "DELETE",
        headers: headers(),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to delete coupon");
      }

      setMessage("Coupon deleted successfully.");
      loadCoupons();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Coupons</h1>
          <p style={styles.subtitle}>
            Manage EnjoMeal discount coupons
          </p>
        </div>

        <button style={styles.refreshButton} onClick={loadCoupons}>
          ↻ Refresh
        </button>
      </div>

      {message && <div style={styles.success}>{message}</div>}
      {error && <div style={styles.error}>{error}</div>}

      <div style={styles.card}>
        <h2 style={styles.cardTitle}>Create Coupon</h2>

        <form onSubmit={handleSubmit}>
          <div style={styles.grid}>
            <Field
              label="Coupon Code"
              name="code"
              value={form.code}
              onChange={handleChange}
              placeholder="SAVE50"
              required
            />

            <Field
              label="Description"
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Get discount on your order"
            />

            <div style={styles.field}>
              <label style={styles.label}>Discount Type</label>
              <select
                name="discountType"
                value={form.discountType}
                onChange={handleChange}
                style={styles.input}
              >
                <option value="PERCENTAGE">Percentage</option>
                <option value="FIXED">Fixed</option>
              </select>
            </div>

            <Field
              label="Discount Value"
              name="discountValue"
              type="number"
              min="0"
              value={form.discountValue}
              onChange={handleChange}
              required
            />

            <Field
              label="Minimum Order Amount"
              name="minimumOrderAmount"
              type="number"
              min="0"
              value={form.minimumOrderAmount}
              onChange={handleChange}
            />

            <Field
              label="Maximum Discount"
              name="maximumDiscount"
              type="number"
              min="0"
              value={form.maximumDiscount}
              onChange={handleChange}
              placeholder="Optional"
            />

            <div style={styles.field}>
              <label style={styles.label}>Expiry Date</label>
              <input
                type="date"
                name="expiryDate"
                value={form.expiryDate}
                onChange={handleChange}
                style={styles.input}
                required
              />
            </div>

            <Field
              label="Usage Limit"
              name="usageLimit"
              type="number"
              min="1"
              value={form.usageLimit}
              onChange={handleChange}
              placeholder="Optional"
            />
          </div>

          <label style={styles.checkbox}>
            <input
              type="checkbox"
              name="isActive"
              checked={form.isActive}
              onChange={handleChange}
            />
            <span>Active Coupon</span>
          </label>

          <button type="submit" style={styles.saveButton}>
            Create Coupon
          </button>
        </form>
      </div>

      <div style={styles.card}>
        <h2 style={styles.cardTitle}>All Coupons</h2>

        {loading ? (
          <p>Loading coupons...</p>
        ) : coupons.length === 0 ? (
          <p>No coupons found.</p>
        ) : (
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Code</th>
                  <th style={styles.th}>Discount</th>
                  <th style={styles.th}>Min Order</th>
                  <th style={styles.th}>Expiry</th>
                  <th style={styles.th}>Used</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Action</th>
                </tr>
              </thead>

              <tbody>
                {coupons.map((coupon) => (
                  <tr key={coupon._id}>
                    <td style={styles.td}>
                      <strong>{coupon.code}</strong>
                    </td>

                    <td style={styles.td}>
                      {coupon.discountType === "PERCENTAGE"
                        ? `${coupon.discountValue}%`
                        : `₹${coupon.discountValue}`}
                    </td>

                    <td style={styles.td}>
                      ₹{coupon.minimumOrderAmount || 0}
                    </td>

                    <td style={styles.td}>
                      {coupon.expiryDate
                        ? new Date(coupon.expiryDate).toLocaleDateString()
                        : "-"}
                    </td>

                    <td style={styles.td}>
                      {coupon.usedCount || 0}
                      {coupon.usageLimit
                        ? ` / ${coupon.usageLimit}`
                        : ""}
                    </td>

                    <td style={styles.td}>
                      <span
                        style={{
                          ...styles.status,
                          backgroundColor: coupon.isActive
                            ? "#dcfce7"
                            : "#fee2e2",
                          color: coupon.isActive
                            ? "#166534"
                            : "#991b1b",
                        }}
                      >
                        {coupon.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>

                    <td style={styles.td}>
                      <button
                        style={styles.deleteButton}
                        onClick={() => deleteCoupon(coupon._id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  name,
  value,
  onChange,
  type = "text",
  ...props
}) {
  return (
    <div style={styles.field}>
      <label style={styles.label}>{label}</label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        style={styles.input}
        {...props}
      />
    </div>
  );
}

const styles = {
  container: {
    padding: "24px",
    maxWidth: "1200px",
    margin: "0 auto",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "24px",
    gap: "16px",
  },

  title: {
    margin: 0,
    fontSize: "32px",
  },

  subtitle: {
    margin: "6px 0 0",
    color: "#6b7280",
  },

  refreshButton: {
    padding: "12px 20px",
    border: "none",
    borderRadius: "8px",
    background: "#2563eb",
    color: "#fff",
    cursor: "pointer",
    fontSize: "15px",
  },

  success: {
    padding: "14px",
    marginBottom: "20px",
    background: "#dcfce7",
    color: "#166534",
    borderRadius: "8px",
  },

  error: {
    padding: "14px",
    marginBottom: "20px",
    background: "#fee2e2",
    color: "#991b1b",
    borderRadius: "8px",
  },

  card: {
    background: "#fff",
    borderRadius: "14px",
    padding: "24px",
    marginBottom: "24px",
    boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
  },

  cardTitle: {
    marginTop: 0,
    marginBottom: "22px",
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: "18px",
  },

  field: {
    display: "flex",
    flexDirection: "column",
    gap: "7px",
  },

  label: {
    fontWeight: "600",
    color: "#374151",
  },

  input: {
    width: "100%",
    boxSizing: "border-box",
    padding: "12px",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    fontSize: "15px",
    background: "#fff",
  },

  checkbox: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    margin: "20px 0",
    fontWeight: "600",
  },

  saveButton: {
    padding: "13px 24px",
    border: "none",
    borderRadius: "8px",
    background: "#2563eb",
    color: "#fff",
    fontSize: "16px",
    fontWeight: "600",
    cursor: "pointer",
  },

  tableWrapper: {
    overflowX: "auto",
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: "750px",
  },

  th: {
    textAlign: "left",
    padding: "12px",
    borderBottom: "2px solid #e5e7eb",
  },

  td: {
    padding: "12px",
    borderBottom: "1px solid #e5e7eb",
  },

  status: {
    padding: "5px 10px",
    borderRadius: "20px",
    fontSize: "13px",
    fontWeight: "600",
  },

  deleteButton: {
    padding: "7px 12px",
    border: "none",
    borderRadius: "6px",
    background: "#dc2626",
    color: "#fff",
    cursor: "pointer",
  },
};

export default Coupons;
