import { useEffect, useState } from "react";

function Restaurants() {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    loadRestaurants();
  }, []);

  // =====================================
  // GET TOKEN
  // =====================================

  const getToken = () => {
    const token =
      localStorage.getItem("enjoMealToken") ||
      localStorage.getItem("enjoMealToken");

    if (!token) {
      throw new Error(
        "Authentication token not found. Please login again."
      );
    }

    return token.trim();
  };

  // =====================================
  // GET RESTAURANTS
  // =====================================

  const loadRestaurants = async () => {
    try {
      setLoading(true);
      setError("");
      setSuccess("");

      const token = getToken();

      const response = await fetch(
        "http://localhost:5000/api/admin/restaurants",
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
        "Restaurants API Response:",
        data
      );

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Failed to load restaurants"
        );
      }

      setRestaurants(
        Array.isArray(data.restaurants)
          ? data.restaurants
          : []
      );
    } catch (error) {
      console.error(
        "Restaurants Error:",
        error
      );

      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // =====================================
  // RESTAURANT ACTION
  // =====================================

  const handleAction = async (
    restaurantId,
    action
  ) => {
    try {
      setActionLoading(
        `${action}-${restaurantId}`
      );

      setError("");
      setSuccess("");

      // =================================
      // DELETE CONFIRMATION
      // =================================

      if (action === "delete") {
        const confirmed = window.confirm(
          "Are you sure you want to delete this restaurant?"
        );

        if (!confirmed) {
          setActionLoading("");
          return;
        }
      }

      // =================================
      // TOKEN
      // =================================

      const token = getToken();

      // =================================
      // METHOD + URL
      // =================================

      let method = "PUT";
      let url = "";

      if (action === "approve") {
        url =
          `http://localhost:5000/api/admin/restaurants/${restaurantId}/approve`;
      }

      if (action === "reject") {
        url =
          `http://localhost:5000/api/admin/restaurants/${restaurantId}/reject`;
      }

      if (action === "activate") {
        url =
          `http://localhost:5000/api/admin/restaurants/${restaurantId}/activate`;
      }

      if (action === "deactivate") {
        url =
          `http://localhost:5000/api/admin/restaurants/${restaurantId}/deactivate`;
      }

      if (action === "delete") {
        method = "DELETE";

        url =
          `http://localhost:5000/api/admin/restaurants/${restaurantId}`;
      }

      // =================================
      // API REQUEST
      // =================================

      const response = await fetch(url, {
        method,

        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      console.log(
        "Restaurant Action Response:",
        data
      );

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Restaurant action failed"
        );
      }

      // =================================
      // SUCCESS
      // =================================

      setSuccess(
        data.message ||
          "Restaurant updated successfully"
      );

      // Refresh restaurant list
      await loadRestaurants();
    } catch (error) {
      console.error(
        "Restaurant Action Error:",
        error
      );

      setError(error.message);
    } finally {
      setActionLoading("");
    }
  };

  // =====================================
  // STATUS BADGE
  // =====================================

  const getStatusStyle = (status) => {
    if (status === "APPROVED") {
      return {
        ...styles.status,
        ...styles.approved,
      };
    }

    if (status === "REJECTED") {
      return {
        ...styles.status,
        ...styles.rejected,
      };
    }

    return {
      ...styles.status,
      ...styles.pending,
    };
  };

  // =====================================
  // UI
  // =====================================

  return (
    <div style={styles.container}>

      {/* =================================
          HEADER
      ================================= */}

      <div style={styles.header}>

        <div>
          <h1 style={styles.title}>
            Restaurants
          </h1>

          <p style={styles.subtitle}>
            Manage EnjoMeal restaurants
          </p>
        </div>

        <button
          style={styles.refreshButton}
          onClick={loadRestaurants}
          disabled={loading}
        >
          {loading
            ? "Loading..."
            : "↻ Refresh"}
        </button>

      </div>


      {/* =================================
          SUCCESS MESSAGE
      ================================= */}

      {success && (
        <div style={styles.successBox}>
          <span>✓</span>

          <span>
            {success}
          </span>
        </div>
      )}


      {/* =================================
          ERROR MESSAGE
      ================================= */}

      {error && (
        <div style={styles.errorBox}>

          <span>⚠️</span>

          <div>

            <strong>
              Something went wrong
            </strong>

            <div>
              {error}
            </div>

          </div>

        </div>
      )}


      {/* =================================
          RESTAURANT COUNT
      ================================= */}

      {!loading &&
        !error &&
        restaurants.length > 0 && (

          <div style={styles.countBar}>

            <span>
              Total Restaurants
            </span>

            <strong>
              {restaurants.length}
            </strong>

          </div>
        )}


      {/* =================================
          LOADING
      ================================= */}

      {loading && (
        <div style={styles.loading}>

          <div style={styles.loadingIcon}>
            🍽️
          </div>

          <p>
            Loading restaurants...
          </p>

        </div>
      )}


      {/* =================================
          EMPTY
      ================================= */}

      {!loading &&
        !error &&
        restaurants.length === 0 && (

          <div style={styles.empty}>

            <div style={styles.emptyIcon}>
              🍽️
            </div>

            <h2>
              No Restaurants Found
            </h2>

            <p>
              There are currently no
              restaurants registered.
            </p>

          </div>
        )}


      {/* =================================
          RESTAURANT GRID
      ================================= */}

      {!loading &&
        restaurants.length > 0 && (

          <div style={styles.grid}>

            {restaurants.map(
              (restaurant) => (

                <div
                  key={restaurant._id}
                  style={styles.card}
                >

                  {/* CARD TOP */}

                  <div style={styles.cardHeader}>

                    <div style={styles.icon}>
                      🍽️
                    </div>

                    <div style={styles.nameArea}>

                      <h2
                        style={
                          styles.restaurantName
                        }
                      >
                        {restaurant.name ||
                          "Unnamed Restaurant"}
                      </h2>

                      <p
                        style={
                          styles.location
                        }
                      >
                        📍{" "}
                        {restaurant.city ||
                          "Location unavailable"}
                      </p>

                    </div>

                  </div>


                  {/* APPROVAL STATUS */}

                  <div style={styles.statusRow}>

                    <span
                      style={styles.statusLabel}
                    >
                      Approval
                    </span>

                    <span
                      style={getStatusStyle(
                        restaurant.approvalStatus
                      )}
                    >
                      {restaurant.approvalStatus ||
                        "PENDING"}
                    </span>

                  </div>


                  {/* ACTIVE STATUS */}

                  <div style={styles.infoRow}>

                    <span>
                      Account
                    </span>

                    <span
                      style={
                        restaurant.isActive
                          ? styles.activeText
                          : styles.inactiveText
                      }
                    >
                      {restaurant.isActive
                        ? "● Active"
                        : "● Inactive"}
                    </span>

                  </div>


                  {/* OPEN STATUS */}

                  <div style={styles.infoRow}>

                    <span>
                      Restaurant
                    </span>

                    <span
                      style={
                        restaurant.isOpen
                          ? styles.activeText
                          : styles.inactiveText
                      }
                    >
                      {restaurant.isOpen
                        ? "Open"
                        : "Closed"}
                    </span>

                  </div>


                  {/* OWNER */}

                  {restaurant.ownerName && (
                    <div style={styles.infoRow}>

                      <span>
                        Owner
                      </span>

                      <strong>
                        {restaurant.ownerName}
                      </strong>

                    </div>
                  )}


                  {/* PHONE */}

                  {restaurant.phone && (
                    <div style={styles.infoRow}>

                      <span>
                        Phone
                      </span>

                      <strong>
                        {restaurant.phone}
                      </strong>

                    </div>
                  )}


                  {/* CUISINE */}

                  {Array.isArray(
                    restaurant.cuisine
                  ) &&
                    restaurant.cuisine.length > 0 && (

                      <div
                        style={
                          styles.cuisineRow
                        }
                      >

                        {restaurant.cuisine
                          .slice(0, 3)
                          .map((item) => (

                            <span
                              key={item}
                              style={
                                styles.cuisineTag
                              }
                            >
                              {item}
                            </span>

                          ))}

                      </div>
                    )}


                  {/* =================================
                      ACTIONS
                  ================================= */}

                  <div style={styles.actions}>

                    {/* PENDING */}

                    {restaurant.approvalStatus ===
                      "PENDING" && (
                      <>
                        <button
                          style={
                            styles.approveButton
                          }
                          disabled={
                            actionLoading ===
                            `approve-${restaurant._id}`
                          }
                          onClick={() =>
                            handleAction(
                              restaurant._id,
                              "approve"
                            )
                          }
                        >
                          {actionLoading ===
                          `approve-${restaurant._id}`
                            ? "..."
                            : "✓ Approve"}
                        </button>

                        <button
                          style={
                            styles.rejectButton
                          }
                          disabled={
                            actionLoading ===
                            `reject-${restaurant._id}`
                          }
                          onClick={() =>
                            handleAction(
                              restaurant._id,
                              "reject"
                            )
                          }
                        >
                          {actionLoading ===
                          `reject-${restaurant._id}`
                            ? "..."
                            : "✕ Reject"}
                        </button>
                      </>
                    )}

                    {/* REJECTED */}

                    {restaurant.approvalStatus ===
                      "REJECTED" && (
                      <button
                        style={
                          styles.approveButton
                        }
                        disabled={
                          actionLoading ===
                          `approve-${restaurant._id}`
                        }
                        onClick={() =>
                          handleAction(
                            restaurant._id,
                            "approve"
                          )
                        }
                      >
                        {actionLoading ===
                        `approve-${restaurant._id}`
                          ? "..."
                          : "✓ Approve"}
                      </button>
                    )}
                    {/* APPROVED + ACTIVE */}

                    {restaurant.approvalStatus ===
                      "APPROVED" &&
                      restaurant.isActive && (
                        <button
                          style={
                            styles.deactivateButton
                          }
                          disabled={
                            actionLoading ===
                            `deactivate-${restaurant._id}`
                          }
                          onClick={() =>
                            handleAction(
                              restaurant._id,
                              "deactivate"
                            )
                          }
                        >
                          {actionLoading ===
                          `deactivate-${restaurant._id}`
                            ? "..."
                            : "Deactivate"}
                        </button>
                      )}

                    {/* APPROVED + INACTIVE */}

                    {restaurant.approvalStatus ===
                      "APPROVED" &&
                      !restaurant.isActive && (
                        <button
                          style={
                            styles.activateButton
                          }
                          disabled={
                            actionLoading ===
                            `activate-${restaurant._id}`
                          }
                          onClick={() =>
                            handleAction(
                              restaurant._id,
                              "activate"
                            )
                          }
                        >
                          {actionLoading ===
                          `activate-${restaurant._id}`
                            ? "..."
                            : "Activate"}
                        </button>
                      )}

                    {/* DELETE */}

                    <button
                      style={styles.deleteButton}
                      disabled={
                        actionLoading ===
                        `delete-${restaurant._id}`
                      }
                      onClick={() =>
                        handleAction(
                          restaurant._id,
                          "delete"
                        )
                      }
                    >
                      {actionLoading ===
                      `delete-${restaurant._id}`
                        ? "..."
                        : "🗑 Delete"}
                    </button>

                  </div>


                  {/* FOOTER */}

                  <div style={styles.footer}>
                    ID:{" "}
                    {restaurant._id?.slice(-8)}
                  </div>

                </div>
              )
            )}

          </div>
        )}

    </div>
  );
}


