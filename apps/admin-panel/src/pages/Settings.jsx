import { useEffect, useState } from "react";
import { getAuthHeaders } from "../utils/auth";

const API_URL = "https://enjomeal-api.onrender.com/api/settings";

function Settings() {
  const [settings, setSettings] = useState({
    deliveryFee: 0,
    platformCharge: 0,
    freeDelivery: false,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      setError("");
      setMessage("");

      const headers = getAuthHeaders();

      if (!headers) {
        throw new Error("Authentication token not found. Please login again.");
      }

      const response = await fetch(API_URL, {
        method: "GET",
        headers,
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Failed to load settings"
        );
      }

      setSettings({
        deliveryFee: data.settings?.deliveryFee ?? 0,
        platformCharge: data.settings?.platformCharge ?? 0,
        freeDelivery: data.settings?.freeDelivery ?? false,
      });
    } catch (err) {
      console.error("Settings Load Error:", err);
      setError(err.message || "Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    setSettings((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSave = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");
      setMessage("");

      const headers = getAuthHeaders();

      if (!headers) {
        throw new Error("Authentication token not found. Please login again.");
      }

      const response = await fetch(API_URL, {
        method: "PUT",
        headers,
        body: JSON.stringify({
          deliveryFee: Number(settings.deliveryFee),
          platformCharge: Number(settings.platformCharge),
          freeDelivery: settings.freeDelivery,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Failed to update settings"
        );
      }

      setSettings({
        deliveryFee: data.settings?.deliveryFee ?? 0,
        platformCharge: data.settings?.platformCharge ?? 0,
        freeDelivery: data.settings?.freeDelivery ?? false,
      });

      setMessage("Settings updated successfully.");
    } catch (err) {
      console.error("Settings Update Error:", err);
      setError(err.message || "Failed to update settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.loading}>
        Loading settings...
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>Platform Settings</h2>
          <p style={styles.subtitle}>
            Manage EnjoMeal delivery and platform charges
          </p>
        </div>

        <button
          type="button"
          onClick={loadSettings}
          style={styles.refreshButton}
          disabled={saving}
        >
          ↻ Refresh
        </button>
      </div>

      {message && (
        <div style={styles.success}>
          {message}
        </div>
      )}

      {error && (
        <div style={styles.error}>
          {error}
        </div>
      )}

      <form onSubmit={handleSave}>
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>
            Delivery Settings
          </h3>

          <div style={styles.field}>
            <label style={styles.label}>
              Delivery Fee
            </label>

            <input
              type="number"
              name="deliveryFee"
              min="0"
              step="0.01"
              value={settings.deliveryFee}
              onChange={handleChange}
              style={styles.input}
            />

            <p style={styles.help}>
              Default delivery fee charged to customers.
            </p>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>
              Platform Charge
            </label>

            <input
              type="number"
              name="platformCharge"
              min="0"
              step="0.01"
              value={settings.platformCharge}
              onChange={handleChange}
              style={styles.input}
            />

            <p style={styles.help}>
              Platform/service charge applied to orders.
            </p>
          </div>

          <div style={styles.checkboxRow}>
            <input
              type="checkbox"
              name="freeDelivery"
              checked={settings.freeDelivery}
              onChange={handleChange}
              style={styles.checkbox}
            />

            <div>
              <label style={styles.checkboxLabel}>
                Enable Free Delivery
              </label>

              <p style={styles.help}>
                When enabled, delivery fee can be treated as free.
              </p>
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            style={styles.saveButton}
          >
            {saving ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </form>
    </div>
  );
}

const styles = {
  container: {
    width: "100%",
    boxSizing: "border-box",
  },

  loading: {
    padding: "40px",
    textAlign: "center",
    color: "#6b7280",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "15px",
    marginBottom: "25px",
    flexWrap: "wrap",
  },

  title: {
    margin: 0,
    fontSize: "24px",
    color: "#111827",
  },

  subtitle: {
    margin: "6px 0 0",
    color: "#6b7280",
    fontSize: "14px",
  },

  refreshButton: {
    border: "none",
    borderRadius: "8px",
    background: "#2563eb",
    color: "#ffffff",
    padding: "11px 18px",
    cursor: "pointer",
    fontSize: "14px",
  },

  success: {
    marginBottom: "15px",
    padding: "12px 15px",
    borderRadius: "8px",
    background: "#dcfce7",
    color: "#166534",
    border: "1px solid #bbf7d0",
  },

  error: {
    marginBottom: "15px",
    padding: "12px 15px",
    borderRadius: "8px",
    background: "#fee2e2",
    color: "#991b1b",
    border: "1px solid #fecaca",
  },

  card: {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "14px",
    padding: "25px",
    boxSizing: "border-box",
  },

  cardTitle: {
    margin: "0 0 25px",
    color: "#111827",
    fontSize: "18px",
  },

  field: {
    marginBottom: "22px",
  },

  label: {
    display: "block",
    marginBottom: "8px",
    fontWeight: "600",
    color: "#374151",
    fontSize: "14px",
  },

  input: {
    width: "100%",
    boxSizing: "border-box",
    padding: "12px",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    fontSize: "15px",
    outline: "none",
  },

  help: {
    margin: "6px 0 0",
    color: "#6b7280",
    fontSize: "12px",
  },

  checkboxRow: {
    display: "flex",
    alignItems: "flex-start",
    gap: "10px",
    marginBottom: "25px",
  },

  checkbox: {
    marginTop: "3px",
    width: "17px",
    height: "17px",
  },

  checkboxLabel: {
    fontWeight: "600",
    color: "#374151",
    fontSize: "14px",
  },

  saveButton: {
    border: "none",
    borderRadius: "8px",
    background: "#2563eb",
    color: "#ffffff",
    padding: "12px 22px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "600",
  },
};

export default Settings;
