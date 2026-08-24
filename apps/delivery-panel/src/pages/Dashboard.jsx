import { useEffect, useRef, useState } from "react";

function Dashboard() {
  const previousOrderIds = useRef([]);
  const [user, setUser] = useState(null);
  const [delivery, setDelivery] = useState(null);

  const [orders, setOrders] = useState([]);
  const [newOrderMessage, setNewOrderMessage] = useState("");

  const [loading, setLoading] = useState(true);
  const [loadingOrders, setLoadingOrders] =
    useState(false);
  const [updatingAvailability, setUpdatingAvailability] =
    useState(false);

  const [error, setError] = useState("");
  const [ordersError, setOrdersError] =
    useState("");

  // =====================================================
  // LOAD DELIVERY USER
  // =====================================================

  useEffect(() => {
    const savedUser = localStorage.getItem(
      "enjoMealDeliveryUser"
    );

    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        console.error(
          "Delivery User Parse Error:",
          error
        );
      }
    }

    fetchDeliveryProfile();
  }, []);

  // =====================================================
// AUTO REFRESH ASSIGNED ORDERS
// ACTIVE DELIVERY PARTNER ONLY
// =====================================================

useEffect(() => {
  if (
    !delivery?._id ||
    !delivery?.isActive ||
    !delivery?.isAvailable 
  ) {
    return;
  }

  const interval = setInterval(() => {
    fetchAssignedOrders(
      delivery._id
    );
  }, 30000);

  return () => {
    clearInterval(interval);
  };
}, [
  delivery?._id,
  delivery?.isActive,
  delivery?.isAvailable
]);

  // =====================================================
  // FETCH DELIVERY PROFILE
  // =====================================================

  const fetchDeliveryProfile = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem(
        "enjoMealDeliveryToken"
      );

      if (!token) {
        setError("Delivery login required.");
        return;
      }

      const response = await fetch(
        "http://localhost:5000/api/delivery/my-profile",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to fetch delivery profile."
        );
      }

      setDelivery(data.delivery);

      // Update saved user
      if (data.delivery?.user) {
        localStorage.setItem(
          "enjoMealDeliveryUser",
          JSON.stringify(data.delivery.user)
        );

        setUser(data.delivery.user);
      }

      // Fetch assigned orders
      if (data.delivery?._id) {
        fetchAssignedOrders(
          data.delivery._id
        );
      }
    } catch (error) {
      console.error(
        "Fetch Delivery Profile Error:",
        error
      );

      setError(
        error.message ||
          "Failed to fetch delivery profile."
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // FETCH ASSIGNED ORDERS
  // =====================================================

  const fetchAssignedOrders = async (
    deliveryPartnerId
  ) => {
    try {
      setLoadingOrders(true);
      setOrdersError("");

      const token = localStorage.getItem(
        "enjoMealDeliveryToken"
      );

      if (!token) {
        setOrdersError(
          "Delivery login required."
        );
        return;
      }

      if (!deliveryPartnerId) {
        setOrdersError(
          "Delivery profile ID not found."
        );
        return;
      }

      const response = await fetch(
        `http://localhost:5000/api/delivery/${deliveryPartnerId}/orders`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to fetch assigned orders."
        );
      }

      // =====================================================
// DETECT NEW ASSIGNED ORDERS
// =====================================================

const latestOrders = Array.isArray(
  data.orders
)
  ? data.orders
  : [];

const latestOrderIds =
  latestOrders.map(
    (order) => order._id
  );

// Skip notification on first load
if (
  previousOrderIds.current.length > 0
) {
  const newOrders =
    latestOrders.filter(
      (order) =>
        !previousOrderIds.current.includes(
          order._id
        )
    );

  if (newOrders.length > 0) {
    setNewOrderMessage(
      newOrders.length === 1
        ? "New order assigned to you!"
        : `${newOrders.length} new orders assigned to you!`
    );

    // Hide message after 5 seconds
    setTimeout(() => {
      setNewOrderMessage("");
    }, 5000);
  }
}

previousOrderIds.current =
  latestOrderIds;

setOrders(latestOrders);

      console.log(
        "Assigned Orders:",
        data.orders
      );
    } catch (error) {
      console.error(
        "Fetch Assigned Orders Error:",
        error
      );

      setOrdersError(
        error.message ||
          "Failed to fetch assigned orders."
      );
    } finally {
      setLoadingOrders(false);
    }
  };

  // =====================================================
  // REFRESH ORDERS
  // =====================================================

  const refreshOrders = () => {
    if (delivery?._id) {
      fetchAssignedOrders(
        delivery._id
      );
    }
  };

  // =====================================================
// DASHBOARD STATISTICS
// =====================================================

const totalOrders = orders.length;

const activeOrders = orders.filter(
  (order) =>
    order.orderStatus === "READY" ||
    order.orderStatus === "OUT_FOR_DELIVERY"
).length;

const deliveredOrders = orders.filter(
  (order) =>
    order.orderStatus === "DELIVERED"
).length;

const pendingOrders = orders.filter(
  (order) =>
    order.orderStatus !== "DELIVERED" &&
    order.orderStatus !== "CANCELLED"
).length;

// =====================================================
// ORDER HISTORY
// =====================================================

const orderHistory = orders.filter(
  (order) =>
    order.orderStatus === "DELIVERED" ||
    order.orderStatus === "CANCELLED"
);

  // =====================================================
// UPDATE ORDER STATUS
// =====================================================

const updateOrderStatus = async (
  orderId,
  newStatus
) => {
  try {
    setError("");

    const token = localStorage.getItem(
      "enjoMealDeliveryToken"
    );

    if (!token) {
      setError("Delivery login required.");
      return;
    }

    if (!orderId) {
      setError("Order ID not found.");
      return;
    }

    const response = await fetch(
      `http://localhost:5000/api/orders/${orderId}/status`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderStatus: newStatus,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message ||
          "Failed to update order status."
      );
    }

    console.log(
      "Order status updated:",
      data.order
    );

    // Refresh orders after successful update
    if (delivery?._id) {
      await fetchAssignedOrders(
        delivery._id
      );
    }
  } catch (error) {
    console.error(
      "Update Order Status Error:",
      error
    );

    setError(
      error.message ||
        "Failed to update order status."
    );
  }
};

  // =====================================================
  // UPDATE AVAILABILITY
  // =====================================================

  const updateAvailability = async (
    newStatus
  ) => {
    try {
      setUpdatingAvailability(true);
      setError("");

      const token = localStorage.getItem(
        "enjoMealDeliveryToken"
      );

      if (!token) {
        setError("Delivery login required.");
        return;
      }

      if (!delivery?._id) {
        setError(
          "Delivery profile ID not found."
        );
        return;
      }

      const response = await fetch(
        `http://localhost:5000/api/delivery/${delivery._id}/availability`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            isAvailable: newStatus,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to update availability."
        );
      }

      setDelivery(data.delivery);

      console.log(
        "Availability updated:",
        data.delivery
      );
    } catch (error) {
      console.error(
        "Update Availability Error:",
        error
      );

      setError(
        error.message ||
          "Failed to update availability."
      );
    } finally {
      setUpdatingAvailability(false);
    }
  };

  // =====================================================
  // LOGOUT
  // =====================================================

  const handleLogout = () => {
    localStorage.removeItem(
      "enjoMealDeliveryToken"
    );

    localStorage.removeItem(
      "enjoMealDeliveryUser"
    );

    window.location.reload();
  };

  // =====================================================
  // FORMAT ORDER ID
  // =====================================================

  const formatOrderId = (id) => {
    if (!id) {
      return "N/A";
    }

    return id
      .slice(-8)
      .toUpperCase();
  };

  // =====================================================
