import { useEffect, useState } from "react";

function Dashboard() {
  const [stats, setStats] = useState({
    restaurants: 0,
    customers: 0,
    deliveryPartners: 0,
    orders: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    try {
      setLoading(true);
      setError("");

      // ============================================
      // GET LOGIN TOKEN
      // ============================================

      const token =
        localStorage.getItem("enjoMealToken") ||
        localStorage.getItem("enjoMealtoken");

      if (!token) {
        throw new Error(
          "Authentication token not found. Please login again."
        );
      }

      // ============================================
      // API REQUEST
      // ============================================

      const response = await fetch(
        "https://enjomeal-api.onrender.com/api/admin/dashboard-stats",
        {
          method: "GET",

          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token.trim()}`,
          },
        }
      );

      const data = await response.json();

      console.log("Dashboard API Response:", data);

      // ============================================
      // ERROR HANDLING
      // ============================================

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Failed to load dashboard stats"
        );
      }

      // ============================================
      // SET STATS
      // ============================================

      setStats({
        restaurants:
          data.stats?.totalRestaurants || 0,

        customers:
          data.stats?.totalCustomers || 0,

        deliveryPartners:
          data.stats?.totalDeliveryPartners || 0,

        orders:
          data.stats?.totalOrders || 0,
      });

    } catch (error) {
      console.error(
        "Dashboard Error:",
        error
      );

      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: "Restaurants",
      value: stats.restaurants,
      icon: "🍽️",
      description: "Registered restaurants",
    },

    {
      title: "Customers",
      value: stats.customers,
      icon: "👥",
      description: "Registered customers",
    },

    {
      title: "Delivery Partners",
      value: stats.deliveryPartners,
      icon: "🛵",
      description: "Active partners",
    },

    {
      title: "Total Orders",
      value: stats.orders,
      icon: "📦",
      description: "Orders on platform",
    },
  ];

  return (
    <div style={styles.container}>

      {/* =========================================
          HEADER
      ========================================= */}

      <div style={styles.header}>

        <div>
          <h1 style={styles.title}>
            Admin Dashboard
          </h1>

          <p style={styles.subtitle}>
            Monitor and manage your EnjoMeal platform
          </p>
        </div>

        <button
          style={styles.refreshButton}
          onClick={loadDashboardStats}
          disabled={loading}
        >
          {loading
            ? "Refreshing..."
            : "↻ Refresh"}
        </button>

      </div>


      {/* =========================================
          ERROR
      ========================================= */}

      {error && (
        <div style={styles.errorBox}>

          <strong>
            Unable to load dashboard
          </strong>

          <span>
            {error}
          </span>

        </div>
      )}


      {/* =========================================
          LOADING
      ========================================= */}

      {loading ? (

        <div style={styles.loadingBox}>

          <div style={styles.spinner}></div>

          <p>
            Loading dashboard...
          </p>

        </div>

      ) : (

        <>

          {/* =====================================
              STAT CARDS
          ===================================== */}

          <div style={styles.grid}>

            {statCards.map((card) => (

              <div
                style={styles.card}
                key={card.title}
              >

                <div style={styles.cardTop}>

                  <div style={styles.iconBox}>
                    {card.icon}
                  </div>

                  <span style={styles.cardLabel}>
                    EnjoMeal
                  </span>

                </div>


                <h2 style={styles.cardValue}>
                  {card.value}
                </h2>


                <h3 style={styles.cardTitle}>
                  {card.title}
                </h3>


                <p style={styles.cardDescription}>
                  {card.description}
                </p>

              </div>

            ))}

          </div>


          {/* =====================================
              PLATFORM OVERVIEW
          ===================================== */}

          <div style={styles.section}>

            <div style={styles.sectionHeader}>

              <div>

                <h2 style={styles.sectionTitle}>
                  Platform Overview
                </h2>

                <p style={styles.sectionSubtitle}>
                  Current EnjoMeal platform statistics
                </p>

              </div>

            </div>


            <div style={styles.overviewGrid}>

              <div style={styles.overviewItem}>

                <span style={styles.overviewIcon}>
                  🍽️
                </span>

                <div>

                  <strong style={styles.overviewValue}>
                    {stats.restaurants}
                  </strong>

                  <p style={styles.overviewLabel}>
                    Restaurants
                  </p>

                </div>

              </div>


              <div style={styles.overviewItem}>

                <span style={styles.overviewIcon}>
                  👥
                </span>

                <div>

                  <strong style={styles.overviewValue}>
                    {stats.customers}
                  </strong>

                  <p style={styles.overviewLabel}>
                    Customers
                  </p>

                </div>

              </div>


              <div style={styles.overviewItem}>

                <span style={styles.overviewIcon}>
                  🛵
                </span>

                <div>

                  <strong style={styles.overviewValue}>
                    {stats.deliveryPartners}
                  </strong>

                  <p style={styles.overviewLabel}>
                    Delivery Partners
                  </p>

                </div>

              </div>


              <div style={styles.overviewItem}>

                <span style={styles.overviewIcon}>
                  📦
                </span>

                <div>

                  <strong style={styles.overviewValue}>
                    {stats.orders}
                  </strong>

                  <p style={styles.overviewLabel}>
                    Total Orders
                  </p>

                </div>

              </div>

            </div>

          </div>

        </>

      )}

    </div>
  );
}


// =================================================
// STYLES
// =================================================

const styles = {

  container: {
    width: "100%",
    minHeight: "100vh",
    padding: "28px",
    boxSizing: "border-box",
    background: "#f8fafc",
    fontFamily:
      "Arial, Helvetica, sans-serif",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "20px",
    marginBottom: "28px",
    flexWrap: "wrap",
  },

  title: {
    margin: 0,
    fontSize: "28px",
    fontWeight: "700",
    color: "#111827",
  },

  subtitle: {
    margin: "7px 0 0",
    fontSize: "14px",
    color: "#6b7280",
  },

  refreshButton: {
    border: "none",
    borderRadius: "8px",
    padding: "11px 18px",
    background: "#2563eb",
    color: "#ffffff",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    boxShadow:
      "0 2px 6px rgba(37, 99, 235, 0.2)",
  },

  errorBox: {
    display: "flex",
    flexDirection: "column",
    gap: "5px",
    padding: "14px 16px",
    marginBottom: "22px",
    borderRadius: "10px",
    background: "#fef2f2",
    border: "1px solid #fecaca",
    color: "#991b1b",
    fontSize: "13px",
  },

  loadingBox: {
    minHeight: "300px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    color: "#6b7280",
  },

  spinner: {
    width: "30px",
    height: "30px",
    borderRadius: "50%",
    border: "3px solid #e5e7eb",
    borderTop:
      "3px solid #2563eb",
    marginBottom: "12px",
  },

  grid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "20px",
    width: "100%",
  },

  card: {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "14px",
    padding: "22px",
    minWidth: 0,
    boxSizing: "border-box",
    boxShadow:
      "0 2px 8px rgba(15, 23, 42, 0.04)",
  },

  cardTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "18px",
  },

  iconBox: {
    width: "42px",
    height: "42px",
    borderRadius: "10px",
    background: "#eff6ff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "20px",
  },

  cardLabel: {
    fontSize: "11px",
    fontWeight: "600",
    color: "#9ca3af",
  },

  cardValue: {
    margin: 0,
    fontSize: "32px",
    lineHeight: "1",
    color: "#111827",
    fontWeight: "700",
  },

  cardTitle: {
    margin: "12px 0 5px",
    fontSize: "15px",
    color: "#374151",
  },

  cardDescription: {
    margin: 0,
    fontSize: "12px",
    color: "#9ca3af",
  },

  section: {
    marginTop: "28px",
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "14px",
    padding: "22px",
    boxSizing: "border-box",
  },

  sectionHeader: {
    marginBottom: "20px",
  },

  sectionTitle: {
    margin: 0,
    fontSize: "18px",
    color: "#111827",
  },

  sectionSubtitle: {
    margin: "5px 0 0",
    fontSize: "13px",
    color: "#6b7280",
  },

  overviewGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "14px",
  },

  overviewItem: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "16px",
    borderRadius: "10px",
    background: "#f8fafc",
    border: "1px solid #f1f5f9",
  },

  overviewIcon: {
    fontSize: "21px",
  },

  overviewValue: {
    display: "block",
    fontSize: "20px",
    color: "#111827",
  },

  overviewLabel: {
    margin: "3px 0 0",
    fontSize: "12px",
    color: "#6b7280",
  },
};

export default Dashboard;