import { useEffect, useState } from "react";

function Delivery() {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [newOrderMessage, setNewOrderMessage] = useState("");

  useEffect(() => {
    loadDeliveryPartners();
  }, []);

  // =====================================
  // GET DELIVERY PARTNERS
  // =====================================

  const loadDeliveryPartners = async () => {
    try {
      setLoading(true);
      setError("");

      const getAuthToken = () => {
  const possibleKeys = [
    "enjoMealToken",
    "token",
    "accessToken",
    "jwtToken",
  ];

  for (const key of possibleKeys) {
    const value = localStorage.getItem(key);

    if (
      value &&
      value !== "null" &&
      value !== "undefined" &&
      value.trim() !== ""
    ) {
      return value.trim();
    }
  }

  return null;
};

      const token = getAuthToken();

      if (!token) {
        throw new Error(
          "Authentication token not found. Please login again."
        );
      }

      const response = await fetch(
        "https://enjomeal-api.onrender.com/api/delivery/all",
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      console.log(
        "DELIVERY STATUS:",
        response.status
      );

      console.log(
        "DELIVERY RESPONSE:",
        data
      );

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Failed to load delivery partners"
        );
      }

      const list =
        data.deliveryPartners ||
        data.deliveries ||
        data.data ||
        [];

      setPartners(
        Array.isArray(list)
          ? list
          : []
      );

    } catch (error) {
      console.error(
        "Delivery Partners Error:",
        error
      );

      setError(
        error.message ||
          "Failed to load delivery partners"
      );

    } finally {
      setLoading(false);
    }
  };

  // =====================================
  // UPDATE DELIVERY STATUS
  // =====================================

  const handleStatusAction = async (
    partnerId,
    action
  ) => {
    try {
      setActionLoading(
        `${action}-${partnerId}`
      );

      setError("");
      setSuccess("");

      const token = getAuthToken();

      if (!token) {
        throw new Error(
          "Authentication token not found. Please login again."
        );
      }

      let url = "";
      let method = "PUT";
      let body = {};

      // =================================
      // ACTIVE / INACTIVE
      // =================================

      if (action === "activate") {
        url =
          `https://enjomeal-api.onrender.com/api/delivery/${partnerId}/active-status`;

        body = {
          isActive: true,
        };
      }

      if (action === "deactivate") {
        url =
          `https://enjomeal-api.onrender.com/api/delivery/${partnerId}/active-status`;

        body = {
          isActive: false,
        };
      }

      // =================================
      // AVAILABLE / UNAVAILABLE
      // =================================

      if (action === "available") {
        url =
          `https://enjomeal-api.onrender.com/api/delivery/${partnerId}/availability`;

        body = {
          isAvailable: true,
        };
      }

      if (action === "unavailable") {
        url =
          `https://enjomeal-api.onrender.com/api/delivery/${partnerId}/availability`;

        body = {
          isAvailable: false,
        };
      }

      // =================================
      // VALIDATE ACTION
      // =================================

      if (!url) {
        throw new Error(
          "Invalid delivery partner action."
        );
      }

      // =================================
      // API REQUEST
      // =================================

      const response = await fetch(
        url,
        {
          method,
          headers: {
            "Content-Type":
              "application/json",
            Authorization:
              `Bearer ${token}`,
          },
          body: JSON.stringify(body),
        }
      );

      const data =
        await response.json();

      console.log(
        "DELIVERY ACTION STATUS:",
        response.status
      );

      console.log(
        "DELIVERY ACTION RESPONSE:",
        data
      );

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.message ||
            "Delivery partner update failed"
        );
      }

      setSuccess(
        data.message ||
          "Delivery partner updated successfully"
      );

      await loadDeliveryPartners();

    } catch (error) {
      console.error(
        "Delivery Action Error:",
        error
      );

      setError(
        error.message ||
          "Delivery partner update failed"
      );

    } finally {
      setActionLoading("");
    }
  };

  // =====================================
  // STATUS HELPERS
  // =====================================

  const getActiveStatus = (
    partner
  ) => {
    return partner.isActive
      ? "Active"
      : "Inactive";
  };

  const getAvailabilityStatus = (
    partner
  ) => {
    return partner.isAvailable
      ? "Available"
      : "Unavailable";
  };

  // =====================================
  // UI
  // =====================================

  return (
    <div style={styles.container}>

      {/* HEADER */}

      <div style={styles.header}>

        <div>

          <h1 style={styles.title}>
            Delivery Partners
          </h1>

          <p style={styles.subtitle}>
            Manage EnjoMeal delivery partners
          </p>

        </div>

        <button
          style={styles.refreshButton}
          onClick={loadDeliveryPartners}
          disabled={loading}
        >
          {loading
            ? "Loading..."
            : "↻ Refresh"}
        </button>

      </div>

      {/* SUCCESS */}

      {success && (
        <div style={styles.successBox}>

          <span style={styles.successIcon}>
            ✓
          </span>

          <span>
            {success}
          </span>

        </div>
      )}

      {/* ERROR */}

      {error && (
        <div style={styles.errorBox}>

          <span style={styles.errorIcon}>
            ⚠️
          </span>

          <div>

            <strong>
              Something went wrong
            </strong>

            <div style={styles.errorText}>
              {error}
            </div>

          </div>

        </div>
      )}

      {/* COUNT */}

      {!loading &&
        !error &&
        partners.length > 0 && (
          <div style={styles.countBar}>

            <span>
              Total Delivery Partners
            </span>

            <strong>
              {partners.length}
            </strong>

          </div>
        )}

      {/* LOADING */}

      {loading && (
        <div style={styles.loading}>

          <div style={styles.loadingIcon}>
            🛵
          </div>

          <p>
            Loading delivery partners...
          </p>

        </div>
      )}

      {/* EMPTY */}

      {!loading &&
        !error &&
        partners.length === 0 && (
          <div style={styles.empty}>

            <div style={styles.emptyIcon}>
              🛵
            </div>

            <h2>
              No Delivery Partners Found
            </h2>

            <p>
              There are currently no
              delivery partners registered.
            </p>

          </div>
        )}

      {/* PARTNER GRID */}

      {!loading &&
        !error &&
        partners.length > 0 && (
          <div style={styles.grid}>

            {partners.map((partner) => (

              <div
                key={partner._id}
                style={styles.card}
              >

                {/* CARD HEADER */}

                <div style={styles.cardHeader}>

                  <div style={styles.icon}>
                    🛵
                  </div>

                  <div style={styles.nameArea}>

                    <h2
                      style={styles.partnerName}
                    >
                      {partner.name ||
                        "Unnamed Partner"}
                    </h2>

                    <p
                      style={styles.partnerRole}
                    >
                      Delivery Partner
                    </p>

                  </div>

                </div>

                {/* EMAIL */}

                {partner.email && (
                  <div style={styles.infoRow}>

                    <span>
                      Email
                    </span>

                    <strong
                      style={styles.valueText}
                    >
                      {partner.email}
                    </strong>

                  </div>
                )}

                {/* PHONE */}

                {partner.phone && (
                  <div style={styles.infoRow}>

                    <span>
                      Phone
                    </span>

                    <strong
                      style={styles.valueText}
                    >
                      {partner.phone}
                    </strong>

                  </div>
                )}

                {/* VEHICLE TYPE */}

                <div style={styles.infoRow}>

                  <span>
                    Vehicle
                  </span>

                  <strong
                    style={styles.valueText}
                  >
                    {partner.vehicleType ||
                      "Not specified"}
                  </strong>

                </div>

                {/* VEHICLE NUMBER */}

                {partner.vehicleNumber && (
                  <div style={styles.infoRow}>

                    <span>
                      Vehicle No.
                    </span>

                    <strong
                      style={styles.valueText}
                    >
                      {partner.vehicleNumber}
                    </strong>

                  </div>
                )}

                {/* ACTIVE STATUS */}

                <div style={styles.statusRow}>

                  <span>
                    Account
                  </span>

                  <span
                    style={
                      partner.isActive
                        ? styles.activeText
                        : styles.inactiveText
                    }
                  >
                    {getActiveStatus(partner)}
                  </span>

                </div>

                {/* AVAILABILITY */}

                <div style={styles.statusRow}>

                  <span>
                    Availability
                  </span>

                  <span
                    style={
                      partner.isAvailable
                        ? styles.availableText
                        : styles.unavailableText
                    }
                  >
                    {getAvailabilityStatus(partner)}
                  </span>

                </div>

                {/* ACTIONS */}

                <div style={styles.actions}>
                  {/* =================================
                    ACTIVATE
                ================================= */}

                {!partner.isActive && (
                  <button
                    style={
                      styles.activateButton
                    }
                    disabled={
                      actionLoading ===
                      `activate-${partner._id}`
                    }
                    onClick={() =>
                      handleStatusAction(
                        partner._id,
                        "activate"
                      )
                    }
                  >
                    {actionLoading ===
                    `activate-${partner._id}`
                      ? "..."
                      : "Activate"}
                  </button>
                )}

                {/* =================================
                    DEACTIVATE
                ================================= */}

                {partner.isActive && (
                  <button
                    style={
                      styles.deactivateButton
                    }
                    disabled={
                      actionLoading ===
                      `deactivate-${partner._id}`
                    }
                    onClick={() =>
                      handleStatusAction(
                        partner._id,
                        "deactivate"
                      )
                    }
                  >
                    {actionLoading ===
                    `deactivate-${partner._id}`
                      ? "..."
                      : "Deactivate"}
                  </button>
                )}

                {/* =================================
                    AVAILABLE
                ================================= */}

                {partner.isActive &&
                  !partner.isAvailable && (
                    <button
                      style={
                        styles.availableButton
                      }
                      disabled={
                        actionLoading ===
                        `available-${partner._id}`
                      }
                      onClick={() =>
                        handleStatusAction(
                          partner._id,
                          "available"
                        )
                      }
                    >
                      {actionLoading ===
                      `available-${partner._id}`
                        ? "..."
                        : "Set Available"}
                    </button>
                  )}

                {/* =================================
                    UNAVAILABLE
                ================================= */}

                {partner.isAvailable && (
                  <button
                    style={
                      styles.unavailableButton
                    }
                    disabled={
                      actionLoading ===
                      `unavailable-${partner._id}`
                    }
                    onClick={() =>
                      handleStatusAction(
                        partner._id,
                        "unavailable"
                      )
                    }
                  >
                    {actionLoading ===
                    `unavailable-${partner._id}`
                      ? "..."
                      : "Set Unavailable"}
                  </button>
                )}

              </div>

              {/* =================================
                  CARD FOOTER
              ================================= */}

              <div style={styles.footer}>
                ID:{" "}
                {partner._id
                  ? partner._id.slice(-8)
                  : "N/A"}
              </div>

            </div>
          ))}

        </div>
      )}

    </div>
  );
}
// =====================================================
// STYLES
// =====================================================

