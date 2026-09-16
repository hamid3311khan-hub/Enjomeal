import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { useNavigate, useParams } from "react-router-dom";
import API from "../api/api";
import jsPDF from "jspdf";
function OrderDetails() {
  const { orderId } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState("");
  const [liveLocation, setLiveLocation] = useState(null);
const [trackingConnected, setTrackingConnected] =
  useState(false);
const mapRef = useRef(null);
const googleMapRef = useRef(null);
const deliveryMarkerRef = useRef(null);

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

    // ==========================================
  // LIVE DELIVERY LOCATION
  // ==========================================

  useEffect(() => {
    if (!order) {
      return;
    }

    if (
      !["READY", "OUT_FOR_DELIVERY"].includes(
        order.orderStatus
      )
    ) {
      return;
    }

    if (!order.deliveryPartner) {
      return;
    }

    const token = localStorage.getItem(
      "enjoMealToken"
    );

    if (!token) {
      return;
    }

    const socket = io(
      "https://enjomeal-api.onrender.com",
      {
        auth: {
          token,
        },
      }
    );

    socket.on("connect", () => {
      setTrackingConnected(true);

      socket.emit(
        "order:join",
        orderId,
        (response) => {
          if (!response?.success) {
            console.warn(
              "Order tracking join failed:",
              response?.message
            );
            setTrackingConnected(false);
          }
        }
      );
    });

    socket.on(
      "delivery:location",
      (locationData) => {
        if (!locationData) {
          return;
        }

        setLiveLocation({
          latitude: Number(
            locationData.latitude
          ),
          longitude: Number(
            locationData.longitude
          ),
          accuracy: locationData.accuracy
            ? Number(locationData.accuracy)
            : null,
          updatedAt:
            locationData.updatedAt ||
            new Date().toISOString(),
        });
      }
    );

    socket.on("disconnect", () => {
      setTrackingConnected(false);
    });

    socket.on("connect_error", (socketError) => {
      console.error(
        "Live tracking connection error:",
        socketError.message
      );

      setTrackingConnected(false);
    });

    return () => {
      socket.emit(
        "order:leave",
        orderId
      );

      socket.disconnect();
      setTrackingConnected(false);
    };
  }, [order, orderId]);

  // ==========================================
// GOOGLE MAP - LIVE DELIVERY MARKER
// ==========================================

useEffect(() => {
  if (!liveLocation) {
    return;
  }

  const loadGoogleMaps = async () => {
    try {
      // Load Google Maps script only once
      if (!window.google?.maps) {
        const existingScript = document.querySelector(
          'script[data-google-maps="true"]'
        );

        if (existingScript) {
          await new Promise((resolve, reject) => {
            existingScript.addEventListener(
              "load",
              resolve,
              { once: true }
            );

            existingScript.addEventListener(
              "error",
              reject,
              { once: true }
            );
          });
        } else {
          const script =
            document.createElement("script");

          script.src =
            `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&v=weekly`;

          script.async = true;
          script.defer = true;
          script.setAttribute(
            "data-google-maps",
            "true"
          );

          document.head.appendChild(script);

          await new Promise((resolve, reject) => {
            script.onload = resolve;
            script.onerror = reject;
          });
        }
      }

      const position = {
        lat: Number(liveLocation.latitude),
        lng: Number(liveLocation.longitude),
      };

      // Create map first time
      if (!googleMapRef.current) {
        googleMapRef.current =
          new window.google.maps.Map(
            mapRef.current,
            {
              center: position,
              zoom: 16,
              mapId: "DEMO_MAP_ID",
            }
          );
      } else {
        // Move map with delivery partner
        googleMapRef.current.panTo(position);
      }

      // Create delivery marker first time
      if (!deliveryMarkerRef.current) {
        deliveryMarkerRef.current =
          new window.google.maps.Marker({
            position,
            map: googleMapRef.current,
            title: "Delivery Partner",
          });
      } else {
        // Move existing marker
        deliveryMarkerRef.current.setPosition(
          position
        );
      }
    } catch (error) {
      console.error(
        "Google Maps loading error:",
        error
      );
    }
  };

  loadGoogleMaps();
}, [liveLocation]);
  

  // ==========================================
  // FETCH ORDER
  // ==========================================

  const fetchOrder = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await API.get(
        `/orders/${orderId}`
      );

      if (response.data.success) {
        setOrder(response.data.order);
      } else {
        setError("Order not found.");
      }
    } catch (err) {
      console.error(
        "Order Details Error:",
        err
      );

      if (err.response?.status === 401) {
        localStorage.removeItem(
          "enjoMealToken"
        );

        localStorage.removeItem(
          "enjoMealUser"
        );

        navigate("/login");
        return;
      }

      setError(
        err.response?.data?.message ||
          "Failed to load order details."
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
// DOWNLOAD INVOICE PDF
// ==========================================

const handleDownloadInvoice = () => {
  if (!order) {
    alert("Order details are not available.");
    return;
  }

  try {
    const doc = new jsPDF();

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    let y = 20;

    const orderNumber = order._id
      ? String(order._id).slice(-8).toUpperCase()
      : "N/A";

    const orderDate = order.createdAt
      ? new Date(order.createdAt).toLocaleString("en-IN")
      : "N/A";

    const customerName =
      order.user?.name || "Customer";

    const customerPhone =
      order.user?.phone ||
      order.deliveryAddress?.contactPhone ||
      "N/A";

    const customerEmail =
      order.user?.email || "N/A";

    const restaurantName =
      order.restaurant?.name || "EnjoMeal Restaurant";
    const fssaiNumber =
  order.restaurant?.fssaiNumber || "N/A";

    const address = order.deliveryAddress || {};

    // ------------------------------------------
    // HEADER
    // ------------------------------------------

    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text("EnjoMeal", 20, y);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Enjoy your meal", 20, y + 6);

    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("INVOICE", pageWidth - 20, y, {
      align: "right",
    });

    y += 18;

    doc.setLineWidth(0.5);
    doc.line(20, y, pageWidth - 20, y);

    y += 12;

    // ------------------------------------------
    // ORDER INFORMATION
    // ------------------------------------------

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");

    doc.text(
      `Invoice No: EM-${orderNumber}`,
      20,
      y
    );

    doc.text(
      `Order Date: ${orderDate}`,
      pageWidth - 20,
      y,
      { align: "right" }
    );

    y += 8;

    doc.text(
      `Order Status: ${order.orderStatus || "N/A"}`,
      20,
      y
    );

    doc.text(
      `Payment: ${order.paymentMethod || "N/A"}`,
      pageWidth - 20,
      y,
      { align: "right" }
    );

    y += 15;

    // ------------------------------------------
    // CUSTOMER DETAILS
    // ------------------------------------------

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Customer Details", 20, y);

    y += 7;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");

    doc.text(`Name: ${customerName}`, 20, y);
    y += 6;

    doc.text(`Phone: ${customerPhone}`, 20, y);
    y += 6;

    doc.text(`Email: ${customerEmail}`, 20, y);
    y += 12;

    // ------------------------------------------
    // RESTAURANT
    // ------------------------------------------

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Restaurant", 20, y);

    y += 7;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(restaurantName, 20, y);

y += 6;

doc.text(
  `FSSAI No: ${fssaiNumber}`,
  20,
  y
);

y += 12;

    // ------------------------------------------
    // DELIVERY ADDRESS
    // ------------------------------------------

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Delivery Address", 20, y);

    y += 7;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");

    const addressText = [
      address.address,
      address.city,
      address.state,
      address.pincode,
      address.landmark
        ? `Landmark: ${address.landmark}`
        : "",
    ]
      .filter(Boolean)
      .join(", ");

    const addressLines = doc.splitTextToSize(
      addressText || "Address not available",
      pageWidth - 40
    );

    doc.text(addressLines, 20, y);

    y += addressLines.length * 5 + 10;

    // ------------------------------------------
    // ITEMS TABLE HEADER
    // ------------------------------------------

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Order Items", 20, y);

    y += 8;

    doc.setFillColor(245, 245, 245);
    doc.rect(20, y - 5, pageWidth - 40, 9, "F");

    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");

    doc.text("Item", 22, y);
    doc.text("Qty", 120, y);
    doc.text("Price", 145, y);
    doc.text("Total", pageWidth - 22, y, {
      align: "right",
    });

    y += 9;

    // ------------------------------------------
    // ITEMS
    // ------------------------------------------

    doc.setFont("helvetica", "normal");

    order.items?.forEach((item) => {
      if (y > pageHeight - 45) {
        doc.addPage();
        y = 20;
      }

      const itemName =
        item.food?.name ||
        item.foodName ||
        "Food";

      const quantity = Number(item.quantity || 0);
      const price = Number(item.price || 0);

      const itemTotal =
        item.itemTotal !== undefined
          ? Number(item.itemTotal)
          : quantity * price;

      const itemLines = doc.splitTextToSize(
        itemName,
        90
      );

      doc.text(itemLines, 22, y);
      doc.text(String(quantity), 120, y);
      doc.text(`Rs. ${price.toFixed(2)}`, 145, y);

      doc.text(
        `Rs. ${itemTotal.toFixed(2)}`,
        pageWidth - 22,
        y,
        { align: "right" }
      );

      y += Math.max(itemLines.length * 5, 6);

      doc.setDrawColor(220, 220, 220);
      doc.line(
        20,
        y,
        pageWidth - 20,
        y
      );

      y += 5;
    });

    // ------------------------------------------
    // BILL DETAILS
    // ------------------------------------------

    if (y > pageHeight - 90) {
      doc.addPage();
      y = 20;
    }

    y += 5;

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Bill Details", 20, y);

    y += 9;

    const subtotal = Number(order.subtotal || 0);
    const deliveryFee = Number(order.deliveryFee || 0);
    const discount = Number(order.discountAmount || 0);
    const platformCharge = Number(
      order.platformCharge || 0
    );
    const total = Number(order.totalAmount || 0);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");

    doc.text("Subtotal", 25, y);
    doc.text(
      `Rs. ${subtotal.toFixed(2)}`,
      pageWidth - 22,
      y,
      { align: "right" }
    );

    y += 7;

    doc.text("Delivery Fee", 25, y);
    doc.text(
      `Rs. ${deliveryFee.toFixed(2)}`,
      pageWidth - 22,
      y,
      { align: "right" }
    );

    y += 7;

    doc.text("Platform Charge", 25, y);
    doc.text(
      `Rs. ${platformCharge.toFixed(2)}`,
      pageWidth - 22,
      y,
      { align: "right" }
    );

    y += 7;

    doc.text("Discount", 25, y);
    doc.text(
      `- Rs. ${discount.toFixed(2)}`,
      pageWidth - 22,
      y,
      { align: "right" }
    );

    y += 8;

    doc.setLineWidth(0.5);
    doc.line(
      25,
      y,
      pageWidth - 22,
      y
    );

    y += 10;

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");

    doc.text("Grand Total", 25, y);

    doc.text(
      `Rs. ${total.toFixed(2)}`,
      pageWidth - 22,
      y,
      { align: "right" }
    );

    y += 15;

    // ------------------------------------------
    // PAYMENT STATUS
    // ------------------------------------------

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");

    doc.text(
      `Payment Status: ${
        order.paymentStatus || "PENDING"
      }`,
      20,
      y
    );

    y += 15;

    // ------------------------------------------
    // FOOTER
    // ------------------------------------------

    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);

    doc.text(
      "Thank you for ordering with EnjoMeal!",
      pageWidth / 2,
      pageHeight - 20,
      { align: "center" }
    );

    doc.save(
      `EnjoMeal-Invoice-${orderNumber}.pdf`
    );
  } catch (error) {
    console.error(
      "Invoice PDF Error:",
      error
    );

    alert(
      "Failed to generate invoice PDF."
    );
  }
};


  // ==========================================
  // CANCEL ORDER
  // ==========================================

  const handleCancelOrder = async () => {
    const confirmCancel = window.confirm(
      "Are you sure you want to cancel this order?"
    );

    if (!confirmCancel) {
      return;
    }

    try {
      setCancelling(true);
      setError("");

      const response = await API.put(
        `/orders/${orderId}/cancel`
      );

      if (response.data.success) {
        setOrder(response.data.order);

        alert(
          "Order cancelled successfully."
        );
      }
    } catch (err) {
      console.error(
        "Cancel Order Error:",
        err
      );

      if (err.response?.status === 401) {
        localStorage.removeItem(
          "enjoMealToken"
        );

        localStorage.removeItem(
          "enjoMealUser"
        );

        navigate("/login");
        return;
      }

      setError(
        err.response?.data?.message ||
          "Failed to cancel order."
      );
    } finally {
      setCancelling(false);
    }
  };

  // ==========================================
  // STATUS LABEL
  // ==========================================

  const getStatusLabel = (status) => {
    const statusMap = {
      PLACED: "Order Placed",
      CONFIRMED: "Confirmed",
      PREPARING: "Preparing",
      READY: "Ready for Delivery",
      OUT_FOR_DELIVERY:
        "Out for Delivery",
      DELIVERED: "Delivered",
      CANCELLED: "Cancelled",
    };

    return (
      statusMap[status] ||
      status ||
      "Unknown"
    );
  };

  // ==========================================
  // STATUS ICON
  // ==========================================

  const getStatusIcon = (status) => {
    const iconMap = {
      PLACED: "📝",
      CONFIRMED: "✅",
      PREPARING: "👨‍🍳",
      READY: "📦",
      OUT_FOR_DELIVERY: "🚚",
      DELIVERED: "🎉",
      CANCELLED: "❌",
    };

    return iconMap[status] || "📦";
  };

  // ==========================================
  // FORMAT DATE
  // ==========================================

  const formatDate = (date) => {
    if (!date) {
      return "";
    }

    try {
      return new Date(date).toLocaleString(
        "en-IN",
        {
          dateStyle: "medium",
          timeStyle: "short",
        }
      );
    } catch {
      return "";
    }
  };

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <div
        style={{
          padding: "30px",
          textAlign: "center",
        }}
      >
        <h2>Loading order...</h2>
      </div>
    );
  }

  // ==========================================
  // ERROR
  // ==========================================

  if (error && !order) {
    return (
      <div
        style={{
          padding: "30px",
        }}
      >
        <p
          style={{
            color: "red",
          }}
        >
          {error}
        </p>

        <button
          onClick={() =>
            navigate("/restaurants")
          }
          style={{
            padding: "10px 16px",
            border: "none",
            borderRadius: "8px",
            background: "#ff6b00",
            color: "#fff",
            cursor: "pointer",
          }}
        >
          Browse Restaurants
        </button>
      </div>
    );
  }

  if (!order) {
    return (
      <div
        style={{
          padding: "30px",
        }}
      >
        <h2>Order not found.</h2>

        <button
          onClick={() =>
            navigate("/restaurants")
          }
          style={{
            padding: "10px 16px",
            border: "none",
            borderRadius: "8px",
            background: "#ff6b00",
            color: "#fff",
            cursor: "pointer",
          }}
        >
          Browse Restaurants
        </button>
      </div>
    );
  }

  // ==========================================
  // CANCEL CONDITION
  // ==========================================

  const canCancel =
    order.orderStatus === "PLACED" ||
    order.orderStatus === "CONFIRMED";

  // ==========================================
  // DELIVERY PARTNER
  // ==========================================

  const deliveryPartner =
    order.deliveryPartner;

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "30px",
        background: "#fff8f3",
      }}
    >



    {/* ====================================
    LIVE DELIVERY LOCATION
==================================== */}

