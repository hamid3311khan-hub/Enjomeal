import { useEffect, useState } from "react";
import jsPDF from "jspdf";

const API_URL =
  "https://enjomeal-api.onrender.com/api/orders/restaurant-reports";

const getToken = () => {
  return (
    localStorage.getItem("enjoMealAdminToken") ||
    localStorage.getItem("enjoMealToken") ||
    localStorage.getItem("token")
  );
};

const formatMoney = (value) => {
  return `₹${Number(value || 0).toFixed(2)}`;
};

const RestaurantReports = () => {
  const [reports, setReports] = useState([]);
  const [grandTotal, setGrandTotal] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [filter, setFilter] = useState("month");

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const getDateRange = (selectedFilter) => {
    const today = new Date();

    const formatDate = (date) => {
      const year = date.getFullYear();

      const month = String(
        date.getMonth() + 1
      ).padStart(2, "0");

      const day = String(
        date.getDate()
      ).padStart(2, "0");

      return `${year}-${month}-${day}`;
    };

    if (selectedFilter === "today") {
      const date = formatDate(today);

      return {
        startDate: date,
        endDate: date,
      };
    }

    if (selectedFilter === "week") {
      const start = new Date(today);

      const day = start.getDay();

      const difference =
        day === 0 ? 6 : day - 1;

      start.setDate(
        start.getDate() - difference
      );

      return {
        startDate: formatDate(start),
        endDate: formatDate(today),
      };
    }

    if (selectedFilter === "month") {
      const start = new Date(
        today.getFullYear(),
        today.getMonth(),
        1
      );

      return {
        startDate: formatDate(start),
        endDate: formatDate(today),
      };
    }

    return {
      startDate: "",
      endDate: "",
    };
  };

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError("");

      const token = getToken();

      if (!token) {
        throw new Error(
          "Admin authentication token not found."
        );
      }

      let query = "";

      if (filter === "custom") {
        if (!startDate || !endDate) {
          setReports([]);
          setGrandTotal(null);
          setLoading(false);
          return;
        }

        query =
          `?startDate=${startDate}&endDate=${endDate}`;
      } else {
        const range =
          getDateRange(filter);

        query =
          `?startDate=${range.startDate}&endDate=${range.endDate}`;
      }

      const response = await fetch(
        `${API_URL}${query}`,
        {
          method: "GET",
          headers: {
            "Content-Type":
              "application/json",
            Authorization:
              `Bearer ${token}`,
          },
        }
      );

      const data =
        await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Failed to fetch restaurant reports."
        );
      }

      setReports(
        Array.isArray(data.reports)
          ? data.reports
          : []
      );

      setGrandTotal(
        data.grandTotal || null
      );
    } catch (err) {
      console.error(
        "Restaurant Reports Error:",
        err
      );

      setError(
        err.message ||
          "Unable to load restaurant reports."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (filter !== "custom") {
      fetchReports();
    }
  }, [filter]);

  const handleCustomSearch = () => {
    if (!startDate || !endDate) {
      setError(
        "Please select both start and end dates."
      );
      return;
    }

    if (startDate > endDate) {
      setError(
        "Start date cannot be after end date."
      );
      return;
    }

    fetchReports();
  };

  /*
   * ADMIN RESTAURANT PDF
   * IMPORTANT:
   * This function is INSIDE RestaurantReports
   * so it can access reports, grandTotal and filters.
   */
  const handleDownloadPDF = () => {
    try {
      const doc = new jsPDF();

      const pdfMoney = (value) =>
        `Rs. ${Number(value || 0).toLocaleString(
          "en-IN",
          {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }
        )}`;

      const getReportPeriod = () => {
        if (filter === "today") {
          return "Today";
        }

        if (filter === "week") {
          return "This Week";
        }

        if (filter === "month") {
          return "This Month";
        }

        if (filter === "custom") {
          return `${startDate || "N/A"} to ${
            endDate || "N/A"
          }`;
        }

        return "All Time";
      };

      const period =
        getReportPeriod();

      let y = 20;

      // HEADER
      doc.setFontSize(20);
      doc.setFont(undefined, "bold");

      doc.text(
        "EnjoMeal",
        20,
        y
      );

      y += 10;

      doc.setFontSize(16);

      doc.text(
        "ADMIN RESTAURANT REPORT",
        20,
        y
      );

      y += 10;

      doc.setFontSize(11);
      doc.setFont(undefined, "normal");

      doc.text(
        `Report Period: ${period}`,
        20,
        y
      );

      y += 15;

      // GRAND SUMMARY
      doc.setFontSize(14);
      doc.setFont(undefined, "bold");

      doc.text(
        "Grand Summary",
        20,
        y
      );

      y += 9;

      doc.setFontSize(10);
      doc.setFont(undefined, "normal");

      const summaryData = [
        [
          "Total Orders",
          grandTotal?.totalOrders || 0,
        ],
        [
          "Delivered",
          grandTotal?.completedOrders || 0,
        ],
        [
          "Cancelled",
          grandTotal?.cancelledOrders || 0,
        ],
        [
          "Food Sales",
          pdfMoney(
            grandTotal?.foodSales
          ),
        ],
        [
          "Discount",
          pdfMoney(
            grandTotal?.discount
          ),
        ],
        [
          "Delivery Charges",
          pdfMoney(
            grandTotal?.deliveryCharges
          ),
        ],
        [
          "Platform Charges",
          pdfMoney(
            grandTotal?.platformCharges
          ),
        ],
        [
          "Restaurant Sales",
          pdfMoney(
            grandTotal?.restaurantSales
          ),
        ],
        [
          "Customer Collection",
          pdfMoney(
            grandTotal?.customerCollection
          ),
        ],
      ];

      summaryData.forEach(
        ([label, value]) => {
          doc.text(
            `${label}: ${value}`,
            20,
            y
          );

          y += 7;
        }
      );

      y += 8;

      // RESTAURANT-WISE REPORT
      doc.setFontSize(14);
      doc.setFont(undefined, "bold");

      doc.text(
        "Restaurant-wise Report",
        20,
        y
      );

      y += 10;

      reports.forEach(
        (restaurant, index) => {
          if (y > 250) {
            doc.addPage();
            y = 20;
          }

          doc.setFontSize(12);
          doc.setFont(undefined, "bold");

          doc.text(
            `${index + 1}. ${
              restaurant.restaurantName ||
              "Restaurant"
            }`,
            20,
            y
          );

          y += 8;

          doc.setFontSize(10);
          doc.setFont(undefined, "normal");

          doc.text(
            `Orders: ${
              restaurant.totalOrders || 0
            }`,
            25,
            y
          );

          y += 6;

          doc.text(
            `Delivered: ${
              restaurant.completedOrders || 0
            }`,
            25,
            y
          );

          y += 6;

          doc.text(
            `Cancelled: ${
              restaurant.cancelledOrders || 0
            }`,
            25,
            y
          );

          y += 6;

          doc.text(
            `Food Sales: ${pdfMoney(
              restaurant.foodSales
            )}`,
            25,
            y
          );

          y += 6;
                    doc.text(
            `Discount: ${pdfMoney(
              restaurant.discount
            )}`,
            25,
            y
          );

          y += 6;

          doc.text(
            `Delivery Charges: ${pdfMoney(
              restaurant.deliveryCharges
            )}`,
            25,
            y
          );

          y += 6;

          doc.text(
            `Platform Charges: ${pdfMoney(
              restaurant.platformCharges
            )}`,
            25,
            y
          );

          y += 6;

          doc.text(
            `Restaurant Sales: ${pdfMoney(
              restaurant.restaurantSales
            )}`,
            25,
            y
          );

          y += 6;

          doc.text(
            `Customer Collection: ${pdfMoney(
              restaurant.customerCollection
            )}`,
            25,
            y
          );

          y += 10;

          doc.line(
            20,
            y,
            190,
            y
          );

          y += 10;
        }
      );

      if (reports.length === 0) {
        doc.setFontSize(11);

        doc.text(
          "No restaurant reports found for this period.",
          20,
          y
        );

        y += 10;
      }

      // FOOTER
      if (y > 270) {
        doc.addPage();
        y = 20;
      }

      doc.setFontSize(9);
      doc.setFont(undefined, "normal");

      doc.text(
        "Generated from EnjoMeal Admin Panel",
        20,
        y
      );

      const fileName =
        `EnjoMeal-Admin-Restaurant-Report-${period
          .replace(/[^a-z0-9]/gi, "-")
          .toLowerCase()}.pdf`;

      doc.save(fileName);
    } catch (error) {
      console.error(
        "Admin Restaurant PDF generation failed:",
        error
      );

      setError(
        "Unable to generate PDF. Please try again."
      );
    }
  };

  return (
    <div style={styles.container}>
      {/* HEADER */}

      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>
            Restaurant Reports
          </h1>

          <p style={styles.subtitle}>
            View restaurant-wise orders,
            sales and collection reports.
          </p>
        </div>

        <button
          style={styles.refreshButton}
          onClick={fetchReports}
        >
          🔄 Refresh
        </button>
      </div>

      {/* FILTERS */}

      <div style={styles.filterCard}>
        <div style={styles.filterTitle}>
          Report Period
        </div>

        <div style={styles.filterButtons}>
          <button
            style={{
              ...styles.filterButton,
              ...(filter === "today"
                ? styles.activeFilter
                : {}),
            }}
            onClick={() =>
              setFilter("today")
            }
          >
            Today
          </button>

          <button
            style={{
              ...styles.filterButton,
              ...(filter === "week"
                ? styles.activeFilter
                : {}),
            }}
            onClick={() =>
              setFilter("week")
            }
          >
            This Week
          </button>

          <button
            style={{
              ...styles.filterButton,
              ...(filter === "month"
                ? styles.activeFilter
                : {}),
            }}
            onClick={() =>
              setFilter("month")
            }
          >
            This Month
          </button>

          <button
            style={{
              ...styles.filterButton,
              ...(filter === "custom"
                ? styles.activeFilter
                : {}),
            }}
            onClick={() =>
              setFilter("custom")
            }
          >
            Custom
          </button>
        </div>

        {filter === "custom" && (
          <div style={styles.customFilters}>
            <div style={styles.dateGroup}>
              <label>
                Start Date
              </label>

              <input
                type="date"
                value={startDate}
                onChange={(e) =>
                  setStartDate(
                    e.target.value
                  )
                }
                style={styles.dateInput}
              />
            </div>

            <div style={styles.dateGroup}>
              <label>
                End Date
              </label>

              <input
                type="date"
                value={endDate}
                onChange={(e) =>
                  setEndDate(
                    e.target.value
                  )
                }
                style={styles.dateInput}
              />
            </div>

            <button
              style={styles.searchButton}
              onClick={
                handleCustomSearch
              }
            >
              Search Report
            </button>
          </div>
        )}
      </div>

      {/* ERROR */}

      {error && (
        <div style={styles.error}>
          {error}
        </div>
      )}

      {/* LOADING */}

      {loading ? (
        <div style={styles.loading}>
          Loading restaurant reports...
        </div>
      ) : (
        <>
          {/* SUMMARY */}

          {grandTotal && (
            <div style={styles.summaryGrid}>
              <SummaryCard
                title="Total Orders"
                value={
                  grandTotal.totalOrders
                }
                icon="📦"
              />

              <SummaryCard
                title="Delivered"
                value={
                  grandTotal.completedOrders
                }
                icon="✅"
              />

              <SummaryCard
                title="Cancelled"
                value={
                  grandTotal.cancelledOrders
                }
                icon="❌"
              />

              <SummaryCard
                title="Food Sales"
                value={formatMoney(
                  grandTotal.foodSales
                )}
                icon="🍽️"
              />

              <SummaryCard
                title="Discount"
                value={formatMoney(
                  grandTotal.discount
                )}
                icon="🎟️"
              />

              <SummaryCard
                title="Delivery Charges"
                value={formatMoney(
                  grandTotal.deliveryCharges
                )}
                icon="🛵"
              />

              <SummaryCard
                title="Platform Charges"
                value={formatMoney(
                  grandTotal.platformCharges
                )}
                icon="⚙️"
              />

              <SummaryCard
                title="Restaurant Sales"
                value={formatMoney(
                  grandTotal.restaurantSales
                )}
                icon="🏪"
              />
            </div>
          )}

          {/* TABLE */}

          <div style={styles.tableCard}>
            <div
              style={{
                ...styles.tableHeader,
                display: "flex",
                justifyContent:
                  "space-between",
                alignItems: "center",
                gap: "15px",
                flexWrap: "wrap",
              }}
            >
              <div>
                <h2
                  style={styles.tableTitle}
                >
                  Restaurant-wise Report
                </h2>

                <p
                  style={
                    styles.tableSubtitle
                  }
                >
                  {reports.length} restaurant
                  {reports.length !== 1
                    ? "s"
                    : ""}{" "}
                  found
                </p>
              </div>

              <button
                style={{
                  ...styles.refreshButton,
                  background: "#16a34a",
                }}
                onClick={
                  handleDownloadPDF
                }
              >
                📄 Download PDF
              </button>
            </div>

            {reports.length === 0 ? (
              <div style={styles.empty}>
                <div
                  style={
                    styles.emptyIcon
                  }
                >
                  📊
                </div>

                <h3>
                  No reports found
                </h3>

                <p>
                  No restaurant orders
                  were found for the
                  selected period.
                </p>
              </div>
            ) : (
              <div
                style={
                  styles.tableWrapper
                }
              >
                <table
                  style={styles.table}
                >
                  <thead>
                    <tr>
                      <th
                        style={styles.th}
                      >
                        Restaurant
                      </th>

                      <th
                        style={styles.th}
                      >
                        Orders
                      </th>

                      <th
                        style={styles.th}
                      >
                        Delivered
                      </th>

                      <th
                        style={styles.th}
                      >
                        Cancelled
                      </th>

                      <th
                        style={styles.th}
                      >
                        Food Sales
                      </th>

                      <th
                        style={styles.th}
                      >
                        Discount
                      </th>

                      <th
                        style={styles.th}
                      >
                        Delivery
                      </th>

                      <th
                        style={styles.th}
                      >
                        Platform
                      </th>

                      <th
                        style={styles.th}
                      >
                        Restaurant Sales
                      </th>

                      <th
                        style={styles.th}
                      >
                        Customer Collection
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {reports.map(
                      (report) => (
                        <tr
                          key={
                            report.restaurantId
                          }
                        >
                          <td
                            style={{
                              ...styles.td,
                              fontWeight: "600",
                            }}
                          >
                            {
                              report.restaurantName
                            }
                          </td>

                          <td
                            style={styles.td}
                          >
                            {
                              report.totalOrders
                            }
                          </td>

                          <td
                            style={styles.td}
                          >
                            {
                              report.completedOrders
                            }
                          </td>

                          <td
                            style={styles.td}
                          >
                            {
                              report.cancelledOrders
                            }
                          </td>

                          <td
                            style={styles.td}
                          >
                            {formatMoney(
                              report.foodSales
                            )}
                          </td>

                          <td
                            style={styles.td}
                          >
                            {formatMoney(
                              report.discount
                            )}
                          </td>

                          <td
                            style={styles.td}
                          >
                            {formatMoney(
                              report.deliveryCharges
                            )}
                          </td>

                          <td
                            style={styles.td}
                          >
                            {formatMoney(
                              report.platformCharges
                            )}
                          </td>

                          <td
                            style={{
                              ...styles.td,
                              fontWeight: "700",
                            }}
                          >
                            {formatMoney(
                              report.restaurantSales
                            )}
                          </td>

                          <td
                            style={styles.td}
                          >
                            {formatMoney(
                              report.customerCollection
                            )}
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

const SummaryCard = ({
  title,
  value,
  icon,
}) => {
  return (
    <div
      style={styles.summaryCard}
    >
      <div
        style={styles.summaryIcon}
      >
        {icon}
      </div>

      <div>
        <div
          style={styles.summaryTitle}
        >
          {title}
        </div>

        <div
          style={styles.summaryValue}
        >
          {value}
        </div>
      </div>
    </div>
  );
};
const styles = {
  container: {
    width: "100%",
    padding: "25px",
    boxSizing: "border-box",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "15px",
    marginBottom: "20px",
    flexWrap: "wrap",
  },

  title: {
    margin: 0,
    fontSize: "26px",
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
    padding: "11px 16px",
    background: "#2563eb",
    color: "#ffffff",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "600",
  },

  filterCard: {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
    padding: "18px",
    marginBottom: "20px",
  },

  filterTitle: {
    fontSize: "15px",
    fontWeight: "700",
    color: "#111827",
    marginBottom: "12px",
  },

  filterButtons: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
  },

  filterButton: {
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    padding: "9px 15px",
    background: "#ffffff",
    color: "#374151",
    cursor: "pointer",
    fontSize: "13px",
  },

  activeFilter: {
    background: "#2563eb",
    color: "#ffffff",
    border: "1px solid #2563eb",
  },

  customFilters: {
    display: "flex",
    gap: "12px",
    alignItems: "end",
    flexWrap: "wrap",
    marginTop: "16px",
  },

  dateGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    fontSize: "13px",
    color: "#374151",
  },

  dateInput: {
    padding: "9px 10px",
    border: "1px solid #d1d5db",
    borderRadius: "7px",
  },

  searchButton: {
    border: "none",
    borderRadius: "7px",
    padding: "10px 15px",
    background: "#111827",
    color: "#ffffff",
    cursor: "pointer",
    fontWeight: "600",
  },

  error: {
    background: "#fee2e2",
    color: "#b91c1c",
    border: "1px solid #fecaca",
    borderRadius: "8px",
    padding: "12px 15px",
    marginBottom: "20px",
    fontSize: "14px",
  },

  loading: {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
    padding: "50px 20px",
    textAlign: "center",
    color: "#6b7280",
  },

  summaryGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(190px, 1fr))",
    gap: "14px",
    marginBottom: "20px",
  },

  summaryCard: {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
    padding: "17px",
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },

  summaryIcon: {
    width: "42px",
    height: "42px",
    borderRadius: "10px",
    background: "#eff6ff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "20px",
    flexShrink: 0,
  },

  summaryTitle: {
    color: "#6b7280",
    fontSize: "12px",
    marginBottom: "4px",
  },

  summaryValue: {
    color: "#111827",
    fontSize: "18px",
    fontWeight: "700",
  },

  tableCard: {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
    overflow: "hidden",
  },

  tableHeader: {
    padding: "18px",
    borderBottom: "1px solid #e5e7eb",
  },

  tableTitle: {
    margin: 0,
    fontSize: "18px",
    color: "#111827",
  },

  tableSubtitle: {
    margin: "5px 0 0",
    color: "#6b7280",
    fontSize: "13px",
  },

  tableWrapper: {
    width: "100%",
    overflowX: "auto",
  },

  table: {
    width: "100%",
    minWidth: "1050px",
    borderCollapse: "collapse",
  },

  th: {
    padding: "13px 12px",
    background: "#f9fafb",
    color: "#374151",
    fontSize: "12px",
    fontWeight: "700",
    textAlign: "left",
    borderBottom: "1px solid #e5e7eb",
    whiteSpace: "nowrap",
  },

  td: {
    padding: "13px 12px",
    color: "#374151",
    fontSize: "13px",
    borderBottom: "1px solid #f1f5f9",
    whiteSpace: "nowrap",
  },

  empty: {
    textAlign: "center",
    padding: "60px 20px",
    color: "#6b7280",
  },

  emptyIcon: {
    fontSize: "42px",
    marginBottom: "10px",
  },
};

export default RestaurantReports;

          
