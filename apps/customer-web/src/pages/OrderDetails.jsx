import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import API from "../api/api";

function OrderDetails() {
  const { orderId } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

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