{["READY", "OUT_FOR_DELIVERY"].includes(
  order.orderStatus
) &&
  order.deliveryPartner && (
    <div
      style={{
        padding: "25px",
        background: "#fff",
        border: "1px solid #ddd",
        borderRadius: "12px",
        marginBottom: "20px",
      }}
    >
      <h2 style={{ marginTop: 0 }}>
        📍 Live Delivery Location
      </h2>

      <p>
        <strong>Status:</strong>{" "}
        {trackingConnected
          ? "🟢 Live tracking connected"
          : "🟡 Connecting..."}
      </p>

      {liveLocation ? (
  <>
    <div
      ref={mapRef}
      style={{
        width: "100%",
        height: "350px",
        marginTop: "20px",
        borderRadius: "12px",
        overflow: "hidden",
      }}
    />

    <p>
      <strong>Latitude:</strong>{" "}
      {liveLocation.latitude}
    </p>

    <p>
      <strong>Longitude:</strong>{" "}
      {liveLocation.longitude}
    </p>

    {liveLocation.accuracy && (
      <p>
        <strong>Accuracy:</strong>{" "}
        {Math.round(liveLocation.accuracy)} m
      </p>
    )}

    <p
      style={{
        fontSize: "13px",
        color: "#666",
      }}
    >
      Last updated:{" "}
      {new Date(
        liveLocation.updatedAt
      ).toLocaleTimeString("en-IN")}
    </p>
  </>
) : (
  <p style={{ color: "#666" }}>
    Waiting for delivery partner's live location...
  </p>
)}
    </div>
  )}
      
      {/* ======================================
          BACK BUTTON
      ====================================== */}

      <button
        onClick={() =>
          navigate("/my-orders")
        }
        style={{
          marginBottom: "20px",
          padding: "10px 16px",
          border: "1px solid #ddd",
          borderRadius: "8px",
          background: "#fff",
          cursor: "pointer",
        }}
      >
        ← My Orders
      </button>

      <h1
        style={{
          marginBottom: "20px",
        }}
      >
        Order Details
      </h1>

      {error && (
        <p
          style={{
            color: "red",
            marginBottom: "15px",
          }}
        >
          {error}
        </p>
      )}

      <div
        style={{
          maxWidth: "800px",
          margin: "0 auto",
        }}
      >
        {/* ====================================
            ORDER SUMMARY
        ==================================== */}

        <div
          style={{
            padding: "25px",
            background: "#fff",
            border: "1px solid #ddd",
            borderRadius: "12px",
            marginBottom: "20px",
          }}
        >
          <h2
            style={{
              marginTop: 0,
              wordBreak: "break-word",
            }}
          >
            Order #{order._id}
          </h2>

          <div
            style={{
              padding: "14px",
              background: "#fff4e8",
              borderRadius: "10px",
              marginTop: "15px",
            }}
          >
            <strong>
              {getStatusIcon(
                order.orderStatus
              )}{" "}
              {getStatusLabel(
                order.orderStatus
              )}
            </strong>
          </div>

          <p>
            <strong>Payment:</strong>{" "}
            {order.paymentMethod}
          </p>

          <p>
            <strong>Payment Status:</strong>{" "}
            {order.paymentStatus}
          </p>

          <p>
            <strong>Order Date:</strong>{" "}
            {formatDate(order.createdAt)}
          </p>
        </div>

        {/* ====================================
            DELIVERY STATUS TIMELINE
        ==================================== */}

        <div
          style={{
            padding: "25px",
            background: "#fff",
            border: "1px solid #ddd",
            borderRadius: "12px",
            marginBottom: "20px",
          }}
        >
          <h2
            style={{
              marginTop: 0,
            }}
          >
            📦 Order Tracking
          </h2>

          {[
            {
              status: "PLACED",
              label: "Order Placed",
              date: order.createdAt,
            },
            {
              status: "CONFIRMED",
              label: "Order Confirmed",
              date: order.confirmedAt,
            },
            {
              status: "PREPARING",
              label: "Preparing",
              date: order.preparingAt,
            },
            {
              status: "READY",
              label: "Ready for Delivery",
              date: order.readyAt,
            },
            {
              status: "OUT_FOR_DELIVERY",
              label: "Out for Delivery",
              date: order.outForDeliveryAt,
            },
            {
              status: "DELIVERED",
              label: "Delivered",
              date: order.deliveredAt,
            },
          ].map((step, index) => {
            const statusOrder = [
              "PLACED",
              "CONFIRMED",
              "PREPARING",
              "READY",
              "OUT_FOR_DELIVERY",
              "DELIVERED",
            ];

            const currentIndex =
              statusOrder.indexOf(
                order.orderStatus
              );

            const stepIndex =
              statusOrder.indexOf(
                step.status
              );

            const completed =
              currentIndex >= stepIndex &&
              order.orderStatus !==
                "CANCELLED";

            return (
              <div
                key={step.status}
                style={{
                  display: "flex",
                  gap: "14px",
                  marginBottom:
                    index === 5 ? 0 : "18px",
                }}
              >
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    minWidth: "32px",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent:
                      "center",
                    background: completed
                      ? "#28a745"
                      : "#e9ecef",
                    color: completed
                      ? "#fff"
                      : "#777",
                    fontWeight: "700",
                  }}
                >
                  {completed
                    ? "✓"
                    : index + 1}
                </div>

                <div>
                  <strong>
                    {step.label}
                  </strong>

                  {step.date && (
                    <p
                      style={{
                        margin:
                          "4px 0 0",
                        color: "#777",
                        fontSize:
                          "13px",
                      }}
                    >
                      {formatDate(
                        step.date
                      )}
                    </p>
                  )}
                </div>
              </div>
            );
          })}

          {order.orderStatus ===
            "CANCELLED" && (
            <div
              style={{
                marginTop: "20px",
                padding: "14px",
                background: "#ffe5e5",
                color: "#b00020",
                borderRadius: "8px",
                fontWeight: "600",
              }}
            >
              ❌ This order has been
              cancelled.
            </div>
          )}
        </div>

        {/* ====================================
            DELIVERY DETAILS
        ==================================== */}

        <div
          style={{
            padding: "25px",
            background: "#fff",
            border: "1px solid #ddd",
            borderRadius: "12px",
            marginBottom: "20px",
          }}
        >
          <h2
            style={{
              marginTop: 0,
            }}
          >
            🚚 Delivery Details
          </h2>

          {deliveryPartner ? (
            <>
              <div
                style={{
                  padding: "18px",
                  background: "#f7f7f7",
                  borderRadius: "10px",
                  marginBottom: "15px",
                }}
              >
                <h3
                  style={{
                    marginTop: 0,
                  }}
                >
                  👤 Delivery Partner
                </h3>

                <p>
                  <strong>Name:</strong>{" "}
                  {deliveryPartner.name ||
                    "Not available"}
                </p>

                <p>
                  <strong>Phone:</strong>{" "}
                  {deliveryPartner.phone ||
                    "Not available"}
                </p>
              </div>

              <div
                style={{
                  padding: "18px",
                  background: "#f7f7f7",
                  borderRadius: "10px",
                }}
              >
                <h3
                  style={{
                    marginTop: 0,
                  }}
                >
                  🛵 Vehicle Details
                </h3>

                <p>
                  <strong>
                    Vehicle Type:
                  </strong>{" "}
                  {deliveryPartner.vehicleType ||
                    "Not available"}
                </p>

                <p>
                  <strong>
                    Vehicle Number:
                  </strong>{" "}
                  {deliveryPartner.vehicleNumber ||
                    "Not available"}
                </p>
              </div>

              {deliveryPartner.isAvailable ===
                false &&
                order.orderStatus !==
                  "DELIVERED" &&
                order.orderStatus !==
                  "CANCELLED" && (
                  <p
                    style={{
                      marginTop: "15px",
                      padding: "12px",
                      background: "#fff3cd",
                      color: "#856404",
                      borderRadius: "8px",
                    }}
                  >
                    🚚 Your delivery partner
                    is currently handling
                    this order.
                  </p>
                )}
            </>
          ) : (
            <div
              style={{
                padding: "18px",
                background: "#fff8e1",
                borderRadius: "10px",
                color: "#795548",
              }}
            >
              🚚 Delivery partner has not
              been assigned yet.
              <br />
              <span
                style={{
                  fontSize: "14px",
                }}
              >
                You will be notified when a
                delivery partner is assigned.
              </span>
            </div>
          )}
        </div>

        {/* ====================================
            RESTAURANT
        ==================================== */}

        <div
          style={{
            padding: "25px",
            background: "#fff",
            border: "1px solid #ddd",
            borderRadius: "12px",
            marginBottom: "20px",
          }}
        >
          <h2
            style={{
              marginTop: 0,
            }}
          >
            🍽️ Restaurant
          </h2>

          <p>
            {order.restaurant?.name ||
              "Restaurant"}
          </p>
        </div>

        {/* ====================================
    RATE & REVIEW
==================================== */}