// ORDER STATUS LABEL
// =====================================================

const getStatusLabel = (status) => {
  switch (status) {
    case "READY":
      return "Ready for Delivery";

    case "OUT_FOR_DELIVERY":
      return "Out for Delivery";

    case "DELIVERED":
      return "Delivered";

    case "CANCELLED":
      return "Cancelled";

    default:
      return status || "Unknown";
  }
};

// =====================================================
// CHECK DELIVERY ACTION
// =====================================================

const canStartDelivery = (order) => {
  return order?.orderStatus === "READY";
};

const canMarkDelivered = (order) => {
  return (
    order?.orderStatus ===
    "OUT_FOR_DELIVERY"
  );
};

// =====================================================
// RETRY PROFILE
// =====================================================

const retryProfile = () => {
  fetchDeliveryProfile();
};

  // =====================================================
  // ORDER TOTAL
  // =====================================================

  const getOrderTotal = (order) => {
    if (
      typeof order?.totalAmount ===
      "number"
    ) {
      return order.totalAmount;
    }

    if (
      typeof order?.totalAmount ===
      "string"
    ) {
      return Number(
        order.totalAmount
      );
    }

    if (
      typeof order?.amount ===
      "number"
    ) {
      return order.amount;
    }

    if (
      typeof order?.total ===
      "number"
    ) {
      return order.total;
    }

    return null;
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          background: "#fff8f3",
        }}
      >
        <h2>
          Loading dashboard...
        </h2>
      </div>
    );
  }

  // =====================================================
  // PAGE START
  // =====================================================

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#fff8f3",
        padding: "25px",
      }}
    >
      {/* HEADER */}

      <div
        style={{
          display: "flex",
          justifyContent:
            "space-between",
          alignItems: "center",
          gap: "15px",
          flexWrap: "wrap",
          marginBottom: "25px",
        }}
      >
        <div>
          <h1
            style={{
              marginBottom: "5px",
            }}
          >
            EnjoMeal
          </h1>

          <p
            style={{
              margin: 0,
              color: "#666",
            }}
          >
            Delivery Partner Dashboard
          </p>
        </div>

        <button
          onClick={handleLogout}
          style={{
            padding: "10px 18px",
            border: "none",
            borderRadius: "8px",
            background: "#dc3545",
            color: "#fff",
            fontWeight: "700",
            cursor: "pointer",
          }}
        >
          Logout
        </button>
      </div>

      {/* =================================================
    NEW ORDER NOTIFICATION
================================================= */}

