import { useEffect, useState } from "react";

function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("enjoMealToken");

      const response = await fetch(
        "https://enjomeal-api.onrender.com/api/admin/customers",
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Failed to load customers"
        );
      }

      setCustomers(
        data.customers ||
        data.users ||
        data.data ||
        []
      );
    } catch (error) {
      console.error("Customers Error:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>

      {/* HEADER */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>
            Customers
          </h1>

          <p style={styles.subtitle}>
            Manage EnjoMeal customers
          </p>
        </div>

        <button
          style={styles.refreshButton}
          onClick={loadCustomers}
        >
          ↻ Refresh
        </button>
      </div>

      {/* LOADING */}
      {loading && (
        <div style={styles.message}>
          Loading customers...
        </div>
      )}

      {/* ERROR */}
      {!loading && error && (
        <div style={styles.error}>
          {error}
        </div>
      )}

      {/* EMPTY */}
      {!loading &&
        !error &&
        customers.length === 0 && (
          <div style={styles.empty}>
            <div style={styles.emptyIcon}>
              👥
            </div>

            <h2>No Customers Found</h2>

            <p>
              There are no customers available
              right now.
            </p>
          </div>
        )}

      {/* CUSTOMER CARDS */}
      {!loading &&
        !error &&
        customers.length > 0 && (
          <div style={styles.grid}>
            {customers.map((customer) => (
              <div
                key={customer._id}
                style={styles.card}
              >
                <div style={styles.cardHeader}>
                  <div style={styles.avatar}>
                    {(
                      customer.name ||
                      "C"
                    )
                      .charAt(0)
                      .toUpperCase()}
                  </div>

                  <div>
                    <h3 style={styles.name}>
                      {customer.name ||
                        "Customer"}
                    </h3>

                    <p style={styles.role}>
                      Customer
                    </p>
                  </div>
                </div>

                <div style={styles.info}>
                  <div>
                    <span>Email</span>
                    <strong>
                      {customer.email ||
                        "N/A"}
                    </strong>
                  </div>

                  <div>
                    <span>Phone</span>
                    <strong>
                      {customer.phone ||
                        "N/A"}
                    </strong>
                  </div>

                  <div>
                    <span>Status</span>
                    <strong
                      style={
                        customer.isActive === false
                          ? styles.inactive
                          : styles.active
                      }
                    >
                      {customer.isActive === false
                        ? "Inactive"
                        : "Active"}
                    </strong>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
    </div>
  );
}

const styles = {
  container: {
    padding: "30px",
    minHeight: "calc(100vh - 75px)",
    background: "#f5f7fb",
    boxSizing: "border-box",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "25px",
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
    color: "#fff",
    cursor: "pointer",
    fontSize: "14px",
  },

  message: {
    background: "#fff",
    padding: "30px",
    borderRadius: "12px",
    textAlign: "center",
    color: "#6b7280",
  },

  error: {
    background: "#fee2e2",
    color: "#b91c1c",
    padding: "15px",
    borderRadius: "10px",
  },

  empty: {
    background: "#fff",
    padding: "50px 20px",
    borderRadius: "12px",
    textAlign: "center",
    color: "#6b7280",
  },

  emptyIcon: {
    fontSize: "45px",
    marginBottom: "10px",
  },

  grid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "20px",
  },

  card: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
    padding: "20px",
    boxSizing: "border-box",
  },

  cardHeader: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "20px",
  },

  avatar: {
    width: "45px",
    height: "45px",
    borderRadius: "50%",
    background: "#eff6ff",
    color: "#2563eb",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "18px",
    fontWeight: "bold",
  },

  name: {
    margin: 0,
    fontSize: "17px",
    color: "#111827",
  },

  role: {
    margin: "3px 0 0",
    fontSize: "12px",
    color: "#6b7280",
  },

  info: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },

  active: {
    color: "#16a34a",
  },

  inactive: {
    color: "#dc2626",
  },
};

export default Customers;