{order.orderStatus === "DELIVERED" && (
  <div
    style={{
      padding: "25px",
      background: "#fff",
      border: "1px solid #ddd",
      borderRadius: "12px",
      marginBottom: "20px",
    }}
  >
    <h2
      style={{
        marginTop: 0,
      }}
    >
      ⭐ Rate Your Experience
    </h2>

    <p
      style={{
        color: "#666",
        marginBottom: "18px",
      }}
    >
      Share your experience with{" "}
      <strong>
        {order.restaurant?.name ||
          "this restaurant"}
      </strong>
      .
    </p>

    <button
      onClick={() =>
        navigate(
          `/write-review/${order._id}`
        )
      }
      style={{
        width: "100%",
        padding: "14px",
        border: "none",
        borderRadius: "8px",
        background: "#e85d04",
        color: "#fff",
        fontWeight: "700",
        fontSize: "16px",
        cursor: "pointer",
      }}
    >
      ⭐ Rate & Review
    </button>
  </div>
)}

        {/* ====================================
            ITEMS
        ==================================== */}

        <div
          style={{
            padding: "25px",
            background: "#fff",
            border: "1px solid #ddd",
            borderRadius: "12px",
            marginBottom: "20px",
          }}
        >
          <h2
            style={{
              marginTop: 0,
            }}
          >
            🍴 Items
          </h2>

          {order.items?.map(
            (item, index) => (
              <div
                key={
                  item.food?._id ||
                  index
                }
                style={{
                  padding: "15px 0",
                  borderBottom:
                    index ===
                    order.items.length - 1
                      ? "none"
                      : "1px solid #eee",
                }}
              >
                <strong>
                  {item.food?.name ||
                    item.foodName ||
                    "Food"}
                </strong>

                <p
                  style={{
                    margin:
                      "7px 0",
                  }}
                >
                  Quantity:{" "}
                  {item.quantity}
                </p>

                <p
                  style={{
                    margin:
                      "7px 0",
                  }}
                >
                  Price: ₹
                  {item.price}
                </p>

                <strong>
                  Item Total: ₹
                  {item.itemTotal ??
                    Number(
                      item.price
                    ) *
                      Number(
                        item.quantity
                      )}
                </strong>
              </div>
            )
          )}
        </div>

        {/* ====================================
            BILL DETAILS
        ==================================== */}

        <div
          style={{
            padding: "25px",
            background: "#fff",
            border: "1px solid #ddd",
            borderRadius: "12px",
            marginBottom: "20px",
          }}
        >
          <h2
            style={{
              marginTop: 0,
            }}
          >
            💰 Bill Details
          </h2>

          <p>
            <strong>Subtotal:</strong>{" "}
            ₹{order.subtotal}
          </p>

          <p>
            <strong>Delivery Fee:</strong>{" "}
            ₹{order.deliveryFee || 0}
          </p>

          <p>
            <strong>Discount:</strong>{" "}
            ₹{order.discountAmount || 0}
          </p>

          <hr />

          <h2>
            Total: ₹
            {order.totalAmount}
          </h2>
        </div>

        {/* ====================================
            DELIVERY ADDRESS
        ==================================== */}

        <div
          style={{
            padding: "25px",
            background: "#fff",
            border: "1px solid #ddd",
            borderRadius: "12px",
            marginBottom: "20px",
          }}
        >
          <h2
            style={{
              marginTop: 0,
            }}
          >
            📍 Delivery Address
          </h2>

          <p>
            {order.deliveryAddress
              ?.contactName && (
              <>
                <strong>
                  Contact:
                </strong>{" "}
                {
                  order.deliveryAddress
                    .contactName
                }
                <br />
              </>
            )}

            {order.deliveryAddress
              ?.contactPhone && (
              <>
                <strong>
                  Phone:
                </strong>{" "}
                {
                  order.deliveryAddress
                    .contactPhone
                }
                <br />
              </>
            )}
          </p>

          <p>
            <strong>Address:</strong>{" "}
            {order.deliveryAddress
              ?.address ||
              "Not available"}
          </p>

          <p>
            <strong>City:</strong>{" "}
            {order.deliveryAddress
              ?.city || "Not available"}
          </p>

          {order.deliveryAddress
            ?.state && (
            <p>
              <strong>State:</strong>{" "}
              {
                order.deliveryAddress
                  .state
              }
            </p>
          )}

          <p>
            <strong>Pincode:</strong>{" "}
            {order.deliveryAddress
              ?.pincode ||
              "Not available"}
          </p>

          {order.deliveryAddress
            ?.landmark && (
            <p>
              <strong>
                Landmark:
              </strong>{" "}
              {
                order.deliveryAddress
                  .landmark
              }
            </p>
          )}
        </div>

        {/* ====================================
    DOWNLOAD INVOICE
==================================== */}

