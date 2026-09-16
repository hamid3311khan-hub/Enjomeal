import React, { useEffect, useState } from "react";
import jsPDF from "jspdf";
import * as XLSX from "xlsx";

const API =
  "https://enjomeal-api.onrender.com/api/orders/restaurant/my-report";

function RestaurantReports() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // =====================================================
  // FETCH REPORT
  // =====================================================

  const fetchReport = async (
    customStart = startDate,
    customEnd = endDate
  ) => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem(
        "enjoMealRestaurantToken"
      );

      if (!token) {
        setError("Restaurant login required.");
        return;
      }

      let url = API;

      if (customStart || customEnd) {
        const params = new URLSearchParams();

        if (customStart) {
          params.append("startDate", customStart);
        }

        if (customEnd) {
          params.append("endDate", customEnd);
        }

        url += `?${params.toString()}`;
      }

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Failed to fetch restaurant report."
        );
      }

      setReport(data);
    } catch (err) {
      console.error(
        "Restaurant Report Error:",
        err
      );

      setError(
        err.message ||
          "Unable to load restaurant report."
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // LOAD REPORT
  // =====================================================

  useEffect(() => {
    fetchReport("", "");
  }, []);

  // =====================================================
  // TODAY
  // =====================================================

  const handleToday = () => {
    const today = new Date()
      .toISOString()
      .split("T")[0];

    setStartDate(today);
    setEndDate(today);

    fetchReport(today, today);
  };

  // =====================================================
  // LAST 7 DAYS
  // =====================================================

  const handleLast7Days = () => {
    const today = new Date();

    const previousDate = new Date();
    previousDate.setDate(
      today.getDate() - 6
    );

    const start = previousDate
      .toISOString()
      .split("T")[0];

    const end = today
      .toISOString()
      .split("T")[0];

    setStartDate(start);
    setEndDate(end);

    fetchReport(start, end);
  };

  // =====================================================
  // THIS MONTH
  // =====================================================

  const handleThisMonth = () => {
    const today = new Date();

    const start = new Date(
      today.getFullYear(),
      today.getMonth(),
      1
    )
      .toISOString()
      .split("T")[0];

    const end = today
      .toISOString()
      .split("T")[0];

    setStartDate(start);
    setEndDate(end);

    fetchReport(start, end);
  };

  // =====================================================
  // CUSTOM FILTER
  // =====================================================

  const handleFilter = () => {
    if (!startDate && !endDate) {
      fetchReport("", "");
      return;
    }

    if (
      startDate &&
      endDate &&
      startDate > endDate
    ) {
      setError(
        "Start date cannot be greater than end date."
      );
      return;
    }

    fetchReport(startDate, endDate);
  };

  // =====================================================
  // CLEAR FILTER
  // =====================================================

  const handleClear = () => {
    setStartDate("");
    setEndDate("");
    fetchReport("", "");
  };

  // =====================================================
  // CURRENCY
  // =====================================================

  const formatCurrency = (amount) => {
    return `₹${Number(amount || 0).toLocaleString(
      "en-IN",
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }
    )}`;
  };

    // =====================================================
  // DOWNLOAD REPORT PDF
  // =====================================================

  const handleDownloadPDF = () => {
    if (!report) {
      alert("Report data is not available.");
      return;
    }

    try {
      const doc = new jsPDF();

      const pageWidth =
        doc.internal.pageSize.getWidth();

      let y = 20;

      const restaurantName =
        report?.restaurant?.name ||
        "Restaurant";

      const summary =
        report?.summary || {};

      const start =
        report?.filters?.startDate ||
        "All Time";

      const end =
        report?.filters?.endDate ||
        "Today";

      // HEADER
      doc.setFontSize(22);
      doc.setFont("helvetica", "bold");
      doc.text("EnjoMeal", 20, y);

      doc.setFontSize(16);
      doc.text(
        "BUSINESS REPORT",
        pageWidth - 20,
        y,
        { align: "right" }
      );

      y += 8;

      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      doc.text(
        restaurantName,
        20,
        y
      );

      y += 6;

      doc.text(
        `Report Period: ${start} → ${end}`,
        20,
        y
      );

      y += 10;

      doc.setLineWidth(0.5);
      doc.line(
        20,
        y,
        pageWidth - 20,
        y
      );

      y += 15;

      // ORDER SUMMARY
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text(
        "Order Summary",
        20,
        y
      );

      y += 9;

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");

      const orderRows = [
        [
          "Total Orders",
          String(summary.totalOrders || 0),
        ],
        [
          "Completed Orders",
          String(
            summary.completedOrders || 0
          ),
        ],
        [
          "Cancelled Orders",
          String(
            summary.cancelledOrders || 0
          ),
        ],
      ];

      orderRows.forEach(
        ([label, value]) => {
          doc.text(label, 25, y);
          doc.text(
            value,
            pageWidth - 25,
            y,
            { align: "right" }
          );
          y += 7;
        }
      );

      y += 8;

      // SALES SUMMARY
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text(
        "Sales Summary",
        20,
        y
      );

      y += 9;

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");

      const salesRows = [
        [
          "Food Sales",
          formatCurrency(
            summary.foodSales
          ),
        ],
        [
          "Discount",
          `- ${formatCurrency(
            summary.discount
          )}`,
        ],
        [
          "Delivery Charges",
          formatCurrency(
            summary.deliveryCharges
          ),
        ],
        [
          "Platform Charges",
          formatCurrency(
            summary.platformCharges
          ),
        ],
        [
          "Customer Collection",
          formatCurrency(
            summary.customerCollection
          ),
        ],
      ];

      salesRows.forEach(
        ([label, value]) => {
          doc.text(label, 25, y);
          doc.text(
            value,
            pageWidth - 25,
            y,
            { align: "right" }
          );
          y += 8;
        }
      );

      y += 5;

      // RESTAURANT SALES
      doc.setLineWidth(0.5);
      doc.line(
        20,
        y,
        pageWidth - 20,
        y
      );

      y += 12;

      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");

      doc.text(
        "Restaurant Sales",
        20,
        y
      );

      doc.text(
        formatCurrency(
          summary.restaurantSales
        ),
        pageWidth - 20,
        y,
        { align: "right" }
      );

      y += 15;

      // NOTE
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");

      doc.text(
        "Restaurant Sales is calculated from delivered orders after discount.",
        20,
        y
      );

      y += 15;

      doc.setFontSize(9);
      doc.text(
        "Generated by EnjoMeal",
        pageWidth / 2,
        y,
        { align: "center" }
      );

      const fileName =
        `EnjoMeal-${restaurantName
          .replace(/[^a-z0-9]/gi, "-")
          .toLowerCase()}-report.pdf`;

      doc.save(fileName);

    } catch (error) {
      console.error(
        "Restaurant Report PDF Error:",
        error
      );

      alert(
        "Failed to generate report PDF."
      );
    }
  };

    // =====================================================
  // DOWNLOAD REPORT EXCEL
  // =====================================================

  const handleDownloadExcel = () => {
    if (!report) {
      alert("Report data is not available.");
      return;
    }

    try {
      const restaurantName =
        report?.restaurant?.name ||
        "Restaurant";

      const summary =
        report?.summary || {};

      const start =
        report?.filters?.startDate ||
        "All Time";

      const end =
        report?.filters?.endDate ||
        "Today";

      const rows = [
        ["EnjoMeal - Business Report"],
        ["Restaurant", restaurantName],
        ["Report Period", `${start} → ${end}`],
        [],
        ["ORDER SUMMARY"],
        ["Total Orders", summary.totalOrders || 0],
        [
          "Completed Orders",
          summary.completedOrders || 0,
        ],
        [
          "Cancelled Orders",
          summary.cancelledOrders || 0,
        ],
        [],
        ["SALES SUMMARY"],
        [
          "Food Sales",
          Number(summary.foodSales || 0),
        ],
        [
          "Discount",
          Number(summary.discount || 0),
        ],
        [
          "Delivery Charges",
          Number(
            summary.deliveryCharges || 0
          ),
        ],
        [
          "Platform Charges",
          Number(
            summary.platformCharges || 0
          ),
        ],
        [
          "Customer Collection",
          Number(
            summary.customerCollection || 0
          ),
        ],
        [
          "Restaurant Sales",
          Number(
            summary.restaurantSales || 0
          ),
        ],
      ];

      const worksheet =
        XLSX.utils.aoa_to_sheet(rows);

      worksheet["!cols"] = [
        { wch: 28 },
        { wch: 25 },
      ];

      const workbook =
        XLSX.utils.book_new();

      XLSX.utils.book_append_sheet(
        workbook,
        worksheet,
        "Business Report"
      );

      const safeName =
        restaurantName
          .replace(/[^a-z0-9]/gi, "-")
          .toLowerCase();

      XLSX.writeFile(
        workbook,
        `EnjoMeal-${safeName}-report.xlsx`
      );

    } catch (error) {
      console.error(
        "Restaurant Report Excel Error:",
        error
      );

      alert(
        "Failed to generate Excel report."
      );
    }
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (loading && !report) {
    return (
      <div style={styles.page}>
        <div style={styles.loadingCard}>
          <div style={styles.spinner}>⏳</div>
          <h2>Loading Business Report...</h2>
          <p>
            Please wait while we fetch your
            restaurant data.
          </p>
        </div>
      </div>
    );
  }

  // =====================================================
  // MAIN
  // =====================================================

  return (
    <div style={styles.page}>
      {/* =================================================
          HEADER
      ================================================= */}

      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>
            📊 Business Report
          </h1>

          <p style={styles.subtitle}>
            {report?.restaurant?.name ||
              "Restaurant"}
          </p>
        </div>

                <button
          onClick={handleDownloadPDF}
          style={{
            border: "none",
            borderRadius: "8px",
            padding: "12px 18px",
            background: "#198754",
            color: "#fff",
            fontWeight: "700",
            cursor: "pointer",
          }}
        >
                <button
          onClick={handleDownloadExcel}
          style={{
            border: "none",
            borderRadius: "8px",
            padding: "12px 18px",
            background: "#217346",
            color: "#fff",
            fontWeight: "700",
            cursor: "pointer",
          }}
        >
          📊 Download Excel
        </button>
          📄 Download PDF
        </button>

        <button
          onClick={() =>
            fetchReport(
              startDate,
              endDate
            )
          }
          style={styles.refreshButton}
          disabled={loading}
        >
          {loading ? "Loading..." : "↻ Refresh"}
        </button>
      </div>

      {/* =================================================
          ERROR
      ================================================= */}

      {error && (
        <div style={styles.error}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* =================================================
          DATE FILTER
      ================================================= */}

      <div style={styles.filterCard}>
        <h2 style={styles.sectionTitle}>
          📅 Report Period
        </h2>

        <div style={styles.quickButtons}>
          <button
            onClick={handleToday}
            style={styles.quickButton}
          >
            Today
          </button>

          <button
            onClick={handleLast7Days}
            style={styles.quickButton}
          >
            Last 7 Days
          </button>

          <button
            onClick={handleThisMonth}
            style={styles.quickButton}
          >
            This Month
          </button>
        </div>

        <div style={styles.dateGrid}>
          <div style={styles.field}>
            <label style={styles.label}>
              Start Date
            </label>

            <input
              type="date"
              value={startDate}
              onChange={(event) =>
                setStartDate(
                  event.target.value
                )
              }
              style={styles.input}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>
              End Date
            </label>

            <input
              type="date"
              value={endDate}
              onChange={(event) =>
                setEndDate(
                  event.target.value
                )
              }
              style={styles.input}
            />
          </div>
        </div>

        <div style={styles.filterButtons}>
          <button
            onClick={handleFilter}
            style={styles.applyButton}
          >
            Apply Filter
          </button>

          <button
            onClick={handleClear}
            style={styles.clearButton}
          >
            Clear
          </button>
        </div>
      </div>

      {/* =================================================
          FILTER INFO
      ================================================= */}

      {report?.filters && (
        <div style={styles.filterInfo}>
          <strong>Showing:</strong>{" "}
          {report.filters.startDate ||
          report.filters.endDate ? (
            <>
              {report.filters.startDate ||
                "All time"}{" "}
              →{" "}
              {report.filters.endDate ||
                "Today"}
            </>
          ) : (
            "All Orders"
          )}
        </div>
      )}

      {/* =================================================
          SUMMARY CARDS
      ================================================= */}

      <div style={styles.cardsGrid}>
        <SummaryCard
          icon="📦"
          title="Total Orders"
          value={
            report?.summary?.totalOrders || 0
          }
        />

        <SummaryCard
          icon="✅"
          title="Completed Orders"
          value={
            report?.summary
              ?.completedOrders || 0
          }
        />

        <SummaryCard
          icon="❌"
          title="Cancelled Orders"
          value={
            report?.summary
              ?.cancelledOrders || 0
          }
        />

        <SummaryCard
          icon="🍽️"
          title="Food Sales"
          value={formatCurrency(
            report?.summary?.foodSales
          )}
        />

        <SummaryCard
          icon="🏷️"
          title="Discount"
          value={formatCurrency(
            report?.summary?.discount
          )}
        />

        <SummaryCard
          icon="🚚"
          title="Delivery Charges"
          value={formatCurrency(
            report?.summary
              ?.deliveryCharges
          )}
        />

        <SummaryCard
          icon="⚙️"
          title="Platform Charges"
          value={formatCurrency(
            report?.summary
              ?.platformCharges
          )}
        />

        <SummaryCard
          icon="💰"
          title="Customer Collection"
          value={formatCurrency(
            report?.summary
              ?.customerCollection
          )}
        />

        <SummaryCard
          icon="🏦"
          title="Restaurant Sales"
          value={formatCurrency(
            report?.summary
              ?.restaurantSales
          )}
          highlight
        />
      </div>

      {/* =================================================
          SALES BREAKDOWN
      ================================================= */}

      <div style={styles.breakdownCard}>
        <h2 style={styles.sectionTitle}>
          💵 Sales Breakdown
        </h2>

        <div style={styles.breakdownRow}>
          <span>Food Sales</span>

          <strong>
            {formatCurrency(
              report?.summary?.foodSales
            )}
          </strong>
        </div>

        <div style={styles.breakdownRow}>
          <span>Discount Given</span>

          <strong>
            -{" "}
            {formatCurrency(
              report?.summary?.discount
            )}
          </strong>
        </div>

        <div style={styles.breakdownRow}>
          <span>Delivery Charges</span>

          <strong>
            {formatCurrency(
              report?.summary
                ?.deliveryCharges
            )}
          </strong>
        </div>

        <div style={styles.breakdownRow}>
          <span>Platform Charges</span>

          <strong>
            {formatCurrency(
              report?.summary
                ?.platformCharges
            )}
          </strong>
        </div>

        <div style={styles.totalRow}>
          <span>Customer Collection</span>

          <strong>
            {formatCurrency(
              report?.summary
                ?.customerCollection
            )}
          </strong>
        </div>

        <div style={styles.restaurantSalesRow}>
          <span>
            Restaurant Sales
          </span>

          <strong>
            {formatCurrency(
              report?.summary
                ?.restaurantSales
            )}
          </strong>
        </div>
      </div>

      {/* =================================================
          NOTE
      ================================================= */}

      <div style={styles.note}>
        <strong>ℹ️ Note:</strong>{" "}
        Restaurant Sales is calculated from
        delivered orders after discount.
      </div>
    </div>
  );
}

// =====================================================
// SUMMARY CARD
// =====================================================

function SummaryCard({
  icon,
  title,
  value,
  highlight = false,
}) {
  return (
    <div
      style={{
        ...styles.summaryCard,
        ...(highlight
          ? styles.highlightCard
          : {}),
      }}
    >
      <div style={styles.cardIcon}>
        {icon}
      </div>

      <div style={styles.cardTitle}>
        {title}
      </div>

      <div style={styles.cardValue}>
        {value}
      </div>
    </div>
  );
}

// =====================================================
// STYLES
// =====================================================

const styles = {
  page: {
    minHeight: "100vh",
    padding: "24px",
    background: "#fff8f3",
    boxSizing: "border-box",
    fontFamily:
      "Arial, Helvetica, sans-serif",
  },

  header: {
    maxWidth: "1200px",
    margin: "0 auto 24px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "15px",
    flexWrap: "wrap",
  },

  title: {
    margin: 0,
    fontSize: "30px",
    color: "#222",
  },

  subtitle: {
    margin: "8px 0 0",
    color: "#666",
    fontSize: "16px",
  },

  refreshButton: {
    border: "none",
    borderRadius: "8px",
    padding: "12px 18px",
    background: "#e85d04",
    color: "#fff",
    fontWeight: "700",
    cursor: "pointer",
  },

  filterCard: {
    maxWidth: "1200px",
    margin: "0 auto 20px",
    background: "#fff",
    padding: "20px",
    borderRadius: "14px",
    boxShadow:
      "0 3px 15px rgba(0,0,0,0.08)",
  },

  sectionTitle: {
    margin: "0 0 18px",
    fontSize: "21px",
    color: "#222",
  },

  quickButtons: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
    marginBottom: "20px",
  },

  quickButton: {
    border: "1px solid #e85d04",
    borderRadius: "8px",
    padding: "10px 15px",
    background: "#fff",
    color: "#e85d04",
    fontWeight: "700",
    cursor: "pointer",
  },

  dateGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "15px",
  },

  field: {
    display: "flex",
    flexDirection: "column",
    gap: "7px",
  },

  label: {
    fontSize: "14px",
    fontWeight: "700",
    color: "#444",
  },

  input: {
    width: "100%",
    boxSizing: "border-box",
    padding: "11px 12px",
    border: "1px solid #ddd",
    borderRadius: "8px",
    fontSize: "15px",
    background: "#fff",
  },

  filterButtons: {
    display: "flex",
    gap: "10px",
    marginTop: "18px",
    flexWrap: "wrap",
  },

  applyButton: {
    border: "none",
    borderRadius: "8px",
    padding: "11px 20px",
    background: "#198754",
    color: "#fff",
    fontWeight: "700",
    cursor: "pointer",
  },

  clearButton: {
    border: "none",
    borderRadius: "8px",
    padding: "11px 20px",
    background: "#6c757d",
    color: "#fff",
    fontWeight: "700",
    cursor: "pointer",
  },

  filterInfo: {
    maxWidth: "1200px",
    margin: "0 auto 18px",
    padding: "12px 15px",
    borderRadius: "8px",
    background: "#fff3cd",
    color: "#664d03",
    fontSize: "14px",
  },

  cardsGrid: {
    maxWidth: "1200px",
    margin: "0 auto 20px",
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "15px",
  },

  summaryCard: {
    background: "#fff",
    padding: "20px",
    borderRadius: "14px",
    boxShadow:
      "0 3px 15px rgba(0,0,0,0.08)",
    minHeight: "135px",
    boxSizing: "border-box",
  },

  highlightCard: {
    border: "2px solid #198754",
  },

  cardIcon: {
    fontSize: "27px",
    marginBottom: "8px",
  },

  cardTitle: {
    color: "#666",
    fontSize: "14px",
    fontWeight: "600",
  },

  cardValue: {
    marginTop: "8px",
    fontSize: "22px",
    fontWeight: "800",
    color: "#222",
  },

  breakdownCard: {
    maxWidth: "1200px",
    margin: "0 auto 20px",
    background: "#fff",
    padding: "20px",
    borderRadius: "14px",
    boxShadow:
      "0 3px 15px rgba(0,0,0,0.08)",
  },

  breakdownRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: "15px",
    padding: "13px 0",
    borderBottom: "1px solid #eee",
    color: "#444",
    flexWrap: "wrap",
  },

  totalRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: "15px",
    padding: "16px 0",
    marginTop: "5px",
    borderTop: "2px solid #ddd",
    fontSize: "17px",
    fontWeight: "800",
    flexWrap: "wrap",
  },

  restaurantSalesRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: "15px",
    padding: "16px",
    marginTop: "8px",
    borderRadius: "10px",
    background: "#e9f7ef",
    color: "#146c43",
    fontSize: "18px",
    fontWeight: "800",
    flexWrap: "wrap",
  },

  note: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "14px 16px",
    borderRadius: "10px",
    background: "#e7f1ff",
    color: "#24527a",
    fontSize: "14px",
    lineHeight: "1.5",
  },

  error: {
    maxWidth: "1200px",
    margin: "0 auto 20px",
    padding: "14px 16px",
    borderRadius: "8px",
    background: "#f8d7da",
    color: "#842029",
  },

  loadingCard: {
    maxWidth: "500px",
    margin: "80px auto",
    padding: "35px",
    textAlign: "center",
    background: "#fff",
    borderRadius: "14px",
    boxShadow:
      "0 3px 15px rgba(0,0,0,0.08)",
  },

  spinner: {
    fontSize: "40px",
    marginBottom: "10px",
  },
};

export default RestaurantReports;