{newOrderMessage && (
  <div
    style={{
      background: "#d1e7dd",
      color: "#0f5132",
      padding: "14px 18px",
      borderRadius: "10px",
      marginBottom: "20px",
      fontWeight: "700",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: "12px",
      boxShadow:
        "0 2px 8px rgba(0,0,0,0.08)",
    }}
  >
    <span>
      🔔 {newOrderMessage}
    </span>

    <button
      onClick={() =>
        setNewOrderMessage("")
      }
      style={{
        border: "none",
        background: "transparent",
        color: "#0f5132",
        fontSize: "18px",
        fontWeight: "700",
        cursor: "pointer",
      }}
    >
      ✕
    </button>
  </div>
)}

      {/* =================================================
    DASHBOARD STATISTICS
================================================= */}

<div
  style={{
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(160px, 1fr))",
    gap: "15px",
    marginBottom: "20px",
  }}
>
  {/* TOTAL ORDERS */}

  <div
    style={{
      background: "#fff",
      padding: "20px",
      borderRadius: "12px",
      boxShadow:
        "0 2px 8px rgba(0,0,0,0.08)",
    }}
  >
    <p
      style={{
        margin: "0 0 8px 0",
        color: "#666",
      }}
    >
      Total Orders
    </p>

    <h2
      style={{
        margin: 0,
      }}
    >
      {totalOrders}
    </h2>
  </div>

  {/* ACTIVE ORDERS */}

  <div
    style={{
      background: "#fff",
      padding: "20px",
      borderRadius: "12px",
      boxShadow:
        "0 2px 8px rgba(0,0,0,0.08)",
    }}
  >
    <p
      style={{
        margin: "0 0 8px 0",
        color: "#666",
      }}
    >
      Active Orders
    </p>

    <h2
      style={{
        margin: 0,
      }}
    >
      {activeOrders}
    </h2>
  </div>

  {/* DELIVERED ORDERS */}

  <div
    style={{
      background: "#fff",
      padding: "20px",
      borderRadius: "12px",
      boxShadow:
        "0 2px 8px rgba(0,0,0,0.08)",
    }}
  >
    <p
      style={{
        margin: "0 0 8px 0",
        color: "#666",
      }}
    >
      Delivered
    </p>

    <h2
      style={{
        margin: 0,
      }}
    >
      {deliveredOrders}
    </h2>
  </div>

  {/* PENDING ORDERS */}

  <div
    style={{
      background: "#fff",
      padding: "20px",
      borderRadius: "12px",
      boxShadow:
        "0 2px 8px rgba(0,0,0,0.08)",
    }}
  >
    <p
      style={{
        margin: "0 0 8px 0",
        color: "#666",
      }}
    >
      Pending
    </p>

    <h2
      style={{
        margin: 0,
      }}
    >
      {pendingOrders}
    </h2>
  </div>
