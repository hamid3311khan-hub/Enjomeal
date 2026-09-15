import { useEffect, useState } from "react";

const API_URL = "https://enjomeal-api.onrender.com";

function DeliveryReports() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const token = localStorage.getItem("enjoMealDeliveryToken");

  const fetchReport = async (start = "", end = "") => {
    try {
      setLoading(true);
      setError("");

      let url = `${API_URL}/api/delivery/my-report`;

      const params = new URLSearchParams();

      if (start) params.append("startDate", start);
      if (end) params.append("endDate", end);

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to load report");
      }

      setReport(data);
    } catch (err) {
      console.error(err);
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  const formatDate = (date) => {
    const d = new Date(date);

    if (Number.isNaN(d.getTime())) {
      return date;
    }

    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getDateString = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  const handleToday = () => {
    const today = getDateString(new Date());

    setStartDate(today);
    setEndDate(today);

    fetchReport(today, today);
  };

  const handleThisWeek = () => {
    const today = new Date();

    const day = today.getDay();
    const diff = day === 0 ? 6 : day - 1;

    const monday = new Date(today);
    monday.setDate(today.getDate() - diff);

    const start = getDateString(monday);
    const end = getDateString(today);

    setStartDate(start);
    setEndDate(end);

    fetchReport(start, end);
  };

  const handleThisMonth = () => {
    const today = new Date();

    const firstDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      1
    );

    const start = getDateString(firstDay);
    const end = getDateString(today);

    setStartDate(start);
    setEndDate(end);

    fetchReport(start, end);
  };

  const handleCustomSearch = () => {
    if (!startDate || !endDate) {
      setError("Please select both start and end dates.");
      return;
    }

    if (startDate > endDate) {
      setError("Start date cannot be after end date.");
      return;
    }

    fetchReport(startDate, endDate);
  };

  const clearFilter = () => {
    setStartDate("");
    setEndDate("");
    fetchReport();
  };

  const goBack = () => {
    window.location.href = "/delivery/dashboard";
  };

  const summary = report?.summary || {};

  const dateWiseOrders = report?.dateWiseOrders || [];

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f5f7fb",
        padding: "20px",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
        }}
      >
        {/* HEADER */}

        <div
          style={{
            background: "#ffffff",
            borderRadius: "16px",
            padding: "20px",
            marginBottom: "20px",
            boxShadow: "0 3px 12px rgba(0,0,0,0.08)",
          }}
        >
          <button
            onClick={goBack}
            style={{
              border: "none",
              background: "#eeeeee",
              padding: "9px 14px",
              borderRadius: "8px",
              cursor: "pointer",
              marginBottom: "15px",
              fontWeight: "600",
            }}
          >
            ← Dashboard
          </button>

          <h1
            style={{
              margin: "0 0 6px",
              fontSize: "28px",
            }}
          >
            📊 My Delivery Reports
          </h1>

          <p
            style={{
              margin: 0,
              color: "#666",
            }}
          >
            View your delivery performance and earnings.
          </p>

          {report?.deliveryPartner && (
            <div
              style={{
                marginTop: "15px",
                padding: "12px",
                background: "#f8f9fa",
                borderRadius: "10px",
              }}
            >
              <strong>
                {report.deliveryPartner.name || "Delivery Partner"}
              </strong>

              {report.deliveryPartner.phone && (
                <span style={{ marginLeft: "10px", color: "#666" }}>
                  {report.deliveryPartner.phone}
                </span>
              )}
            </div>
          )}
        </div>

        {/* FILTER BUTTONS */}

        <div
          style={{
            background: "#ffffff",
            borderRadius: "16px",
            padding: "20px",
            marginBottom: "20px",
            boxShadow: "0 3px 12px rgba(0,0,0,0.08)",
          }}
        >
          <h3 style={{ marginTop: 0 }}>Report Period</h3>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(130px, 1fr))",
              gap: "10px",
            }}
          >
            <button
              onClick={handleToday}
              style={buttonStyle}
            >
              Today
            </button>

            <button
              onClick={handleThisWeek}
              style={buttonStyle}
            >
              This Week
            </button>

            <button
              onClick={handleThisMonth}
              style={buttonStyle}
            >
              This Month
            </button>

            <button
              onClick={clearFilter}
              style={{
                ...buttonStyle,
                background: "#eeeeee",
                color: "#333",
              }}
            >
              All Time
            </button>
          </div>

          {/* CUSTOM DATE */}

          <div
            style={{
              marginTop: "20px",
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "12px",
            }}
          >
            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "6px",
                  fontWeight: "600",
                }}
              >
                Start Date
              </label>

              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                style={inputStyle}
              />
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "6px",
                  fontWeight: "600",
                }}
              >
                End Date
              </label>

              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                style={inputStyle}
              />
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "end",
              }}
            >
              <button
                onClick={handleCustomSearch}
                style={{
                  ...buttonStyle,
                  width: "100%",
                }}
              >
                🔍 Apply Filter
              </button>
            </div>
          </div>
        </div>

        {/* ERROR */}

        {error && (
          <div
            style={{
              background: "#ffe5e5",
              color: "#b00020",
              padding: "14px",
              borderRadius: "10px",
              marginBottom: "20px",
            }}
          >
            {error}
          </div>
        )}

        {/* LOADING */}

        {loading && (
          <div
            style={{
              textAlign: "center",
              padding: "30px",
            }}
          >
            Loading report...
          </div>
        )}

        {/* SUMMARY */}

        {!loading && report && (
          <>
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(160px, 1fr))",
                gap: "15px",
                marginBottom: "20px",
              }}
            >
              <StatCard
                title="Total Orders"
                value={summary.totalOrders || 0}
                icon="📦"
              />

              <StatCard
                title="Delivered"
                value={summary.deliveredOrders || 0}
                icon="✅"
              />

              <StatCard
                title="Cancelled"
                value={summary.cancelledOrders || 0}
                icon="❌"
              />

              <StatCard
                title="Active Orders"
                value={summary.activeOrders || 0}
                icon="🚴"
              />

              <StatCard
                title="Pending Orders"
                value={summary.pendingOrders || 0}
                icon="⏳"
              />

              <StatCard
                title="Delivery Charges"
                value={`₹${Number(
                  summary.totalDeliveryCharges || 0
                ).toFixed(2)}`}
                icon="💰"
              />
            </div>

            {/* DATE WISE REPORT */}

            <div
              style={{
                background: "#ffffff",
                borderRadius: "16px",
                padding: "20px",
                boxShadow: "0 3px 12px rgba(0,0,0,0.08)",
                overflowX: "auto",
              }}
            >
              <h2
                style={{
                  marginTop: 0,
                  marginBottom: "15px",
                }}
              >
                📅 Date-wise Report
              </h2>

              {dateWiseOrders.length === 0 ? (
                <p
                  style={{
                    textAlign: "center",
                    color: "#777",
                    padding: "20px",
                  }}
                >
                  No orders found for this period.
                </p>
              ) : (
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    minWidth: "650px",
                  }}
                >
                  <thead>
                    <tr>
                      <th style={thStyle}>Date</th>
                      <th style={thStyle}>Orders</th>
                      <th style={thStyle}>Delivered</th>
                      <th style={thStyle}>Cancelled</th>
                      <th style={thStyle}>Delivery Charges</th>
                    </tr>
                  </thead>

                  <tbody>
                    {dateWiseOrders.map((item) => (
                      <tr key={item._id}>
                        <td style={tdStyle}>
                          {formatDate(item._id)}
                        </td>

                        <td style={tdStyle}>
                          {item.orders || 0}
                        </td>

                        <td style={tdStyle}>
                          {item.delivered || 0}
                        </td>

                        <td style={tdStyle}>
                          {item.cancelled || 0}
                        </td>

                        <td style={tdStyle}>
                          ₹
                          {Number(
                            item.deliveryCharges || 0
                          ).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function StatCard({ title, value, icon }) {
  return (
    <div
      style={{
        background: "#ffffff",
        borderRadius: "14px",
        padding: "20px",
        boxShadow: "0 3px 12px rgba(0,0,0,0.08)",
      }}
    >
      <div
        style={{
          fontSize: "28px",
          marginBottom: "8px",
        }}
      >
        {icon}
      </div>

      <div
        style={{
          color: "#666",
          fontSize: "14px",
          marginBottom: "5px",
        }}
      >
        {title}
      </div>

      <div
        style={{
          fontSize: "24px",
          fontWeight: "700",
        }}
      >
        {value}
      </div>
    </div>
  );
}

const buttonStyle = {
  border: "none",
  background: "#007bff",
  color: "#ffffff",
  padding: "11px 15px",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: "600",
};

const inputStyle = {
  width: "100%",
  padding: "11px",
  border: "1px solid #ddd",
  borderRadius: "8px",
  boxSizing: "border-box",
  fontSize: "15px",
};

const thStyle = {
  textAlign: "left",
  padding: "12px",
  borderBottom: "2px solid #eee",
  whiteSpace: "nowrap",
};

const tdStyle = {
  padding: "12px",
  borderBottom: "1px solid #eee",
};

export default DeliveryReports;
