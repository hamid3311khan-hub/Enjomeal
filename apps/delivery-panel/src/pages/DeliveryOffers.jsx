import { useEffect, useState } from "react";

const API_URL =
  "https://enjomeal-api.onrender.com/api/settings/delivery-partner";

function DeliveryOffers() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("enjoMealDeliveryToken");

      if (!token) {
        throw new Error("Delivery login token not found.");
      }

      const response = await fetch(API_URL, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Failed to load offers"
        );
      }

      setSettings(data.settings);
    } catch (err) {
      console.error("Delivery Offers Error:", err);
      setError(
        err.message || "Failed to load delivery partner offers"
      );
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return "No expiry date";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "No expiry date";
    }

    return parsedDate.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <p style={styles.centerText}>
            Loading offers and charges...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.page}>
        <div style={styles.header}>
          <h2 style={styles.title}>
            🎁 Offers & Charges
          </h2>
        </div>

        <div style={styles.error}>
          {error}
        </div>

        <button
          onClick={loadSettings}
          style={styles.retryButton}
        >
          ↻ Retry
        </button>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      {/* HEADER */}
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>
            🎁 Offers & Charges
          </h2>

          <p style={styles.subtitle}>
            Delivery partner admission charges, offers and
            important information
          </p>
        </div>

        <button
          onClick={() =>
            (window.location.href = "/delivery/dashboard")
          }
          style={styles.backButton}
        >
          ← Dashboard
        </button>
      </div>

      {/* ADMISSION CHARGE */}
      <div style={styles.card}>
        <h3 style={styles.cardTitle}>
          💰 Admission / Registration Charge
        </h3>

        <div style={styles.amount}>
          ₹
          {Number(
            settings?.deliveryPartnerAdmissionCharge || 0
          ).toFixed(2)}
        </div>

        <p style={styles.help}>
          Current admission or registration charge for
          delivery partners.
        </p>
      </div>

      {/* OFFER */}
      <div style={styles.card}>
        <h3 style={styles.cardTitle}>
          🎁 Current Offer
        </h3>

        {settings?.deliveryPartnerOffer ? (
          <div style={styles.offerBox}>
            {settings.deliveryPartnerOffer}
          </div>
        ) : (
          <p style={styles.empty}>
            No current offer available.
          </p>
        )}

        {settings?.deliveryPartnerOfferValidUntil && (
          <p style={styles.validity}>
            📅 Valid until:{" "}
            <strong>
              {formatDate(
                settings.deliveryPartnerOfferValidUntil
              )}
            </strong>
          </p>
        )}
      </div>

      {/* INFORMATION */}
      <div style={styles.card}>
        <h3 style={styles.cardTitle}>
          ℹ️ Delivery Partner Information
        </h3>

        {settings?.deliveryPartnerInfo ? (
          <div style={styles.infoBox}>
            {settings.deliveryPartnerInfo}
          </div>
        ) : (
          <p style={styles.empty}>
            No additional information available.
          </p>
        )}
      </div>

      {/* REFRESH */}
      <button
        onClick={loadSettings}
        style={styles.refreshButton}
      >
        ↻ Refresh Information
      </button>
    </div>
  );
}

const styles = {
  page: {
    width: "100%",
    maxWidth: "900px",
    margin: "0 auto",
    padding: "20px",
    boxSizing: "border-box",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "15px",
    marginBottom: "25px",
    flexWrap: "wrap",
  },

  title: {
    margin: 0,
    fontSize: "25px",
    color: "#111827",
  },

  subtitle: {
    margin: "7px 0 0",
    color: "#6b7280",
    fontSize: "14px",
    lineHeight: "1.5",
  },

  card: {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "14px",
    padding: "22px",
    marginBottom: "18px",
    boxSizing: "border-box",
  },

  cardTitle: {
    margin: "0 0 15px",
    color: "#111827",
    fontSize: "18px",
  },

  amount: {
    fontSize: "30px",
    fontWeight: "700",
    color: "#2563eb",
  },

  help: {
    margin: "8px 0 0",
    color: "#6b7280",
    fontSize: "13px",
  },

  offerBox: {
    padding: "16px",
    borderRadius: "10px",
    background: "#f3f4f6",
    color: "#111827",
    fontSize: "16px",
    lineHeight: "1.6",
    whiteSpace: "pre-wrap",
  },

  validity: {
    margin: "14px 0 0",
    color: "#374151",
    fontSize: "13px",
  },

  infoBox: {
    padding: "16px",
    borderRadius: "10px",
    background: "#f9fafb",
    border: "1px solid #e5e7eb",
    color: "#374151",
    fontSize: "14px",
    lineHeight: "1.7",
    whiteSpace: "pre-wrap",
  },

  empty: {
    color: "#6b7280",
    fontSize: "14px",
    margin: 0,
  },

  centerText: {
    textAlign: "center",
    color: "#6b7280",
    margin: 0,
  },

  error: {
    padding: "14px",
    borderRadius: "8px",
    background: "#fee2e2",
    color: "#991b1b",
    marginBottom: "15px",
  },

  backButton: {
    border: "none",
    borderRadius: "8px",
    background: "#374151",
    color: "#ffffff",
    padding: "11px 16px",
    cursor: "pointer",
    fontWeight: "600",
  },

  retryButton: {
    border: "none",
    borderRadius: "8px",
    background: "#2563eb",
    color: "#ffffff",
    padding: "11px 18px",
    cursor: "pointer",
    fontWeight: "600",
  },

  refreshButton: {
    width: "100%",
    border: "none",
    borderRadius: "9px",
    background: "#2563eb",
    color: "#ffffff",
    padding: "13px",
    cursor: "pointer",
    fontWeight: "700",
    fontSize: "14px",
  },
};

export default DeliveryOffers;
