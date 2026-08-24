import { useEffect, useState } from "react";

function Orders() {
  const [orders, setOrders] = useState([]);
  const [deliveryPartners, setDeliveryPartners] = useState([]);

  const [loading, setLoading] = useState(true);
  const [loadingDelivery, setLoadingDelivery] = useState(false);

  const [updatingOrder, setUpdatingOrder] = useState("");
  const [assigningOrder, setAssigningOrder] = useState("");

  const [selectedDelivery, setSelectedDelivery] = useState({});
  const [error, setError] = useState("");

  // =====================================================
  // FETCH RESTAURANT ORDERS
  // =====================================================

  const fetchOrders = async () => {
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

      const response = await fetch(
        "https://enjomeal-api.onrender.com/api/orders/restaurant/my-orders",
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
            "Failed to fetch orders."
        );
      }

      setOrders(data.orders || []);
    } catch (error) {
      console.error(
        "Fetch Restaurant Orders Error:",
        error
      );

      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // FETCH AVAILABLE DELIVERY PARTNERS
  // =====================================================

  const fetchDeliveryPartners = async () => {
    try {
      setLoadingDelivery(true);

      const token = localStorage.getItem(
        "enjoMealRestaurantToken"
      );

      if (!token) {
        return;
      }

      const response = await fetch(
        "https://enjomeal-api.onrender.com/api/delivery/available",
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
            "Failed to fetch delivery partners."
        );
      }

      setDeliveryPartners(
        data.deliveries ||
          data.deliveryPartners ||
          []
      );
    } catch (error) {
      console.error(
        "Fetch Delivery Partners Error:",
        error
      );

      setError(error.message);
    } finally {
      setLoadingDelivery(false);
    }
  };

  // =====================================================
  // INITIAL LOAD
  // =====================================================

  useEffect(() => {
    fetchOrders();
    fetchDeliveryPartners();
  }, []);

  // =====================================================
  // UPDATE ORDER STATUS
  // =====================================================

  const updateOrderStatus = async (
    orderId,
    orderStatus
  ) => {
    try {
      setUpdatingOrder(orderId);
      setError("");

      const token = localStorage.getItem(
        "enjoMealRestaurantToken"
      );

      const response = await fetch(
        `https://enjomeal-api.onrender.com/api/orders/${orderId}/status`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            orderStatus,
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

      setOrders((currentOrders) =>
        currentOrders.map((order) =>
          order._id === orderId
            ? {
                ...order,
                orderStatus:
                  data.order?.orderStatus ||
                  orderStatus,
              }
            : order
        )
      );

      // READY hone ke baad available delivery
      // partners ko fresh load karo
      if (orderStatus === "READY") {
        await fetchDeliveryPartners();
      }
    } catch (error) {
      console.error(
        "Update Order Status Error:",
        error
      );

      setError(error.message);
    } finally {
      setUpdatingOrder("");
    }
  };

  // =====================================================
  // SELECT DELIVERY PARTNER
  // =====================================================

  const handleDeliveryChange = (
    orderId,
    deliveryPartnerId
  ) => {
    setSelectedDelivery((current) => ({
      ...current,
      [orderId]: deliveryPartnerId,
    }));
  };

  // =====================================================
  // ASSIGN DELIVERY PARTNER
  // =====================================================

  const assignDeliveryPartner = async (
    orderId
  ) => {
    try {
      const deliveryPartner =
        selectedDelivery[orderId];

      if (!deliveryPartner) {
        setError(
          "Please select a delivery partner."
        );
        return;
      }

      setAssigningOrder(orderId);
      setError("");

      const token = localStorage.getItem(
        "enjoMealRestaurantToken"
      );

      const response = await fetch(
        `https://enjomeal-api.onrender.com/api/orders/${orderId}/assign-delivery`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            deliveryPartner,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to assign delivery partner."
        );
      }

      setOrders((currentOrders) =>
        currentOrders.map((order) =>
          order._id === orderId
            ? {
                ...order,
                deliveryPartner:
                  data.order?.deliveryPartner ||
                  deliveryPartner,
              }
            : order
        )
      );

      // Assignment ke baad selected value clear
      setSelectedDelivery((current) => ({
        ...current,
        [orderId]: "",
      }));

      // Fresh available list
      await fetchDeliveryPartners();
    } catch (error) {
      console.error(
        "Assign Delivery Error:",
        error
      );

      setError(error.message);
    } finally {
      setAssigningOrder("");
    }
  };
  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          padding: "30px",
          background: "#fff8f3",
        }}
      >
        <h2>Loading orders...</h2>
      </div>
    );
  }

  // =====================================================
  // PAGE
  // =====================================================

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "30px",
        background: "#fff8f3",
      }}
    >
      {/* HEADER */}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "25px",
          gap: "15px",
          flexWrap: "wrap",
        }}
      >
        <div>
          <h1>Restaurant Orders</h1>

          <p>
            Total Orders:{" "}
            <strong>{orders.length}</strong>
          </p>
        </div>

        <div
          style={{
            display: "flex",
            gap: "10px",
            flexWrap: "wrap",
          }}
        >
          <button
            onClick={fetchDeliveryPartners}
            disabled={loadingDelivery}
            style={{
              padding: "10px 18px",
              border: "none",
              borderRadius: "8px",
              background: "#198754",
              color: "#fff",
              fontWeight: "700",
              cursor: "pointer",
            }}
          >
            {loadingDelivery
              ? "Loading..."
              : "Refresh Delivery"}
          </button>

          <button
            onClick={fetchOrders}
            style={{
              padding: "10px 18px",
              border: "none",
              borderRadius: "8px",
              background: "#e85d04",
              color: "#fff",
              fontWeight: "700",
              cursor: "pointer",
            }}
          >
            Refresh Orders
          </button>
        </div>
      </div>

      {/* ERROR */}

      {error && (
        <div
          style={{
            background: "#ffe5e5",
            color: "#dc3545",
            padding: "12px",
            borderRadius: "8px",
            marginBottom: "20px",
          }}
        >
          {error}
        </div>
      )}

      {/* NO ORDERS */}

      {orders.length === 0 ? (
        <div
          style={{
            background: "#fff",
            padding: "30px",
            borderRadius: "12px",
            textAlign: "center",
            boxShadow:
              "0 2px 8px rgba(0,0,0,0.08)",
          }}
        >
          <h2>No orders yet</h2>

          <p>
            New customer orders will appear here.
          </p>
        </div>
      ) : (
        <div>
          {orders.map((order) => (
            <div
              key={order._id}
              style={{
                background: "#fff",
                padding: "22px",
                borderRadius: "12px",
                marginBottom: "18px",
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
                  marginBottom: "15px",
                  gap: "15px",
                  flexWrap: "wrap",
                }}
              >
                <h3>
                  Order #
                  {order._id.slice(-6)}
                </h3>

                <strong
                  style={{
                    padding: "6px 12px",
                    borderRadius: "20px",
                    background:
                      order.orderStatus ===
                      "CANCELLED"
                        ? "#ffe5e5"
                        : order.orderStatus ===
                          "DELIVERED"
                        ? "#d1e7dd"
                        : "#fff3cd",
                    color:
                      order.orderStatus ===
                      "CANCELLED"
                        ? "#dc3545"
                        : order.orderStatus ===
                          "DELIVERED"
                        ? "#198754"
                        : "#856404",
                  }}
                >
                  {order.orderStatus}
                </strong>
              </div>

              {/* CUSTOMER */}

              <p>
                <strong>Customer:</strong>{" "}
                {order.user?.name ||
                  "Customer"}
              </p>

              <p>
                <strong>Phone:</strong>{" "}
                {order.user?.phone ||
                  "N/A"}
              </p>

              {/* DELIVERY ADDRESS */}

              <div
                style={{
                  background: "#f8f9fa",
                  padding: "12px",
                  borderRadius: "8px",
                  marginTop: "12px",
                }}
              >
                <strong>
                  Delivery Address
                </strong>

                <p
                  style={{
                    marginBottom: "0",
                  }}
                >
                  {order.deliveryAddress
                    ?.address ||
                    "N/A"}
                  <br />

                  {order.deliveryAddress
                    ?.city ||
                    ""}

                  {order.deliveryAddress
                    ?.pincode
                    ? ` - ${order.deliveryAddress.pincode}`
                    : ""}
                </p>
              </div>

              {/* PAYMENT */}

              <p
                style={{
                  marginTop: "15px",
                }}
              >
                <strong>Payment:</strong>{" "}
                {order.paymentMethod ||
                  "COD"}
              </p>

              <p>
                <strong>
                  Payment Status:
                </strong>{" "}
                {order.paymentStatus ||
                  "PENDING"}
              </p>

              {/* ITEMS */}

              <div
                style={{
                  marginTop: "15px",
                  marginBottom: "15px",
                }}
              >
                <h4>Items</h4>

                {order.items?.map(
                  (item, index) => (
                    <div
                      key={
                        item.food?._id ||
                        index
                      }
                      style={{
                        padding: "8px 0",
                        borderBottom:
                          "1px solid #eee",
                      }}
                    >
                      <span>
                        {item.food?.name ||
                          "Food item"}
                      </span>

                      {" × "}

                      <strong>
                        {item.quantity}
                      </strong>

                      <span
                        style={{
                          float: "right",
                        }}
                      >
                        ₹
                        {Number(
                          item.price
                        ) *
                          Number(
                            item.quantity
                          )}
                      </span>
                    </div>
                  )
                )}
              </div>

              {/* TOTAL */}

              <h3>
                Total: ₹
                {order.totalAmount}
              </h3>
              {/* =================================================
                  DELIVERY PARTNER
              ================================================= */}

              {order.deliveryPartner ? (
                <div
                  style={{
                    marginTop: "18px",
                    padding: "15px",
                    background: "#e8f5e9",
                    borderRadius: "8px",
                    border:
                      "1px solid #b7dfb9",
                  }}
                >
                  <h4
                    style={{
                      marginTop: "0",
                    }}
                  >
                    Delivery Partner Assigned
                  </h4>

                  <p>
                    <strong>Name:</strong>{" "}
                    {order.deliveryPartner?.name ||
                      "Delivery Partner"}
                  </p>

                  <p>
                    <strong>Phone:</strong>{" "}
                    {order.deliveryPartner?.phone ||
                      "N/A"}
                  </p>

                  <p
                    style={{
                      marginBottom: "0",
                    }}
                  >
                    <strong>Vehicle:</strong>{" "}
                    {order.deliveryPartner?.vehicleType ||
                      "N/A"}

                    {order.deliveryPartner
                      ?.vehicleNumber
                      ? ` - ${order.deliveryPartner.vehicleNumber}`
                      : ""}
                  </p>
                </div>
              ) : (
                order.orderStatus === "READY" && (
                  <div
                    style={{
                      marginTop: "20px",
                      padding: "18px",
                      background: "#f1f8ff",
                      border:
                        "1px solid #b6d7fe",
                      borderRadius: "10px",
                    }}
                  >
                    <h4
                      style={{
                        marginTop: "0",
                      }}
                    >
                      Assign Delivery Partner
                    </h4>

                    {deliveryPartners.length ===
                    0 ? (
                      <p
                        style={{
                          color: "#dc3545",
                          fontWeight: "600",
                        }}
                      >
                        No available delivery
                        partner found.
                      </p>
                    ) : (
                      <>
                        <select
                          value={
                            selectedDelivery[
                              order._id
                            ] || ""
                          }
                          onChange={(event) =>
                            handleDeliveryChange(
                              order._id,
                              event.target.value
                            )
                          }
                          style={{
                            width: "100%",
                            padding: "12px",
                            border:
                              "1px solid #ddd",
                            borderRadius:
                              "8px",
                            marginBottom:
                              "12px",
                            boxSizing:
                              "border-box",
                          }}
                        >
                          <option value="">
                            Select delivery
                            partner
                          </option>

                          {deliveryPartners.map(
                            (delivery) => (
                              <option
                                key={
                                  delivery._id
                                }
                                value={
                                  delivery._id
                                }
                              >
                                {delivery.name ||
                                  "Delivery Partner"}{" "}
                                -{" "}
                                {delivery.phone ||
                                  "N/A"}
                              </option>
                            )
                          )}
                        </select>

                        <button
                          onClick={() =>
                            assignDeliveryPartner(
                              order._id
                            )
                          }
                          disabled={
                            assigningOrder ===
                            order._id
                          }
                          style={{
                            width: "100%",
                            padding: "12px",
                            border: "none",
                            borderRadius:
                              "8px",
                            background:
                              assigningOrder ===
                              order._id
                                ? "#aaa"
                                : "#198754",
                            color: "#fff",
                            fontWeight:
                              "700",
                            cursor:
                              assigningOrder ===
                              order._id
                                ? "not-allowed"
                                : "pointer",
                          }}
                        >
                          {assigningOrder ===
                          order._id
                            ? "Assigning..."
                            : "Assign Delivery Partner"}
                        </button>
                      </>
                    )}
                  </div>
                )
              )}

              {/* =================================================
                  STATUS ACTIONS
              ================================================= */}

              {order.orderStatus === "PLACED" && (
                <button
                  onClick={() =>
                    updateOrderStatus(
                      order._id,
                      "CONFIRMED"
                    )
                  }
                  disabled={
                    updatingOrder === order._id
                  }
                  style={{
                    marginTop: "20px",
                    padding: "10px 18px",
                    border: "none",
                    borderRadius: "8px",
                    background: "#198754",
                    color: "#fff",
                    fontWeight: "700",
                    cursor: "pointer",
                  }}
                >
                  {updatingOrder === order._id
                    ? "Updating..."
                    : "Confirm Order"}
                </button>
              )}

              {order.orderStatus ===
                "CONFIRMED" && (
                <button
                  onClick={() =>
                    updateOrderStatus(
                      order._id,
                      "PREPARING"
                    )
                  }
                  disabled={
                    updatingOrder === order._id
                  }
                  style={{
                    marginTop: "20px",
                    padding: "10px 18px",
                    border: "none",
                    borderRadius: "8px",
                    background: "#fd7e14",
                    color: "#fff",
                    fontWeight: "700",
                    cursor: "pointer",
                  }}
                >
                  {updatingOrder === order._id
                    ? "Updating..."
                    : "Start Preparing"}
                </button>
              )}

              {order.orderStatus ===
                "PREPARING" && (
                <button
                  onClick={() =>
                    updateOrderStatus(
                      order._id,
                      "READY"
                    )
                  }
                  disabled={
                    updatingOrder === order._id
                  }
                  style={{
                    marginTop: "20px",
                    padding: "10px 18px",
                    border: "none",
                    borderRadius: "8px",
                    background: "#0d6efd",
                    color: "#fff",
                    fontWeight: "700",
                    cursor: "pointer",
                  }}
                >
                  {updatingOrder === order._id
                    ? "Updating..."
                    : "Mark Ready"}
                </button>
              )}

              {/* READY */}

              {order.orderStatus === "READY" &&
                !order.deliveryPartner && (
                  <p
                    style={{
                      marginTop: "12px",
                      color: "#856404",
                      fontWeight: "600",
                    }}
                  >
                    Please assign a delivery
                    partner for this order.
                  </p>
                )}

              {/* OUT FOR DELIVERY */}

              {order.orderStatus ===
                "OUT_FOR_DELIVERY" && (
                <p
                  style={{
                    marginTop: "20px",
                    color: "#0d6efd",
                    fontWeight: "700",
                  }}
                >
                  Order is out for delivery.
                </p>
              )}

              {/* DELIVERED */}

              {order.orderStatus ===
                "DELIVERED" && (
                <p
                  style={{
                    marginTop: "20px",
                    color: "#198754",
                    fontWeight: "700",
                  }}
                >
                  Order delivered successfully.
                </p>
              )}

              {/* CANCELLED */}

              {order.orderStatus ===
                "CANCELLED" && (
                <p
                  style={{
                    marginTop: "20px",
                    color: "#dc3545",
                    fontWeight: "700",
                  }}
                >
                  Order cancelled.
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Orders;