</div>

      {/* GENERAL ERROR */}

      {error && (
  <div
    style={{
      background: "#ffe5e5",
      color: "#dc3545",
      padding: "14px",
      borderRadius: "10px",
      marginBottom: "20px",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: "12px",
      flexWrap: "wrap",
    }}
  >
    <span>{error}</span>

    <button
      onClick={retryProfile}
      style={{
        padding: "8px 14px",
        border: "none",
        borderRadius: "7px",
        background: "#dc3545",
        color: "#fff",
        fontWeight: "700",
        cursor: "pointer",
      }}
    >
      Retry
    </button>
  </div>
)}

      {/* PROFILE */}

      <div
        style={{
          background: "#fff",
          padding: "22px",
          borderRadius: "12px",
          boxShadow:
            "0 2px 8px rgba(0,0,0,0.08)",
          marginBottom: "20px",
        }}
      >
        <h2>Welcome</h2>

        <p>
          <strong>Name:</strong>{" "}
          {delivery?.name ||
            user?.name ||
            "Delivery Partner"}
        </p>

        <p>
          <strong>Email:</strong>{" "}
          {delivery?.email ||
            user?.email ||
            "N/A"}
        </p>

        <p>
          <strong>Phone:</strong>{" "}
          {delivery?.phone ||
            user?.phone ||
            "N/A"}
        </p>

        <p
          style={{
            marginBottom: 0,
          }}
        >
          <strong>Vehicle:</strong>{" "}
          {delivery?.vehicleType ||
            "N/A"}

          {delivery?.vehicleNumber
            ? ` - ${delivery.vehicleNumber}`
            : ""}
        </p>
      </div>

      {/* AVAILABILITY */}

      <div
        style={{
          background: "#fff",
          padding: "22px",
          borderRadius: "12px",
          boxShadow:
            "0 2px 8px rgba(0,0,0,0.08)",
          marginBottom: "20px",
        }}
      >
        <h2>Availability</h2>

        <p>
          Current status:{" "}
          <strong>
            {delivery?.isAvailable
              ? "ONLINE"
              : "OFFLINE"}
          </strong>
        </p>

        <button
          onClick={() =>
            updateAvailability(
              !delivery?.isAvailable
            )
          }
          disabled={
            updatingAvailability ||
            !delivery?.isActive
          }
          style={{
            padding:
              "12px 20px",
            border: "none",
            borderRadius: "8px",
            background:
              delivery?.isAvailable
                ? "#dc3545"
                : "#198754",
            color: "#fff",
            fontWeight: "700",
            cursor:
              updatingAvailability ||
              !delivery?.isActive
                ? "not-allowed"
                : "pointer",
          }}
        >
          {updatingAvailability
            ? "Updating..."
            : delivery?.isAvailable
            ? "Go Offline"
            : "Go Online"}
        </button>

        {!delivery?.isActive && (
          <p
            style={{
              color: "#dc3545",
              fontWeight: "600",
              marginTop: "12px",
            }}
          >
            Your delivery account
            is inactive.
          </p>
        )}
      </div>
      {/* =================================================
          ASSIGNED ORDERS
      ================================================= */}

      <div
        style={{
          background: "#fff",
          padding: "22px",
          borderRadius: "12px",
          boxShadow:
            "0 2px 8px rgba(0,0,0,0.08)",
        }}
      >
        {/* ORDERS HEADER */}

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "15px",
            flexWrap: "wrap",
            marginBottom: "18px",
          }}
        >
          <div>
            <h2
              style={{
                marginBottom: "5px",
              }}
            >
              Assigned Orders
            </h2>

            <p
              style={{
                margin: 0,
                color: "#666",
              }}
            >
              Total assigned orders:{" "}
              <strong>
                {orders.length}
              </strong>
            </p>
          </div>

          <button
            onClick={refreshOrders}
            disabled={loadingOrders}
            style={{
              padding: "10px 16px",
              border: "none",
              borderRadius: "8px",
              background: loadingOrders
                ? "#aaa"
                : "#0d6efd",
              color: "#fff",
              fontWeight: "700",
              cursor: loadingOrders
                ? "not-allowed"
                : "pointer",
            }}
          >
            {loadingOrders
              ? "Refreshing..."
              : "Refresh Orders"}
          </button>
          {/* =================================================
    ORDER HISTORY
================================================= */}

