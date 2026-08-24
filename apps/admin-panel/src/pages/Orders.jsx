import { useEffect, useState } from "react";

function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedOrder, setSelectedOrder] =
  useState(null);

const [loadingDetails, setLoadingDetails] =
  useState(false);

const [detailsError, setDetailsError] =
  useState("");

const [updatingOrderId, setUpdatingOrderId] = useState(null);

const [deliveryPartners, setDeliveryPartners] = useState([]);
const [loadingPartners, setLoadingPartners] = useState(false);
const [assigningOrderId, setAssigningOrderId] = useState(null);
const [selectedPartnerId, setSelectedPartnerId] = useState("");
const [searchTerm, setSearchTerm] = useState("");
const [statusFilter, setStatusFilter] = useState("ALL");
const [paymentFilter, setPaymentFilter] = useState("ALL");

 // ===============================
// GET ADMIN TOKEN
// ===============================
const getToken = () => {
  const token = localStorage.getItem("enjoMealToken");

  return token ? token.trim() : null;
};

  // ============================================
  // FETCH ALL ORDERS
  // ============================================

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError("");

      const token = getToken();

      if (!token) {
        throw new Error(
          "Admin token not found. Please login again."
        );
      }

      const response = await fetch(
        "http://localhost:5000/api/orders/all",
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to fetch orders"
        );
      }

      setOrders(
        Array.isArray(data.orders)
          ? data.orders
          : []
      );
    } catch (err) {
      console.error("Fetch Orders Error:", err);

      setError(
        err.message ||
          "Something went wrong while loading orders."
      );
    } finally {
      setLoading(false);
    }
  };
  // ============================================
// PHASE 2 - FETCH AVAILABLE DELIVERY PARTNERS
// ============================================

const fetchDeliveryPartners = async () => {
  try {
    setLoadingPartners(true);
    setError("");

    const token = getToken();

    if (!token) {
      throw new Error(
        "Admin token not found. Please login again."
      );
    }

    const response = await fetch(
      "http://localhost:5000/api/delivery/all",
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
        data.message ||
          "Failed to fetch delivery partners."
      );
    }

    const list =
      data.deliveryPartners ||
      data.deliveries ||
      data.data ||
      [];

    // Only active + available partners
    const availablePartners = Array.isArray(list)
      ? list.filter(
          (partner) =>
            partner.isActive === true &&
            partner.isAvailable === true
        )
      : [];

    setDeliveryPartners(
      availablePartners
    );
  } catch (err) {
    console.error(
      "Fetch Delivery Partners Error:",
      err
    );

    setError(
      err.message ||
        "Failed to fetch delivery partners."
    );
  } finally {
    setLoadingPartners(false);
  }
};
// ============================================
// PHASE 2 - ASSIGN DELIVERY PARTNER
// ============================================

const assignDeliveryPartner = async (
  orderId,
  deliveryPartnerId
) => {
  try {
    setAssigningOrderId(orderId);
    setError("");

    const token = getToken();

    if (!token) {
      throw new Error(
        "Admin token not found. Please login again."
      );
    }

    if (!orderId) {
      throw new Error("Order ID not found.");
    }

    if (!deliveryPartnerId) {
      throw new Error(
        "Please select a delivery partner."
      );
    }

    const response = await fetch(
      `http://localhost:5000/api/orders/${orderId}/assign-delivery`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          deliveryPartner: deliveryPartnerId,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(
        data.message ||
          "Failed to assign delivery partner."
      );
    }

    // Update order in list
    setOrders((previousOrders) =>
      previousOrders.map((order) =>
        order._id === orderId
          ? data.order
          : order
      )
    );

    // Update selected order
    if (selectedOrder?._id === orderId) {
      setSelectedOrder(data.order);
    }

    // Clear selection
    setSelectedPartnerId("");

    // Refresh available partners
    await fetchDeliveryPartners();

  } catch (err) {
    console.error(
      "Assign Delivery Partner Error:",
      err
    );

    setError(
      err.message ||
        "Failed to assign delivery partner."
    );
  } finally {
    setAssigningOrderId(null);
  }
};

  // ============================================
// FETCH SINGLE ORDER DETAILS
// ============================================