const styles = {

  // =============================================
  // CONTAINER
  // =============================================

  container: {
    minHeight: "calc(100vh - 75px)",
    width: "100%",
    maxWidth: "100%",
    padding: "25px",
    boxSizing: "border-box",
    background: "#f5f7fb",
    overflowX: "hidden",
  },

  // =============================================
  // HEADER
  // =============================================

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "20px",
    marginBottom: "25px",
    flexWrap: "wrap",
  },

  title: {
    margin: 0,
    fontSize: "28px",
    color: "#111827",
  },

  subtitle: {
    margin: "6px 0 0",
    color: "#6b7280",
    fontSize: "14px",
  },

  // =============================================
  // REFRESH BUTTON
  // =============================================

  refreshButton: {
    border: "none",
    borderRadius: "8px",
    padding: "10px 18px",
    background: "#2563eb",
    color: "#ffffff",
    fontWeight: "600",
    cursor: "pointer",
  },

  // =============================================
  // SUCCESS
  // =============================================

  successBox: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "13px 15px",
    marginBottom: "18px",
    borderRadius: "10px",
    background: "#ecfdf5",
    border: "1px solid #a7f3d0",
    color: "#047857",
    fontSize: "13px",
  },

  successIcon: {
    fontWeight: "bold",
  },

  // =============================================
  // ERROR
  // =============================================

  errorBox: {
    display: "flex",
    alignItems: "flex-start",
    gap: "9px",
    padding: "14px 15px",
    marginBottom: "18px",
    borderRadius: "10px",
    background: "#fef2f2",
    border: "1px solid #fecaca",
    color: "#991b1b",
    fontSize: "13px",
  },

  errorIcon: {
    flexShrink: 0,
  },

  errorText: {
    marginTop: "4px",
  },

  // =============================================
  // COUNT BAR
  // =============================================

  countBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "10px",
    padding: "13px 17px",
    marginBottom: "20px",
    color: "#6b7280",
    fontSize: "13px",
  },

  // =============================================
  // LOADING
  // =============================================

  loading: {
    minHeight: "300px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    color: "#6b7280",
  },

  loadingIcon: {
    fontSize: "38px",
    marginBottom: "10px",
  },

  // =============================================
  // EMPTY
  // =============================================

  empty: {
    background: "#ffffff",
    padding: "55px 25px",
    borderRadius: "14px",
    textAlign: "center",
    border: "1px solid #e5e7eb",
  },

  emptyIcon: {
    fontSize: "42px",
  },

  // =============================================
  // GRID
  // =============================================

  grid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(240px, 1fr))",
    gap: "16px",
    width: "100%",
    maxWidth: "100%",
    boxSizing: "border-box",
  },

  // =============================================
  // CARD
  // =============================================

  card: {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "14px",
    padding: "20px",
    boxSizing: "border-box",
    minWidth: 0,
    width: "100%",
    boxShadow:
      "0 2px 8px rgba(0,0,0,0.05)",
  },

  // =============================================
  // CARD HEADER
  // =============================================

  cardHeader: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "18px",
  },

  icon: {
    width: "48px",
    height: "48px",
    borderRadius: "10px",
    background: "#eff6ff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "23px",
    flexShrink: 0,
  },

  nameArea: {
    minWidth: 0,
    flex: 1,
  },

  partnerName: {
    margin: 0,
    fontSize: "17px",
    color: "#111827",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },

  partnerRole: {
    margin: "4px 0 0",
    fontSize: "12px",
    color: "#6b7280",
  },

  // =============================================
  // INFO ROW
  // =============================================

  infoRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "15px",
    padding: "7px 0",
    fontSize: "13px",
    color: "#6b7280",
  },

  valueText: {
    color: "#374151",
    textAlign: "right",
    overflow: "hidden",
    textOverflow: "ellipsis",
    maxWidth: "65%",
  },

  // =============================================
  // STATUS ROW
  // =============================================

  statusRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "15px",
    padding: "8px 0",
    fontSize: "13px",
    color: "#6b7280",
    borderTop: "1px solid #f1f5f9",
  },

  activeText: {
    color: "#16a34a",
    fontWeight: "600",
  },

  inactiveText: {
    color: "#dc2626",
    fontWeight: "600",
  },

  availableText: {
    color: "#16a34a",
    fontWeight: "600",
  },

  unavailableText: {
    color: "#f59e0b",
    fontWeight: "600",
  },

  // =============================================
  // ACTIONS
  // =============================================

  actions: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    marginTop: "18px",
    paddingTop: "15px",
    borderTop: "1px solid #f1f5f9",
  },
  // =============================================
  // ACTIVATE BUTTON
  // =============================================

  activateButton: {
    border: "none",
    background: "#2563eb",
    color: "#ffffff",
    padding: "8px 11px",
    borderRadius: "7px",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: "600",
  },

  // =============================================
  // DEACTIVATE BUTTON
  // =============================================

  deactivateButton: {
    border: "none",
    background: "#f59e0b",
    color: "#ffffff",
    padding: "8px 11px",
    borderRadius: "7px",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: "600",
  },

  // =============================================
  // AVAILABLE BUTTON
  // =============================================

  availableButton: {
    border: "none",
    background: "#16a34a",
    color: "#ffffff",
    padding: "8px 11px",
    borderRadius: "7px",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: "600",
  },

  // =============================================
  // UNAVAILABLE BUTTON
  // =============================================

  unavailableButton: {
    border: "1px solid #fed7aa",
    background: "#fff7ed",
    color: "#ea580c",
    padding: "8px 11px",
    borderRadius: "7px",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: "600",
  },

  // =============================================
  // FOOTER
  // =============================================

  footer: {
    marginTop: "13px",
    paddingTop: "10px",
    borderTop:
      "1px solid #f1f5f9",
    color: "#9ca3af",
    fontSize: "10px",
  },

  // =============================================
  // DISABLED BUTTON
  // =============================================

  disabledButton: {
    opacity: 0.6,
    cursor: "not-allowed",
  },

};
export default Delivery;

                