import { useEffect, useState } from "react";
import jsPDF from "jspdf";
import * as XLSX from "xlsx";

const API_URL =
  "https://enjomeal-api.onrender.com";

function DeliveryReports() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const token = localStorage.getItem(
    "enjoMealDeliveryToken"
  );

  const fetchReport = async (
    start = "",
    end = ""
  ) => {
    try {
      setLoading(true);
      setError("");

      let url =
        `${API_URL}/api/delivery/my-report`;

      const params = new URLSearchParams();

      if (start) {
        params.append(
          "startDate",
          start
        );
      }

      if (end) {
        params.append(
          "endDate",
          end
        );
      }

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await fetch(url, {
        headers: {
          Authorization:
            `Bearer ${token}`,
        },
      });

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to load report"
        );
      }

      setReport(data);
    } catch (err) {
      console.error(err);

      setError(
        err.message ||
          "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  const formatDate = (date) => {
    const d = new Date(date);

    if (
      Number.isNaN(
        d.getTime()
      )
    ) {
      return date;
    }

    return d.toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  const getDateString = (date) => {
    const year =
      date.getFullYear();

    const month = String(
      date.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
      date.getDate()
    ).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  const handleToday = () => {
    const today =
      getDateString(
        new Date()
      );

    setStartDate(today);
    setEndDate(today);

    fetchReport(
      today,
      today
    );
  };

  const handleThisWeek = () => {
    const today =
      new Date();

    const day =
      today.getDay();

    const diff =
      day === 0
        ? 6
        : day - 1;

    const monday =
      new Date(today);

    monday.setDate(
      today.getDate() -
        diff
    );

    const start =
      getDateString(
        monday
      );

    const end =
      getDateString(
        today
      );

    setStartDate(start);
    setEndDate(end);

    fetchReport(
      start,
      end
    );
  };

  const handleThisMonth = () => {
    const today =
      new Date();

    const firstDay =
      new Date(
        today.getFullYear(),
        today.getMonth(),
        1
      );

    const start =
      getDateString(
        firstDay
      );

    const end =
      getDateString(
        today
      );

    setStartDate(start);
    setEndDate(end);

    fetchReport(
      start,
      end
    );
  };

  const handleCustomSearch = () => {
    if (
      !startDate ||
      !endDate
    ) {
      setError(
        "Please select both start and end dates."
      );
      return;
    }

    if (
      startDate >
      endDate
    ) {
      setError(
        "Start date cannot be after end date."
      );
      return;
    }

    fetchReport(
      startDate,
      endDate
    );
  };

  const clearFilter = () => {
    setStartDate("");
    setEndDate("");

    fetchReport();
  };

  const goBack = () => {
    window.location.href =
      "/delivery/dashboard";
  };

  const summary =
    report?.summary || {};

  const dateWiseOrders =
    report?.dateWiseOrders || [];

  const deliveryPartner =
    report?.deliveryPartner
      ?.name ||
    "Delivery Partner";

  const phone =
    report?.deliveryPartner
      ?.phone || "";

  const getReportPeriod = () => {
    if (
      !startDate &&
      !endDate
    ) {
      return "All Time";
    }

    if (
      startDate &&
      endDate &&
      startDate === endDate
    ) {
      return startDate;
    }

    return `${startDate || "N/A"} to ${
      endDate || "N/A"
    }`;
  };

  /*
   * ==========================
   * DOWNLOAD PDF
   * ==========================
   */

  const handleDownloadPDF = () => {
    try {
      if (!report) {
        setError(
          "Report data is not available yet."
        );
        return;
      }

      const doc =
        new jsPDF();

      const pdfCurrency =
        (amount) =>
          `Rs. ${Number(
            amount || 0
          ).toLocaleString(
            "en-IN",
            {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }
          )}`;

      const period =
        getReportPeriod();

      let y = 20;

      // HEADER

      doc.setFontSize(20);
      doc.setFont(
        undefined,
        "bold"
      );

      doc.text(
        "EnjoMeal",
        20,
        y
      );

      y += 10;

      doc.setFontSize(16);

      doc.text(
        "DELIVERY REPORT",
        20,
        y
      );

      y += 10;

      doc.setFontSize(11);
      doc.setFont(
        undefined,
        "normal"
      );

      doc.text(
        `Delivery Partner: ${deliveryPartner}`,
        20,
        y
      );

      y += 7;

      if (phone) {
        doc.text(
          `Phone: ${phone}`,
          20,
          y
        );

        y += 7;
      }

      doc.text(
        `Report Period: ${period}`,
        20,
        y
      );

      y += 14;

      // ORDER SUMMARY

      doc.setFontSize(14);
      doc.setFont(
        undefined,
        "bold"
      );

      doc.text(
        "Order Summary",
        20,
        y
      );

      y += 9;

      doc.setFontSize(11);
      doc.setFont(
        undefined,
        "normal"
      );

      const orderSummary =
        [
          [
            "Total Orders",
            summary.totalOrders ||
              0,
          ],
          [
            "Delivered Orders",
            summary.deliveredOrders ||
              0,
          ],
          [
            "Cancelled Orders",
            summary.cancelledOrders ||
              0,
          ],
          [
            "Active Orders",
            summary.activeOrders ||
              0,
          ],
          [
            "Pending Orders",
            summary.pendingOrders ||
              0,
          ],
        ];

      orderSummary.forEach(
        ([label, value]) => {
          doc.text(
            `${label}: ${value}`,
            20,
            y
          );

          y += 7;
        }
      );

      y += 7;

      // EARNINGS

      doc.setFontSize(14);
      doc.setFont(
        undefined,
        "bold"
      );

      doc.text(
        "Earnings Summary",
        20,
        y
      );

      y += 9;

      doc.setFontSize(11);
      doc.setFont(
        undefined,
        "normal"
      );

      doc.text(
        `Total Delivery Charges: ${pdfCurrency(
          summary.totalDeliveryCharges
        )}`,
        20,
        y
      );

      y += 14;

      // DATE WISE REPORT

      doc.setFontSize(14);
      doc.setFont(
        undefined,
        "bold"
      );

      doc.text(
        "Date-wise Report",
        20,
        y
      );

      y += 9;

      if (
        dateWiseOrders.length ===
        0
      ) {
        doc.setFontSize(11);
        doc.setFont(
          undefined,
          "normal"
        );

        doc.text(
          "No orders found for this period.",
          20,
          y
        );

        y += 10;
      } else {
        doc.setFontSize(10);
        doc.setFont(
          undefined,
          "bold"
        );

        doc.text(
          "Date",
          20,
          y
        );

        doc.text(
          "Orders",
          65,
          y
        );

        doc.text(
          "Delivered",
          95,
          y
        );

        doc.text(
          "Cancelled",
          135,
          y
        );

        doc.text(
          "Charges",
          170,
          y
        );

        y += 7;

        doc.setFont(
          undefined,
          "normal"
        );

        dateWiseOrders.forEach(
          (item) => {
            if (y > 275) {
              doc.addPage();
              y = 20;

              doc.setFontSize(
                14
              );

              doc.setFont(
                undefined,
                "bold"
              );

              doc.text(
                "Date-wise Report (Continued)",
                20,
                y
              );

              y += 10;

              doc.setFontSize(
                10
              );

              doc.text(
                "Date",
                20,
                y
              );

              doc.text(
                "Orders",
                65,
                y
              );

              doc.text(
                "Delivered",
                95,
                y
              );

              doc.text(
                "Cancelled",
                135,
                y
              );

              doc.text(
                "Charges",
                170,
                y
              );

              y += 7;

              doc.setFont(
                undefined,
                "normal"
              );
            }

            doc.text(
              formatDate(
                item._id
              ),
              20,
              y
            );

            doc.text(
              String(
                item.orders || 0
              ),
              65,
              y
            );

            doc.text(
              String(
                item.delivered ||
                  0
              ),
              95,
              y
            );

            doc.text(
              String(
                item.cancelled ||
                  0
              ),
              135,
              y
            );

            doc.text(
              pdfCurrency(
                item.deliveryCharges
              ),
              170,
              y
            );

            y += 7;
          }
        );
      }

      // FOOTER

      if (y > 270) {
        doc.addPage();
        y = 20;
      }

      y += 5;

      doc.setFontSize(9);
      doc.setFont(
        undefined,
        "normal"
      );

      doc.text(
        "Generated from EnjoMeal Delivery Panel",
        20,
        y
      );

      const safeName =
        deliveryPartner
          .replace(
            /[^a-z0-9]/gi,
            "-"
          )
          .toLowerCase();

      doc.save(
        `EnjoMeal-${safeName}-delivery-report.pdf`
      );
    } catch (error) {
      console.error(
        "PDF generation failed:",
        error
      );

      setError(
        "Unable to generate PDF. Please try again."
      );
    }
  };
    /*
   * ==========================
   * DOWNLOAD EXCEL
   * ==========================
   */

  const handleDownloadExcel =
    () => {
      try {
        if (!report) {
          setError(
            "Report data is not available yet."
          );
          return;
        }

        const period =
          getReportPeriod();

        const excelData = [];

        excelData.push([
          "EnjoMeal - Delivery Report",
        ]);

        excelData.push([]);

        excelData.push([
          "Delivery Partner",
          deliveryPartner,
        ]);

        if (phone) {
          excelData.push([
            "Phone",
            phone,
          ]);
        }

        excelData.push([
          "Report Period",
          period,
        ]);

        excelData.push([]);

        // ORDER SUMMARY

        excelData.push([
          "ORDER SUMMARY",
        ]);

        excelData.push([
          "Total Orders",
          summary.totalOrders || 0,
        ]);

        excelData.push([
          "Delivered Orders",
          summary.deliveredOrders ||
            0,
        ]);

        excelData.push([
          "Cancelled Orders",
          summary.cancelledOrders ||
            0,
        ]);

        excelData.push([
          "Active Orders",
          summary.activeOrders ||
            0,
        ]);

        excelData.push([
          "Pending Orders",
          summary.pendingOrders ||
            0,
        ]);

        excelData.push([]);

        // EARNINGS

        excelData.push([
          "EARNINGS SUMMARY",
        ]);

        excelData.push([
          "Total Delivery Charges",
          Number(
            summary.totalDeliveryCharges ||
              0
          ),
        ]);

        excelData.push([]);

        // DATE WISE

        excelData.push([
          "DATE-WISE REPORT",
        ]);

        excelData.push([
          "Date",
          "Orders",
          "Delivered",
          "Cancelled",
          "Delivery Charges",
        ]);

        dateWiseOrders.forEach(
          (item) => {
            excelData.push([
              formatDate(
                item._id
              ),
              item.orders || 0,
              item.delivered ||
                0,
              item.cancelled ||
                0,
              Number(
                item.deliveryCharges ||
                  0
              ),
            ]);
          }
        );

        const worksheet =
          XLSX.utils.aoa_to_sheet(
            excelData
          );

        worksheet[
          "!cols"
        ] = [
          {
            wch: 28,
          },
          {
            wch: 22,
          },
          {
            wch: 16,
          },
          {
            wch: 16,
          },
          {
            wch: 20,
          },
        ];

        // Number formatting

        const range =
          XLSX.utils.decode_range(
            worksheet["!ref"]
          );

        for (
          let row =
            range.s.r;
          row <= range.e.r;
          row++
        ) {
          for (
            let col =
              range.s.c;
            col <= range.e.c;
            col++
          ) {
            const cell =
              worksheet[
                XLSX.utils.encode_cell(
                  {
                    r: row,
                    c: col,
                  }
                )
              ];

            if (
              cell &&
              typeof cell.v ===
                "number"
            ) {
              cell.z =
                '#,##0.00';
            }
          }
        }

        const workbook =
          XLSX.utils.book_new();

        XLSX.utils.book_append_sheet(
          workbook,
          worksheet,
          "Delivery Report"
        );

        const safeName =
          deliveryPartner
            .replace(
              /[^a-z0-9]/gi,
              "-"
            )
            .toLowerCase();

        XLSX.writeFile(
          workbook,
          `EnjoMeal-${safeName}-delivery-report.xlsx`
        );
      } catch (error) {
        console.error(
          "Excel generation failed:",
          error
        );

        setError(
          "Unable to generate Excel. Please try again."
        );
      }
    };

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
            boxShadow:
              "0 3px 12px rgba(0,0,0,0.08)",
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
            View your delivery performance
            and earnings.
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
                {report.deliveryPartner
                  .name ||
                  "Delivery Partner"}
              </strong>

              {report.deliveryPartner
                .phone && (
                <span
                  style={{
                    marginLeft: "10px",
                    color: "#666",
                  }}
                >
                  {
                    report
                      .deliveryPartner
                      .phone
                  }
                </span>
              )}
            </div>
          )}
        </div>

        {/* FILTERS */}

        <div
          style={{
            background: "#ffffff",
            borderRadius: "16px",
            padding: "20px",
            marginBottom: "20px",
            boxShadow:
              "0 3px 12px rgba(0,0,0,0.08)",
          }}
        >
          <h3
            style={{
              marginTop: 0,
            }}
          >
            Report Period
          </h3>

          {/* DOWNLOAD BUTTONS */}

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "10px",
              marginBottom: "15px",
            }}
          >
            <button
              onClick={
                handleDownloadPDF
              }
              style={{
                ...buttonStyle,
                background:
                  "#28a745",
              }}
            >
              📄 Download PDF
            </button>

            <button
              onClick={
                handleDownloadExcel
              }
              style={{
                ...buttonStyle,
                background:
                  "#198754",
              }}
            >
              📊 Download Excel
            </button>
          </div>

          {/* FILTER BUTTONS */}

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(130px, 1fr))",
              gap: "10px",
            }}
          >
            <button
              onClick={
                handleToday
              }
              style={
                buttonStyle
              }
            >
              Today
            </button>

            <button
              onClick={
                handleThisWeek
              }
              style={
                buttonStyle
              }
            >
              This Week
            </button>

            <button
              onClick={
                handleThisMonth
              }
              style={
                buttonStyle
              }
            >
              This Month
            </button>

            <button
              onClick={
                clearFilter
              }
              style={{
                ...buttonStyle,
                background:
                  "#eeeeee",
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
                  display:
                    "block",
                  marginBottom:
                    "6px",
                  fontWeight:
                    "600",
                }}
              >
                Start Date
              </label>

              <input
                type="date"
                value={
                  startDate
                }
                onChange={(e) =>
                  setStartDate(
                    e.target.value
                  )
                }
                style={
                  inputStyle
                }
              />
            </div>

            <div>
              <label
                style={{
                  display:
                    "block",
                  marginBottom:
                    "6px",
                  fontWeight:
                    "600",
                }}
              >
                End Date
              </label>

              <input
                type="date"
                value={
                  endDate
                }
                onChange={(e) =>
                  setEndDate(
                    e.target.value
                  )
                }
                style={
                  inputStyle
                }
              />
            </div>

            <div
              style={{
                display:
                  "flex",
                alignItems:
                  "end",
              }}
            >
              <button
                onClick={
                  handleCustomSearch
                }
                style={{
                  ...buttonStyle,
                  width:
                    "100%",
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
              background:
                "#ffe5e5",
              color:
                "#b00020",
              padding:
                "14px",
              borderRadius:
                "10px",
              marginBottom:
                "20px",
            }}
          >
            {error}
          </div>
        )}

        {/* LOADING */}

        {loading && (
          <div
            style={{
              textAlign:
                "center",
              padding:
                "30px",
            }}
          >
            Loading report...
          </div>
        )}

        {/* REPORT */}

        {!loading &&
          report && (
            <>
              {/* SUMMARY */}

              <div
                style={{
                  display:
                    "grid",
                  gridTemplateColumns:
                    "repeat(auto-fit, minmax(160px, 1fr))",
                  gap: "15px",
                  marginBottom:
                    "20px",
                }}
              >
                <StatCard
                  title="Total Orders"
                  value={
                    summary.totalOrders ||
                    0
                  }
                  icon="📦"
                />

                <StatCard
                  title="Delivered"
                  value={
                    summary.deliveredOrders ||
                    0
                  }
                  icon="✅"
                />

                <StatCard
                  title="Cancelled"
                  value={
                    summary.cancelledOrders ||
                    0
                  }
                  icon="❌"
                />

                <StatCard
                  title="Active Orders"
                  value={
                    summary.activeOrders ||
                    0
                  }
                  icon="🚴"
                />

                <StatCard
                  title="Pending Orders"
                  value={
                    summary.pendingOrders ||
                    0
                  }
                  icon="⏳"
                />

                <StatCard
                  title="Delivery Charges"
                  value={`₹${Number(
                    summary.totalDeliveryCharges ||
                      0
                  ).toFixed(2)}`}
                  icon="💰"
                />
              </div>
                            {/* DATE WISE REPORT */}

              <div
                style={{
                  background:
                    "#ffffff",
                  borderRadius:
                    "16px",
                  padding:
                    "20px",
                  boxShadow:
                    "0 3px 12px rgba(0,0,0,0.08)",
                  overflowX:
                    "auto",
                }}
              >
                <h2
                  style={{
                    marginTop: 0,
                    marginBottom:
                      "15px",
                  }}
                >
                  📅 Date-wise Report
                </h2>

                {dateWiseOrders.length ===
                0 ? (
                  <p
                    style={{
                      textAlign:
                        "center",
                      color:
                        "#777",
                      padding:
                        "20px",
                    }}
                  >
                    No orders found
                    for this period.
                  </p>
                ) : (
                  <table
                    style={{
                      width:
                        "100%",
                      borderCollapse:
                        "collapse",
                      minWidth:
                        "650px",
                    }}
                  >
                    <thead>
                      <tr>
                        <th
                          style={
                            thStyle
                          }
                        >
                          Date
                        </th>

                        <th
                          style={
                            thStyle
                          }
                        >
                          Orders
                        </th>

                        <th
                          style={
                            thStyle
                          }
                        >
                          Delivered
                        </th>

                        <th
                          style={
                            thStyle
                          }
                        >
                          Cancelled
                        </th>

                        <th
                          style={
                            thStyle
                          }
                        >
                          Delivery Charges
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {dateWiseOrders.map(
                        (item) => (
                          <tr
                            key={
                              item._id
                            }
                          >
                            <td
                              style={
                                tdStyle
                              }
                            >
                              {formatDate(
                                item._id
                              )}
                            </td>

                            <td
                              style={
                                tdStyle
                              }
                            >
                              {
                                item.orders
                              }
                            </td>

                            <td
                              style={
                                tdStyle
                              }
                            >
                              {
                                item.delivered
                              }
                            </td>

                            <td
                              style={
                                tdStyle
                              }
                            >
                              {
                                item.cancelled
                              }
                            </td>

                            <td
                              style={
                                tdStyle
                              }
                            >
                              ₹
                              {Number(
                                item.deliveryCharges ||
                                  0
                              ).toFixed(
                                2
                              )}
                            </td>
                          </tr>
                        )
                      )}
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

function StatCard({
  title,
  value,
  icon,
}) {
  return (
    <div
      style={{
        background:
          "#ffffff",
        borderRadius:
          "14px",
        padding:
          "20px",
        boxShadow:
          "0 3px 12px rgba(0,0,0,0.08)",
      }}
    >
      <div
        style={{
          fontSize:
            "28px",
          marginBottom:
            "8px",
        }}
      >
        {icon}
      </div>

      <div
        style={{
          color:
            "#666",
          fontSize:
            "14px",
          marginBottom:
            "5px",
        }}
      >
        {title}
      </div>

      <div
        style={{
          fontSize:
            "24px",
          fontWeight:
            "700",
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
  borderBottom:
    "2px solid #eee",
  whiteSpace:
    "nowrap",
};

const tdStyle = {
  padding: "12px",
  borderBottom:
    "1px solid #eee",
};

export default DeliveryReports;
              
  