const fetchOrderDetails = async (orderId) => {
  try {
    setLoadingDetails(true);
    setDetailsError("");

    const token = getToken();

    if (!token) {
      throw new Error(
        "Admin token not found. Please login again."
      );
    }

    if (!orderId) {
      throw new Error("Order ID not found.");
    }

    const response = await fetch(
      `http://localhost:5000/api/orders/${orderId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message ||
          "Failed to fetch order details."
      );
    }

    setSelectedOrder(data.order);
  } catch (err) {
    console.error(
      "Fetch Order Details Error:",
      err
    );

    setDetailsError(
      err.message ||
        "Failed to fetch order details."
    );
  } finally {
    setLoadingDetails(false);
  }
};

// ============================================
// UPDATE ORDER STATUS
// ADMIN
// ============================================

const updateOrderStatus = async (
  orderId,
  newStatus
) => {
  try {
    setUpdatingOrderId(orderId);
    setError("");

    const token = getToken();

    if (!token) {
      throw new Error(
        "Admin token not found. Please login again."
      );
    }

    const response = await fetch(
      `http://localhost:5000/api/orders/${orderId}/status`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
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

    // Update order in list
    setOrders((previousOrders) =>
      previousOrders.map((order) =>
        order._id === orderId
          ? data.order
          : order
      )
    );

    // Update selected order if open
    if (
      selectedOrder?._id === orderId
    ) {
      setSelectedOrder(data.order);
    }

  } catch (err) {
    console.error(
      "Update Order Status Error:",
      err
    );

    setError(
      err.message ||
        "Failed to update order status."
    );
  } finally {
    setUpdatingOrderId(null);
  }
};

  // ============================================
  // LOAD ORDERS
  // ============================================

  useEffect(() => {
  fetchOrders();
  fetchDeliveryPartners();
}, []);

  // ============================================
  // ORDER ID
  // ============================================

  const formatOrderId = (id) => {
    if (!id) return "N/A";

    return id
      .toString()
      .slice(-6)
      .toUpperCase();
  };

  // ============================================
  // STATUS
  // ============================================

  const getStatusStyle = (status) => {
    switch (status) {
      case "DELIVERED":
        return {
          background: "#d1e7dd",
          color: "#0f5132",
        };

      case "CANCELLED":
        return {
          background: "#f8d7da",
          color: "#842029",
        };

      case "OUT_FOR_DELIVERY":
        return {
          background: "#cff4fc",
          color: "#055160",
        };

      case "READY":
        return {
          background: "#fff3cd",
          color: "#664d03",
        };

      case "PREPARING":
        return {
          background: "#e2e3e5",
          color: "#41464b",
        };

      case "CONFIRMED":
        return {
          background: "#cfe2ff",
          color: "#084298",
        };

      default:
        return {
          background: "#eee",
          color: "#555",
        };
    }
  };


  // ============================================
  // TOTAL
  // ============================================

  const getTotal = (order) => {
    if (
      typeof order?.totalAmount === "number"
    ) {
      return order.totalAmount;
    }

    if (
      typeof order?.totalAmount === "string"
    ) {
      return Number(order.totalAmount);
    }

    return null;
  };

  // ============================================
// CANCEL ORDER
// ADMIN
// ============================================

const cancelOrder = async (orderId) => {
  try {
    setUpdatingOrderId(orderId);
    setError("");

    const token = getToken();

    if (!token) {
      throw new Error(
        "Admin token not found. Please login again."
      );
    }

    const response = await fetch(
      `http://localhost:5000/api/orders/${orderId}/cancel`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(
        data.message ||
          "Failed to cancel order."
      );
    }

    // Update order list
    setOrders((previousOrders) =>
      previousOrders.map((order) =>
        order._id === orderId
          ? data.order
          : order
      )
    );

    // Update selected order
    if (selectedOrder?._id === orderId) {
      setSelectedOrder(data.order);
    }

  } catch (err) {
    console.error(
      "Cancel Order Error:",
      err
    );

    setError(
      err.message ||
        "Failed to cancel order."
    );
  } finally {
    setUpdatingOrderId(null);
  }
};

// ============================================
// UPDATE PAYMENT STATUS
// ADMIN
// ============================================

const updatePaymentStatus = async (
  orderId,
  paymentStatus
) => {
  try {
    setUpdatingOrderId(orderId);
    setError("");

    const token = getToken();

    if (!token) {
      throw new Error(
        "Admin token not found. Please login again."
      );
    }

    const response = await fetch(
      `http://localhost:5000/api/orders/${orderId}/payment-status`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          paymentStatus,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(
        data.message ||
          "Failed to update payment status."
      );
    }

    // Update order list
    setOrders((previousOrders) =>
      previousOrders.map((order) =>
        order._id === orderId
          ? data.order
          : order
      )
    );

    // Update selected order
    if (selectedOrder?._id === orderId) {
      setSelectedOrder(data.order);
    }

  } catch (err) {
    console.error(
      "Update Payment Status Error:",
      err
    );

    setError(
      err.message ||
        "Failed to update payment status."
    );
  } finally {
    setUpdatingOrderId(null);
  }
};

  // ============================================
// FORMAT DELIVERY ADDRESS
// ============================================

const getDeliveryAddress = (address) => {
  if (!address) {
    return "Address unavailable";
  }

  if (typeof address === "string") {
    return address;
  }

  return [
    address.address,
    address.city,
    address.state,
    address.pincode,
  ]
    .filter(Boolean)
    .join(", ") || "Address unavailable";
};

// ============================================
// SEARCH + FILTER ORDERS
// ============================================

const filteredOrders = orders.filter((order) => {
  const search = searchTerm
    .trim()
    .toLowerCase();

  const orderId = order._id
    ? order._id.toString().toLowerCase()
    : "";

  const customerName =
    order.user?.name?.toLowerCase() || "";

  const restaurantName =
    order.restaurant?.name?.toLowerCase() || "";

  const matchesSearch =
    !search ||
    orderId.includes(search) ||
    customerName.includes(search) ||
    restaurantName.includes(search);

  const matchesStatus =
    statusFilter === "ALL" ||
    order.orderStatus === statusFilter;

  const matchesPayment =
    paymentFilter === "ALL" ||
    order.paymentStatus === paymentFilter;

  return (
    matchesSearch &&
    matchesStatus &&
    matchesPayment
  );
});

// ============================================
// ORDER STATISTICS
// ============================================

const orderStats = {
  total: orders.length,

  placed: orders.filter(
    (order) =>
      order.orderStatus === "PLACED"
  ).length,

  confirmed: orders.filter(
    (order) =>
      order.orderStatus === "CONFIRMED"
  ).length,

  preparing: orders.filter(
    (order) =>
      order.orderStatus === "PREPARING"
  ).length,

  ready: orders.filter(
    (order) =>
      order.orderStatus === "READY"
  ).length,

  outForDelivery: orders.filter(
    (order) =>
      order.orderStatus ===
      "OUT_FOR_DELIVERY"
  ).length,

  delivered: orders.filter(
    (order) =>
      order.orderStatus === "DELIVERED"
  ).length,

  cancelled: orders.filter(
    (order) =>
      order.orderStatus === "CANCELLED"
  ).length,
};

  // ============================================
  // LOADING
  // ============================================

  if (loading) {
    return (
      <div
        style={{
          padding: "30px",
          textAlign: "center",
        }}
      >
        <h2>Loading Orders...</h2>
      </div>
    );
  }

  // ============================================
  // PAGE
  // ============================================

  return (
    <div
      style={{
        padding: "25px",
      }}
    >
      {/* HEADER */}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "15px",
          flexWrap: "wrap",
          marginBottom: "25px",
        }}
      >
        <div>
          <h1
            style={{
              margin: "0 0 5px 0",
            }}
          >
            Orders
          </h1>

          <p
            style={{
              margin: 0,
              color: "#666",
            }}
          >
            Manage all EnjoMeal orders
          </p>
        </div>

        <button
          onClick={fetchOrders}
          style={{
            padding: "10px 18px",
            border: "none",
            borderRadius: "8px",
            background: "#0d6efd",
            color: "#fff",
            fontWeight: "700",
            cursor: "pointer",
          }}
        >
          Refresh Orders
        </button>
      </div>

      {/* ERROR */}

      {error && (
        <div
          style={{
            background: "#ffe5e5",
            color: "#dc3545",
            padding: "15px",
            borderRadius: "10px",
            marginBottom: "20px",
            fontWeight: "600",
          }}
        >
          {error}
        </div>
      )}

      {/* ============================================
    ORDER STATISTICS
============================================ */}