<div
  style={{
    background: "#fff",
    padding: "22px",
    borderRadius: "12px",
    boxShadow:
      "0 2px 8px rgba(0,0,0,0.08)",
    marginTop: "20px",
  }}
>
  <div
    style={{
      marginBottom: "18px",
    }}
  >
    <h2
      style={{
        marginBottom: "5px",
      }}
    >
      Order History
    </h2>

    <p
      style={{
        margin: 0,
        color: "#666",
      }}
    >
      Completed and cancelled orders:{" "}
      <strong>
        {orderHistory.length}
      </strong>
    </p>
  </div>

  {orderHistory.length === 0 ? (
    <div
      style={{
        padding: "25px",
        textAlign: "center",
        background: "#f8f9fa",
        borderRadius: "10px",
      }}
    >
      <h3
        style={{
          marginBottom: "8px",
        }}
      >
        No Order History
      </h3>

      <p
        style={{
          margin: 0,
          color: "#666",
        }}
      >
        Completed or cancelled orders
        will appear here.
      </p>
    </div>
  ) : (
    <div
      style={{
        display: "grid",
        gap: "12px",
      }}
    >
      {orderHistory.map((order) => (
        <div
          key={order._id}
          style={{
            border:
              "1px solid #e5e5e5",
            borderRadius: "10px",
            padding: "15px",
            background: "#fafafa",
          }}
        >
          {/* HISTORY HEADER */}

          <div
            style={{
              display: "flex",
              justifyContent:
                "space-between",
              alignItems: "center",
              gap: "10px",
              flexWrap: "wrap",
            }}
          >
            <strong>
              Order #
              {formatOrderId(
                order._id
              )}
            </strong>

            <span
              style={{
                padding: "5px 10px",
                borderRadius: "20px",
                background:
                  order.orderStatus ===
                  "DELIVERED"
                    ? "#d1e7dd"
                    : "#f8d7da",
                color:
                  order.orderStatus ===
                  "DELIVERED"
                    ? "#0f5132"
                    : "#842029",
                fontWeight: "700",
                fontSize: "12px",
              }}
            >
              {getStatusLabel(
                order.orderStatus
              )}
            </span>
          </div>

          {/* DATE */}

          <p
            style={{
              margin:
                "8px 0 0 0",
              color: "#666",
              fontSize: "13px",
            }}
          >
            {order.createdAt
              ? new Date(
                  order.createdAt
                ).toLocaleString()
              : "Date unavailable"}
          </p>

          {/* RESTAURANT */}

          <p
            style={{
              margin:
                "8px 0 0 0",
            }}
          >
            <strong>
              Restaurant:
            </strong>{" "}
            {order.restaurant?.name ||
              "N/A"}
          </p>

          {/* TOTAL */}

          <p
            style={{
              margin:
                "5px 0 0 0",
            }}
          >
            <strong>
              Total:
            </strong>{" "}
            {getOrderTotal(order) !==
            null
              ? `₹${getOrderTotal(
                  order
                )}`
              : "N/A"}
          </p>
        </div>
      ))}
    </div>
  )}