<div
  style={{
    padding: "20px",
    background: "#fff",
    border: "1px solid #ddd",
    borderRadius: "12px",
    marginBottom: "20px",
  }}
>
  <button
    onClick={handleDownloadInvoice}
    style={{
      width: "100%",
      padding: "14px",
      border: "none",
      borderRadius: "8px",
      background: "#ff7a00",
      color: "#fff",
      fontWeight: "700",
      fontSize: "16px",
      cursor: "pointer",
    }}
  >
    📄 Download Invoice PDF
  </button>
</div>

        {/* ====================================
            CANCEL ORDER
        ==================================== */}

        {canCancel && (
          <div
            style={{
              padding: "25px",
              background: "#fff",
              border: "1px solid #ddd",
              borderRadius: "12px",
              marginBottom: "20px",
            }}
          >
            <button
              onClick={
                handleCancelOrder
              }
              disabled={cancelling}
              style={{
                width: "100%",
                padding: "14px",
                border: "none",
                borderRadius: "8px",
                background: cancelling
                  ? "#aaa"
                  : "#dc3545",
                color: "#fff",
                fontWeight: "700",
                cursor: cancelling
                  ? "not-allowed"
                  : "pointer",
              }}
            >
              {cancelling
                ? "Cancelling..."
                : "Cancel Order"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default OrderDetails;