<div
  style={{
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(130px, 1fr))",
    gap: "12px",
    marginBottom: "20px",
  }}
>
  {[
    ["Total", orderStats.total],
    ["Placed", orderStats.placed],
    ["Confirmed", orderStats.confirmed],
    ["Preparing", orderStats.preparing],
    ["Ready", orderStats.ready],
    [
      "Out for Delivery",
      orderStats.outForDelivery,
    ],
    ["Delivered", orderStats.delivered],
    ["Cancelled", orderStats.cancelled],
  ].map(([label, count]) => (
    <div
      key={label}
      style={{
        background: "#fff",
        padding: "15px",
        borderRadius: "10px",
        boxShadow:
          "0 2px 8px rgba(0,0,0,0.08)",
      }}
    >
      <div
        style={{
          color: "#666",
          fontSize: "12px",
          marginBottom: "6px",
        }}
      >
        {label}
      </div>

      <strong
        style={{
          fontSize: "22px",
        }}
      >
        {count}
      </strong>
    </div>
  ))}
</div>

{/* ============================================
    SEARCH + FILTERS
============================================ */}

<div
  style={{
    background: "#fff",
    padding: "15px",
    borderRadius: "12px",
    marginBottom: "20px",
    boxShadow:
      "0 2px 8px rgba(0,0,0,0.08)",
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
  }}