</div>
        </div>
      

        {/* =================================================
    ORDERS ERROR
================================================= */}

{ordersError && (
  <div
    style={{
      background: "#ffe5e5",
      color: "#dc3545",
      padding: "14px",
      borderRadius: "10px",
      marginBottom: "15px",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: "12px",
      flexWrap: "wrap",
    }}
  >
    <span>
      {ordersError}
    </span>

    <button
      onClick={refreshOrders}
      disabled={loadingOrders}
      style={{
        padding: "8px 14px",
        border: "none",
        borderRadius: "7px",
        background: loadingOrders
          ? "#aaa"
          : "#dc3545",
        color: "#fff",
        fontWeight: "700",
        cursor: loadingOrders
          ? "not-allowed"
          : "pointer",
      }}
    >
      {loadingOrders
        ? "Retrying..."
        : "Retry"}
    </button>
  </div>
)}

        {/* LOADING ORDERS */}

        {loadingOrders && (
          <p
            style={{
              color: "#666",
            }}
          >
            Loading assigned orders...
          </p>
        )}

        {/* NO ORDERS */}

        {!loadingOrders &&
          !ordersError &&
          orders.length === 0 && (
            <div
              style={{
                padding: "25px",
                textAlign: "center",
                background: "#f8f9fa",
                borderRadius: "10px",
              }}
            >
              <h3
                style={{
                  marginBottom: "8px",
                }}
              >
                No Assigned Orders
              </h3>

              <p
                style={{
                  margin: 0,
                  color: "#666",
                }}
              >
                You currently have no orders
                assigned to you.
              </p>
            </div>
          )}

        {/* ORDER LIST */}

        {!loadingOrders &&
          orders.length > 0 && (
            <div
              style={{
                display: "grid",
                gap: "16px",
              }}
            >
              {orders.map((order) => {
                const total =
                  getOrderTotal(order);

                const customer =
                  order?.user;

                const restaurant =
                  order?.restaurant;

                return (
                  <div
                    key={order._id}
                    style={{
                      border:
                        "1px solid #e5e5e5",
                      borderRadius: "10px",
                      padding: "18px",
                      background: "#fff",
                    }}
                  >
                    {/* ORDER HEADER */}

                    <div
                      style={{
                        display: "flex",
                        justifyContent:
                          "space-between",
                        alignItems: "center",
                        gap: "10px",
                        flexWrap: "wrap",
                        marginBottom: "15px",
                      }}
                    >
                      <div>
                        <h3
                          style={{
                            margin:
                              "0 0 5px 0",
                          }}
                        >
                          Order #
                          {formatOrderId(
                            order._id
                          )}
                        </h3>


                        <small
                          style={{
                            color: "#666",
                          }}
                        >
                          {order.createdAt
                            ? new Date(
                                order.createdAt
                              ).toLocaleString()
                            : "Date unavailable"}
                        </small>
                      </div>

                      <span
                        style={{
                          padding:
                            "6px 10px",
                          borderRadius:
                            "20px",
                          background:
                            "#fff3cd",
                          color: "#856404",
                          fontWeight: "700",
                          fontSize: "13px",
                        }}
                      >
                        {getStatusLabel(order.orderStatus)}
                      </span>
                    </div>


                    {/* =================================================
    ORDER STATUS PROGRESS
================================================= */}

<div
  style={{
    marginBottom: "18px",
    padding: "14px",
    background: "#f8f9fa",
    borderRadius: "10px",
  }}
>
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      gap: "8px",
      flexWrap: "wrap",
      fontSize: "13px",
      fontWeight: "700",
    }}
  >
    <span
      style={{
        color:
          order.orderStatus === "READY" ||
          order.orderStatus ===
            "OUT_FOR_DELIVERY" ||
          order.orderStatus === "DELIVERED"
            ? "#198754"
            : "#999",
      }}
    >
      ✓ Ready
    </span>

    <span
      style={{
        color:
          order.orderStatus ===
            "OUT_FOR_DELIVERY" ||
          order.orderStatus ===
            "DELIVERED"
            ? "#198754"
            : "#999",
      }}
    >
      {order.orderStatus ===
        "OUT_FOR_DELIVERY" ||
      order.orderStatus ===
        "DELIVERED"
        ? "✓"
        : "○"}{" "}
      Out for Delivery
    </span>

    <span
      style={{
        color:
          order.orderStatus ===
          "DELIVERED"
            ? "#198754"
            : "#999",
      }}
    >
      {order.orderStatus ===
      "DELIVERED"
        ? "✓"
        : "○"}{" "}
      Delivered
    </span>
  </div>
</div>                

                    {/* CUSTOMER */}

                    <div
                      style={{
                        marginBottom:
                          "12px",
                      }}
                    >
                      <strong>
                        Customer
                      </strong>

                      <p
                        style={{
                          margin:
                            "5px 0 0 0",
                        }}
                      >
                        {customer?.name ||
                          "N/A"}
                      </p>

                      {customer?.phone && (
                        <p
                          style={{
                            margin:
                              "4px 0 0 0",
                            color: "#666",
                          }}
                        >
                          Phone:{" "}
                          {customer.phone}
                        </p>
                      )}
                    </div>

                    {/* RESTAURANT */}

                    <div
                      style={{
                        marginBottom:
                          "12px",
                      }}
                    >
                      <strong>
                        Restaurant
                      </strong>

                      <p
                        style={{
                          margin:
                            "5px 0 0 0",
                        }}
                      >
                        {restaurant?.name ||
                          "N/A"}
                      </p>
                    </div>

                    {/* ITEMS */}

                    <div
                      style={{
                        marginBottom:
                          "12px",
                      }}
                    >
                      <strong>
                        Items
                      </strong>

                      {Array.isArray(
                        order.items
                      ) &&
                      order.items.length >
                        0 ? (
                        <div
                          style={{
                            marginTop:
                              "8px",
                            display:
                              "grid",
                            gap: "6px",
                          }}
                        >
                          {order.items.map(
                            (
                              item,
                              index
                            ) => (
                              <div
                                key={
                                  item._id ||
                                  index
                                }
                                style={{
                                  display:
                                    "flex",
                                  justifyContent:
                                    "space-between",
                                  gap: "10px",
                                  padding:
                                    "8px",
                                  background:
                                    "#f8f9fa",
                                  borderRadius:
                                    "6px",
                                }}
                              >
                                <span>
                                  {item
                                    ?.food
                                    ?.name ||
                                    "Food item"}
                                </span>

                                <strong>
                                  ×{" "}
                                  {item.quantity ||
                                    1}
                                </strong>
                              </div>
                            )
                          )}
                        </div>
                      ) : (
                        <p
                          style={{
                            color: "#666",
                          }}
                        >
                          No item details
                          available.
                        </p>
                      )}
                    </div>

                    {/* DELIVERY ADDRESS */}

{order.deliveryAddress && (
  <div
    style={{
      marginBottom: "12px",
    }}
  >
    <strong>
      Delivery Address
    </strong>

    <p
      style={{
        margin: "5px 0 0 0",
        color: "#555",
      }}
    >
      {typeof order.deliveryAddress === "string"
        ? order.deliveryAddress
        : [
            order.deliveryAddress?.address,
            order.deliveryAddress?.city,
            order.deliveryAddress?.state,
            order.deliveryAddress?.pincode,
          ]
            .filter(Boolean)
            .join(", ") ||
          "Address available"}
    </p>

    <button
      onClick={() => {
        const address =
          typeof order.deliveryAddress === "string"
            ? order.deliveryAddress
            : [
                order.deliveryAddress?.address,
                order.deliveryAddress?.city,
                order.deliveryAddress?.state,
                order.deliveryAddress?.pincode,
              ]
                .filter(Boolean)
                .join(", ");

        if (!address) {
          setError(
            "Delivery address not available."
          );
          return;
        }

        const mapsUrl =
          "https://www.google.com/maps/search/?api=1&query=" +
          encodeURIComponent(address);

        window.open(
          mapsUrl,
          "_blank",
          "noopener,noreferrer"
        );
      }}
      style={{
        marginTop: "10px",
        padding: "10px 15px",
        border: "none",
        borderRadius: "8px",
        background: "#0d6efd",
        color: "#fff",
        fontWeight: "700",
        cursor: "pointer",
      }}
    >
      🗺️ Open in Google Maps
    </button>
  </div>
)}

                    {/* =================================================
    DELIVERY INFORMATION
================================================= */}

<div
  style={{
    marginBottom: "12px",
    padding: "12px",
    background: "#f8f9fa",
    borderRadius: "8px",
  }}
>
  <strong>Delivery Information</strong>

  <p
    style={{
      margin: "8px 0 0 0",
      color: "#555",
    }}
  >
    <strong>Customer:</strong>{" "}
    {customer?.name || "N/A"}
  </p>

  {customer?.phone && (
    <p
      style={{
        margin: "5px 0 0 0",
        color: "#555",
      }}
    >
      <strong>Phone:</strong>{" "}
      {customer.phone}
    </p>
  )}

  <p
    style={{
      margin: "5px 0 0 0",
      color: "#555",
    }}
  >
    <strong>Payment:</strong>{" "}
    {order.paymentMethod || "COD"}
  </p>

  <p
    style={{
      margin: "5px 0 0 0",
      color: "#555",
    }}
  >
    <strong>Payment Status:</strong>{" "}
    {order.paymentStatus || "PENDING"}
  </p>
</div>

                    {/* =================================================
                        DELIVERY ACTION
                    ================================================= */}

                    <div
                      style={{
                        marginTop: "15px",
                        marginBottom: "15px",
                      }}
                    >
                      {canStartDelivery(order) && (
                        <button
                          onClick={() =>
                            updateOrderStatus(
                              order._id,
                              "OUT_FOR_DELIVERY"
                            )
                          }
                          style={{
                            width: "100%",
                            padding: "12px",
                            border: "none",
                            borderRadius: "8px",
                            background: "#e85d04",
                            color: "#fff",
                            fontWeight: "700",
                            cursor: "pointer",
                          }}
                        >
                          Start Delivery
                        </button>
                      )}

                      {canMarkDelivered(order) && (
                        <button
                          onClick={() =>
                            updateOrderStatus(
                              order._id,
                              "DELIVERED"
                            )
                          }
                          style={{
                            width: "100%",
                            padding: "12px",
                            border: "none",
                            borderRadius: "8px",
                            background: "#198754",
                            color: "#fff",
                            fontWeight: "700",
                            cursor: "pointer",
                          }}
                        >
                          Mark Delivered
                        </button>
                      )}

                      {order.orderStatus ===
  "DELIVERED" && (
  <div
    style={{
      width: "100%",
      padding: "14px",
      boxSizing:
        "border-box",
      borderRadius: "8px",
      background: "#d1e7dd",
      color: "#0f5132",
      fontWeight: "700",
      textAlign: "center",
    }}
  >
    ✓ Delivery Completed
    <div
      style={{
        marginTop: "5px",
        fontSize: "13px",
        fontWeight: "500",
      }}
    >
      This order has been successfully delivered.
    </div>
  </div>
)}
                    </div>

                    {/* TOTAL */}

                    <div
                      style={{
                        borderTop:
                          "1px solid #eee",
                        paddingTop: "12px",
                        display: "flex",
                        justifyContent:
                          "space-between",
                        alignItems:
                          "center",
                        gap: "10px",
                      }}
                    >
                      <strong>
                        Order Total
                      </strong>

                      <strong
                        style={{
                          fontSize:
                            "18px",
                        }}
                      >
                        {total !== null
                          ? `₹${total}`
                          : "N/A"}
                      </strong>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
      </div>
    </div>
  );
}

export default Dashboard;