// =====================================================
// STYLES
// =====================================================

const styles = {

  container: {
    minHeight: "calc(100vh - 75px)",
    width: "100%",
    maxWidth: "100%",
    padding: "25px",
    boxSizing: "border-box",
    background: "#f5f7fb",
    overflowX: "hidden",
  },

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

  refreshButton: {
    border: "none",
    borderRadius: "8px",
    padding: "10px 18px",
    background: "#2563eb",
    color: "#ffffff",
    fontWeight: "600",
    cursor: "pointer",
  },

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

  grid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(240px, 1fr))",
    gap: "16px",
    width: "100%",
    maxWidth: "100%",
    boxSizing: "border-box",
  },

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

  restaurantName: {
    margin: 0,
    fontSize: "17px",
    color: "#111827",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },

  location: {
    margin: "4px 0 0",
    fontSize: "12px",
    color: "#6b7280",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },

  statusRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "10px",
    paddingBottom: "12px",
    borderBottom:
      "1px solid #f1f5f9",
    marginBottom: "10px",
    fontSize: "13px",
  },

  statusLabel: {
    color: "#6b7280",
  },

  status: {
    padding: "5px 9px",
    borderRadius: "20px",
    fontSize: "10px",
    fontWeight: "700",
  },

  approved: {
    background: "#dcfce7",
    color: "#166534",
  },

  pending: {
    background: "#fef3c7",
    color: "#92400e",
  },

  rejected: {
    background: "#fee2e2",
    color: "#991b1b",
  },

  infoRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "15px",
    padding: "7px 0",
    fontSize: "13px",
    color: "#6b7280",
  },

  activeText: {
    color: "#16a34a",
    fontWeight: "600",
  },

  inactiveText: {
    color: "#dc2626",
    fontWeight: "600",
  },

  cuisineRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: "6px",
    marginTop: "10px",
  },

  cuisineTag: {
    background: "#f3f4f6",
    color: "#4b5563",
    padding: "5px 8px",
    borderRadius: "6px",
    fontSize: "11px",
  },

  actions: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    marginTop: "18px",
    paddingTop: "15px",
    borderTop:
      "1px solid #f1f5f9",
  },

  approveButton: {
    border: "none",
    background: "#16a34a",
    color: "#ffffff",
    padding: "8px 11px",
    borderRadius: "7px",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: "600",
  },

  rejectButton: {
    border: "none",
    background: "#dc2626",
    color: "#ffffff",
    padding: "8px 11px",
    borderRadius: "7px",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: "600",
  },

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

  deleteButton: {
    border: "1px solid #fecaca",
    background: "#fff1f2",
    color: "#dc2626",
    padding: "8px 11px",
    borderRadius: "7px",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: "600",
  },

  footer: {
    marginTop: "13px",
    paddingTop: "10px",
    borderTop:
      "1px solid #f1f5f9",
    color: "#9ca3af",
    fontSize: "10px",
  },
};

export default Restaurants;