>
  <input
    type="text"
    placeholder="Search order, customer or restaurant..."
    value={searchTerm}
    onChange={(e) =>
      setSearchTerm(e.target.value)
    }
    style={{
      flex: "1 1 240px",
      padding: "11px",
      border: "1px solid #ddd",
      borderRadius: "8px",
      boxSizing: "border-box",
    }}
  />

  <select
    value={statusFilter}
    onChange={(e) =>
      setStatusFilter(e.target.value)
    }
    style={{
      flex: "1 1 170px",
      padding: "11px",
      border: "1px solid #ddd",
      borderRadius: "8px",
      background: "#fff",
    }}
  >
    <option value="ALL">
      All Status
    </option>
    <option value="PLACED">
      Placed
    </option>
    <option value="CONFIRMED">
      Confirmed
    </option>
    <option value="PREPARING">
      Preparing
    </option>
    <option value="READY">
      Ready
    </option>
    <option value="OUT_FOR_DELIVERY">
      Out for Delivery
    </option>
    <option value="DELIVERED">
      Delivered
    </option>
    <option value="CANCELLED">
      Cancelled
    </option>
  </select>

  <select
    value={paymentFilter}
    onChange={(e) =>
      setPaymentFilter(e.target.value)
    }
    style={{
      flex: "1 1 150px",
      padding: "11px",
      border: "1px solid #ddd",
      borderRadius: "8px",
      background: "#fff",
    }}
  >
    <option value="ALL">
      All Payments
    </option>
    <option value="PENDING">
      Pending
    </option>
    <option value="PAID">
      Paid
    </option>
    <option value="FAILED">
      Failed
    </option>
  </select>

  <button
    onClick={() => {
      setSearchTerm("");
      setStatusFilter("ALL");
      setPaymentFilter("ALL");
    }}
    style={{
      padding: "11px 16px",
      border: "none",
      borderRadius: "8px",
      background: "#6c757d",
      color: "#fff",
      fontWeight: "600",
      cursor: "pointer",
    }}
  >
    Clear
  </button>
</div>

{/* FILTER RESULT COUNT */}

<div
  style={{
    marginBottom: "15px",
    color: "#666",
    fontSize: "13px",
  }}
>
  Showing{" "}
  <strong>
    {filteredOrders.length}
  </strong>{" "}
  of{" "}
  <strong>
    {orders.length}
  </strong>{" "}
  orders
</div>


      {/* NO ORDERS */}

      {orders.length === 0 && !error && (
        <div
          style={{
            background: "#fff",
            padding: "40px",
            borderRadius: "12px",
            textAlign: "center",
            boxShadow:
              "0 2px 8px rgba(0,0,0,0.08)",
          }}
        >

          {orders.length > 0 &&
  filteredOrders.length === 0 && (
    <div
      style={{
        background: "#fff",
        padding: "40px",
        borderRadius: "12px",
        textAlign: "center",
        boxShadow:
          "0 2px 8px rgba(0,0,0,0.08)",
      }}
    >
      <h2>No Matching Orders</h2>

      <p style={{ color: "#666" }}>
        No orders match your current search
        or filters.
      </p>

      <button
        onClick={() => {
          setSearchTerm("");
          setStatusFilter("ALL");
          setPaymentFilter("ALL");
        }}
        style={{
          marginTop: "10px",
          padding: "10px 16px",
          border: "none",
          borderRadius: "8px",
          background: "#0d6efd",
          color: "#fff",
          fontWeight: "600",
          cursor: "pointer",
        }}
      >
        Clear Filters
      </button>
    </div>
  )}
          <h2>No Orders Found</h2>

          <p
            style={{
              color: "#666",
            }}
          >
            There are currently no orders.
          </p>
        </div>
      )}

      {/* ORDERS */}

      {orders.length > 0 && (
        <div
          style={{
            display: "grid",
            gap: "16px",
          }}
        >
          {filteredOrders.map((order) => {
            const total = getTotal(order);

            const statusStyle =
              getStatusStyle(
                order.orderStatus
              );

            return (
              <div
                key={order._id}
                style={{
                  background: "#fff",
                  padding: "20px",
                  borderRadius: "12px",
                  boxShadow:
                    "0 2px 8px rgba(0,0,0,0.08)",
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
                        margin: "0 0 5px 0",
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
                      padding: "6px 12px",
                      borderRadius: "20px",
                      fontWeight: "700",
                      fontSize: "12px",
                      ...statusStyle,
                    }}
                  >
                    {order.orderStatus ||
                      "UNKNOWN"}
                  </span>
                </div>

                {/* CUSTOMER */}

                <div
                  style={{
                    marginBottom: "12px",
                  }}
                >
                  <strong>
                    Customer
                  </strong>

                  <p
                    style={{
                      margin: "5px 0",
                    }}
                  >
                    {order.user?.name ||
                      "N/A"}
                  </p>

                  {order.user?.phone && (
                    <p
                      style={{
                        margin: "3px 0",
                        color: "#666",
                      }}
                    >
                      Phone:{" "}
                      {order.user.phone}
                    </p>
                  )}

                  {order.user?.email && (
                    <p
                      style={{
                        margin: "3px 0",
                        color: "#666",
                      }}
                    >
                      Email:{" "}
                      {order.user.email}
                    </p>
                  )}
                </div>

                {/* RESTAURANT */}

                <div
                  style={{
                    marginBottom: "12px",
                  }}
                >
                  <strong>
                    Restaurant
                  </strong>

                  <p
                    style={{
                      margin: "5px 0",
                    }}
                  >
                    {order.restaurant
                      ?.name || "N/A"}
                  </p>
                </div>

                {/* ITEMS */}

                <div
                  style={{
                    marginBottom: "12px",
                  }}
                >
                  <strong>Items</strong>

                  {Array.isArray(
                    order.items
                  ) &&
                  order.items.length > 0 ? (
                    <div
                      style={{
                        marginTop: "8px",
                        display: "grid",
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
                              padding:
                                "8px",
                              background:
                                "#f8f9fa",
                              borderRadius:
                                "6px",
                            }}
                          >
                            <span>
                              {item.food
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

                {/* PAYMENT */}

                <div
                  style={{
                    marginBottom: "12px",
                    padding: "12px",
                    background:
                      "#f8f9fa",
                    borderRadius: "8px",
                  }}
                >
                  <p
                    style={{
                      margin: "0 0 5px 0",
                    }}
                  >
                    <strong>
                      Payment:
                    </strong>{" "}
                    {order.paymentMethod ||
                      "COD"}
                  </p>

                  <p
                    style={{
                      margin: 0,
                    }}
                  >
                    <strong>
                      Payment Status:
                    </strong>{" "}
                    {order.paymentStatus ||
                      "PENDING"}
                  </p>
                </div>

                {/* ADDRESS */}

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
                        margin:
                          "5px 0",
                        color: "#555",
                      }}
                    >
                      {typeof order.deliveryAddress ===
                      "string"
                        ? order.deliveryAddress
                        : [
                            order
                              .deliveryAddress
                              ?.address,
                            order
                              .deliveryAddress
                              ?.city,
                            order
                              .deliveryAddress
                              ?.state,
                            order
                              .deliveryAddress
                              ?.pincode,
                          ]
                            .filter(
                              Boolean
                            )
                            .join(
                              ", "
                            ) ||
                          "Address available"}
                    </p>
                  </div>
                )}

                
                {/* TOTAL */}

                <div
                  style={{
                    borderTop:
                      "1px solid #eee",
                    paddingTop: "12px",
                    display: "flex",
                    justifyContent:
                      "space-between",
                    alignItems: "center",
                  }}
                >
                  <strong>
                    Order Total
                  </strong>

                  <strong
                    style={{
                      fontSize: "18px",
                    }}
                  >
                    {total !== null
                      ? `₹${total}`
                      : "N/A"}
                  </strong>
                  {/* VIEW DETAILS */}

<button
  onClick={() =>
    fetchOrderDetails(order._id)
  }
  style={{
    width: "100%",
    marginTop: "15px",
    padding: "11px",
    border: "none",
    borderRadius: "8px",
    background: "#212529",
    color: "#fff",
    fontWeight: "700",
    cursor: "pointer",
  }}
>
  👁️ View Details
</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {/* ============================================
    ORDER DETAILS MODAL
============================================ */}

{selectedOrder && (
  <div
    style={{
      position: "fixed",
      inset: 0,
      background:
        "rgba(0,0,0,0.55)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      padding: "20px",
      zIndex: 1000,
      overflowY: "auto",
    }}
  >
    <div
      style={{
        width: "100%",
        maxWidth: "700px",
        maxHeight: "90vh",
        overflowY: "auto",
        background: "#fff",
        borderRadius: "14px",
        padding: "25px",
        boxSizing: "border-box",
        boxShadow:
          "0 10px 30px rgba(0,0,0,0.2)",
      }}
    >
      {/* MODAL HEADER */}

      <div
        style={{
          display: "flex",
          justifyContent:
            "space-between",
          alignItems: "center",
          gap: "15px",
          marginBottom: "20px",
        }}
      >
        <div>
          <h2
            style={{
              margin: "0 0 5px 0",
            }}
          >
            Order #
            {formatOrderId(
              selectedOrder._id
            )}
          </h2>

          <small
            style={{
              color: "#666",
            }}
          >
            {selectedOrder.createdAt
              ? new Date(
                  selectedOrder.createdAt
                ).toLocaleString()
              : "Date unavailable"}
          </small>
        </div>

        <button
          onClick={() => {
            setSelectedOrder(null);
            setDetailsError("");
          }}
          style={{
            border: "none",
            background: "#f1f3f5",
            borderRadius: "8px",
            padding: "8px 12px",
            fontSize: "18px",
            cursor: "pointer",
          }}
        >
          ✕
        </button>
      </div>

      {/* DETAILS ERROR */}

      {detailsError && (
        <div
          style={{
            background: "#ffe5e5",
            color: "#dc3545",
            padding: "12px",
            borderRadius: "8px",
            marginBottom: "15px",
            fontWeight: "600",
          }}
        >
          {detailsError}
        </div>
      )}

      {/* STATUS */}

      <div
        style={{
          marginBottom: "18px",
          padding: "14px",
          background: "#f8f9fa",
          borderRadius: "10px",
        }}
      >
        <strong>
          Order Status
        </strong>

        <div
          style={{
            marginTop: "8px",
          }}
        >
          <span
            style={{
              display: "inline-block",
              padding: "7px 12px",
              borderRadius: "20px",
              fontWeight: "700",
              fontSize: "13px",
              ...getStatusStyle(
                selectedOrder.orderStatus
              ),
            }}
          >
            {selectedOrder.orderStatus ||
              "UNKNOWN"}
          </span>
          {/* ADMIN STATUS ACTIONS */}

<div
  style={{
    marginTop: "15px",
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
  }}
>

  {selectedOrder.orderStatus ===
    "PLACED" && (
    <button
      onClick={() =>
        updateOrderStatus(
          selectedOrder._id,
          "CONFIRMED"
        )
      }
      disabled={
        updatingOrderId ===
        selectedOrder._id
      }
      style={{
        padding: "10px 15px",
        border: "none",
        borderRadius: "8px",
        background: "#0d6efd",
        color: "#fff",
        fontWeight: "700",
        cursor: "pointer",
      }}
    >
      Confirm Order
    </button>
  )}

  {selectedOrder.orderStatus ===
    "CONFIRMED" && (
    <button
      onClick={() =>
        updateOrderStatus(
          selectedOrder._id,
          "PREPARING"
        )
      }
      disabled={
        updatingOrderId ===
        selectedOrder._id
      }
      style={{
        padding: "10px 15px",
        border: "none",
        borderRadius: "8px",
        background: "#fd7e14",
        color: "#fff",
        fontWeight: "700",
        cursor: "pointer",
      }}
    >
      Start Preparing
    </button>
  )}

  {selectedOrder.orderStatus ===
    "PREPARING" && (
    <button
      onClick={() =>
        updateOrderStatus(
          selectedOrder._id,
          "READY"
        )
      }
      disabled={
        updatingOrderId ===
        selectedOrder._id
      }
      style={{
        padding: "10px 15px",
        border: "none",
        borderRadius: "8px",
        background: "#198754",
        color: "#fff",
        fontWeight: "700",
        cursor: "pointer",
      }}
    >
      Mark Ready
    </button>
  )}
  {["PLACED", "CONFIRMED"].includes(
  selectedOrder.orderStatus
) && (
  <button
    onClick={() =>
      cancelOrder(selectedOrder._id)
    }
    disabled={
      updatingOrderId ===
      selectedOrder._id
    }
    style={{
      padding: "10px 15px",
      border: "none",
      borderRadius: "8px",
      background: "#dc3545",
      color: "#fff",
      fontWeight: "700",
      cursor: "pointer",
    }}
  >
    {updatingOrderId ===
    selectedOrder._id
      ? "Cancelling..."
      : "Cancel Order"}
  </button>
)}

</div>
        </div>
      </div>

      {/* CUSTOMER */}

      <div
        style={{
          marginBottom: "18px",
          padding: "15px",
          border:
            "1px solid #e5e7eb",
          borderRadius: "10px",
        }}
      >
        <h3
          style={{
            marginTop: 0,
          }}
        >
          Customer
        </h3>

        <p>
          <strong>Name:</strong>{" "}
          {selectedOrder.user?.name ||
            "N/A"}
        </p>

        <p>
          <strong>Email:</strong>{" "}
          {selectedOrder.user?.email ||
            "N/A"}
        </p>

        <p
          style={{
            marginBottom: 0,
          }}
        >
          <strong>Phone:</strong>{" "}
          {selectedOrder.user?.phone ||
            "N/A"}
        </p>
      </div>

      {/* RESTAURANT */}

      <div
        style={{
          marginBottom: "18px",
          padding: "15px",
          border:
            "1px solid #e5e7eb",
          borderRadius: "10px",
        }}
      >
        <h3
          style={{
            marginTop: 0,
          }}
        >
          Restaurant
        </h3>

        <p
          style={{
            marginBottom: 0,
          }}
        >
          <strong>Name:</strong>{" "}
          {selectedOrder.restaurant
            ?.name || "N/A"}
        </p>
      </div>

      {/* ITEMS */}

      <div
        style={{
          marginBottom: "18px",
          padding: "15px",
          border:
            "1px solid #e5e7eb",
          borderRadius: "10px",
        }}
      >
        <h3
          style={{
            marginTop: 0,
          }}
        >
          Order Items
        </h3>

        {Array.isArray(
          selectedOrder.items
        ) &&
        selectedOrder.items.length > 0 ? (
          <div
            style={{
              display: "grid",
              gap: "8px",
            }}
          >
            {selectedOrder.items.map(
              (item, index) => (
                <div
                  key={
                    item._id ||
                    index
                  }
                  style={{
                    display: "flex",
                    justifyContent:
                      "space-between",
                    gap: "15px",
                    padding: "10px",
                    background:
                      "#f8f9fa",
                    borderRadius: "8px",
                  }}
                >
                  <div>
                    <strong>
                      {item.food?.name ||
                        "Food item"}
                    </strong>

                    <div
                      style={{
                        color: "#666",
                        fontSize: "13px",
                        marginTop: "3px",
                      }}
                    >
                      Quantity:{" "}
                      {item.quantity ||
                        1}
                    </div>
                  </div>

                  <strong>
                    ₹
                    {Number(
                      item.price || 0
                    ) *
                      Number(
                        item.quantity ||
                          1
                      )}
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
            No item details available.
          </p>
        )}
      </div>

      {/* DELIVERY ADDRESS */}

      <div
        style={{
          marginBottom: "18px",
          padding: "15px",
          border:
            "1px solid #e5e7eb",
          borderRadius: "10px",
        }}
      >
        <h3
          style={{
            marginTop: 0,
          }}
        >
          Delivery Address
        </h3>

        <p
          style={{
            marginBottom: 0,
            color: "#555",
          }}
        >
          {getDeliveryAddress(
            selectedOrder.deliveryAddress
          )}
        </p>
      </div>

      {/* PAYMENT */}

      <div
        style={{
          marginBottom: "18px",
          padding: "15px",
          background: "#f8f9fa",
          borderRadius: "10px",
        }}
      >
        <h3
          style={{
            marginTop: 0,
          }}
        >
          Payment
        </h3>

        <p>
          <strong>
            Method:
          </strong>{" "}
          {selectedOrder.paymentMethod ||
            "COD"}
        </p>

        <p
          style={{
            marginBottom: 0,
          }}
        >
          <strong>
            Status:
          </strong>{" "}
          {selectedOrder.paymentStatus ||
            "PENDING"}
        </p>
        {selectedOrder.paymentStatus ===
  "PENDING" && (
  <div
    style={{
      display: "flex",
      gap: "10px",
      flexWrap: "wrap",
      marginTop: "12px",
    }}
  >
    <button
      onClick={() =>
        updatePaymentStatus(
          selectedOrder._id,
          "PAID"
        )
      }
      disabled={
        updatingOrderId ===
        selectedOrder._id
      }
      style={{
        padding: "9px 14px",
        border: "none",
        borderRadius: "8px",
        background: "#198754",
        color: "#fff",
        fontWeight: "700",
        cursor: "pointer",
      }}
    >
      Mark Paid
    </button>

    <button
      onClick={() =>
        updatePaymentStatus(
          selectedOrder._id,
          "FAILED"
        )
      }
      disabled={
        updatingOrderId ===
        selectedOrder._id
      }
      style={{
        padding: "9px 14px",
        border: "none",
        borderRadius: "8px",
        background: "#dc3545",
        color: "#fff",
        fontWeight: "700",
        cursor: "pointer",
      }}
    >
      Mark Failed
    </button>
  </div>
)}
      </div>

        {/* DELIVERY PARTNER */}

<div
  style={{
    marginBottom: "18px",
    padding: "15px",
    border: "1px solid #e5e7eb",
    borderRadius: "10px",
  }}
>
  <h3 style={{ marginTop: 0 }}>
    Delivery Partner
  </h3>

  {selectedOrder.deliveryPartner ? (
    <>
      <p>
        <strong>Name:</strong>{" "}
        {selectedOrder.deliveryPartner?.name ||
          "N/A"}
      </p>

      <p>
        <strong>Phone:</strong>{" "}
        {selectedOrder.deliveryPartner?.phone ||
          "N/A"}
      </p>

      <p
        style={{
          marginBottom: 0,
          color: "#198754",
          fontWeight: "600",
        }}
      >
        ✓ Delivery partner assigned
      </p>
    </>
  ) : selectedOrder.orderStatus === "READY" ? (
    <>
      <p
        style={{
          color: "#666",
          marginTop: 0,
        }}
      >
        Select an available delivery partner
        for this order.
      </p>

      <select
        value={selectedPartnerId}
        onChange={(e) =>
          setSelectedPartnerId(e.target.value)
        }
        disabled={loadingPartners || assigningOrderId === selectedOrder._id}
        style={{
          width: "100%",
          padding: "11px",
          border: "1px solid #ced4da",
          borderRadius: "8px",
          marginBottom: "10px",
          boxSizing: "border-box",
          background: "#fff",
        }}
      >
        <option value="">
          {loadingPartners
            ? "Loading delivery partners..."
            : "Select delivery partner"}
        </option>

        {deliveryPartners.map((partner) => (
          <option
            key={partner._id}
            value={partner._id}
          >
            {partner.name || "Unnamed Partner"}
            {partner.phone
              ? ` - ${partner.phone}`
              : ""}
          </option>
        ))}
      </select>

      {deliveryPartners.length === 0 &&
        !loadingPartners && (
          <p
            style={{
              color: "#dc3545",
              fontSize: "13px",
            }}
          >
            No active and available delivery
            partner found.
          </p>
        )}

      <button
        onClick={() =>
          assignDeliveryPartner(
            selectedOrder._id,
            selectedPartnerId
          )
        }
        disabled={
          !selectedPartnerId ||
          assigningOrderId === selectedOrder._id ||
          loadingPartners
        }
        style={{
          width: "100%",
          padding: "11px",
          border: "none",
          borderRadius: "8px",
          background:
            !selectedPartnerId ||
            assigningOrderId === selectedOrder._id
              ? "#adb5bd"
              : "#198754",
          color: "#fff",
          fontWeight: "700",
          cursor:
            !selectedPartnerId ||
            assigningOrderId === selectedOrder._id
              ? "not-allowed"
              : "pointer",
        }}
      >
        {assigningOrderId === selectedOrder._id
          ? "Assigning..."
          : "Assign Delivery Partner"}
      </button>
    </>
  ) : (
    <p
      style={{
        marginBottom: 0,
        color: "#999",
      }}
    >
      Delivery partner can be assigned when
      the order reaches READY status.
    </p>
  )}
</div>

      
      {/* TOTAL */}

      <div
        style={{
          borderTop:
            "2px solid #eee",
          paddingTop: "15px",
          display: "flex",
          justifyContent:
            "space-between",
          alignItems: "center",
        }}
      >
        <strong>
          Order Total
        </strong>

        <strong
          style={{
            fontSize: "22px",
          }}
        >
          {getTotal(
            selectedOrder
          ) !== null
            ? `₹${getTotal(
                selectedOrder
              )}`
            : "N/A"}
        </strong>
      </div>
    </div>
  </div>
)}
    </div>
  );
}

export default Orders;