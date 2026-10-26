import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [groceryAlert, setGroceryAlert] = useState("");
  const [soundEnabled, setSoundEnabled] = useState(false);
  const soundEnabledRef = useRef(false);
  const audioContextRef = useRef(null);

  const playGroceryAlert = () => {
    if (!soundEnabledRef.current) return;

    try {
      const AudioContextClass =
        window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;

      const context =
        audioContextRef.current || new AudioContextClass();
      audioContextRef.current = context;

      if (context.state === "suspended") {
        context.resume().catch(() => {});
      }

      [0, 0.22, 0.44].forEach((delay) => {
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.type = "sine";
        oscillator.frequency.value = 880;
        gain.gain.setValueAtTime(0.001, context.currentTime + delay);
        gain.gain.exponentialRampToValueAtTime(
          0.18,
          context.currentTime + delay + 0.025
        );
        gain.gain.exponentialRampToValueAtTime(
          0.001,
          context.currentTime + delay + 0.13
        );
        oscillator.connect(gain);
        gain.connect(context.destination);
        oscillator.start(context.currentTime + delay);
        oscillator.stop(context.currentTime + delay + 0.14);
      });
    } catch (soundError) {
      console.error("Grocery alert sound error:", soundError);
    }
  };

  const enableGrocerySound = async () => {
    try {
      const AudioContextClass =
        window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) {
        setError("Is browser mein alert sound supported nahi hai.");
        return;
      }

      const context =
        audioContextRef.current || new AudioContextClass();
      audioContextRef.current = context;
      await context.resume();
      soundEnabledRef.current = true;
      setSoundEnabled(true);
      setGroceryAlert("Grocery order alert sound enabled.");
    } catch (soundError) {
      setError("Sound enable nahi hua. Button dobara tap karein.");
    }
  };

  // =====================================================
  // API BASE URL
  // =====================================================

  const API_URL =
    "https://enjomeal-api.onrender.com/api/notifications";

  // =====================================================
  // GET TOKEN
  // =====================================================

  const getToken = () => {
    return (
      localStorage.getItem("enjoMealToken") ||
      localStorage.getItem("enjoMealAdminToken") ||
      localStorage.getItem("token")
    );
  };

  // =====================================================
  // FETCH NOTIFICATIONS
  // =====================================================

  const fetchNotifications = async (showLoader = true) => {
    try {
      if (showLoader) {
        setLoading(true);
      }

      setError("");

      const token = getToken();

      if (!token) {
        setError(
          "Authentication token not found. Please login again."
        );

        if (showLoader) {
          setLoading(false);
        }

        return;
      }

      const response = await fetch(
        `${API_URL}/my`,
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
            "Failed to fetch notifications"
        );
      }

      setNotifications(
        Array.isArray(data.notifications)
          ? data.notifications
          : []
      );

      setUnreadCount(
        Number(data.unreadCount || 0)
      );
    } catch (error) {
      console.error(
        "Fetch Notifications Error:",
        error
      );

      setError(error.message);
    } finally {
      if (showLoader) {
        setLoading(false);
      }
    }
  };

  // =====================================================
  // MARK SINGLE AS READ
  // =====================================================

  const markAsRead = async (notificationId) => {
    try {
      setActionLoading(true);
      setError("");

      const token = getToken();

      const response = await fetch(
        `${API_URL}/${notificationId}/read`,
        {
          method: "PUT",
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
            "Failed to mark notification as read"
        );
      }

      setNotifications((previous) =>
        previous.map((notification) =>
          notification._id === notificationId
            ? {
                ...notification,
                isRead: true,
              }
            : notification
        )
      );

      setUnreadCount((previous) =>
        previous > 0 ? previous - 1 : 0
      );
    } catch (error) {
      console.error(
        "Mark Notification Read Error:",
        error
      );

      setError(error.message);
    } finally {
      setActionLoading(false);
    }
  };

  // =====================================================
  // MARK ALL AS READ
  // =====================================================

  const markAllAsRead = async () => {
    try {
      setActionLoading(true);
      setError("");

      const token = getToken();

      const response = await fetch(
        `${API_URL}/read-all`,
        {
          method: "PUT",
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
            "Failed to mark all notifications as read"
        );
      }

      setNotifications((previous) =>
        previous.map((notification) => ({
          ...notification,
          isRead: true,
        }))
      );

      setUnreadCount(0);
    } catch (error) {
      console.error(
        "Mark All Notifications Error:",
        error
      );

      setError(error.message);
    } finally {
      setActionLoading(false);
    }
  };

  // =====================================================
  // DELETE NOTIFICATION
  // =====================================================

  const deleteNotification = async (
    notificationId
  ) => {
    try {
      setActionLoading(true);
      setError("");

      const token = getToken();

      const response = await fetch(
        `${API_URL}/${notificationId}`,
        {
          method: "DELETE",
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
            "Failed to delete notification"
        );
      }

      const deletedNotification =
        notifications.find(
          (notification) =>
            notification._id === notificationId
        );

      setNotifications((previous) =>
        previous.filter(
          (notification) =>
            notification._id !== notificationId
        )
      );

      if (
        deletedNotification &&
        !deletedNotification.isRead
      ) {
        setUnreadCount((previous) =>
          previous > 0 ? previous - 1 : 0
        );
      }
    } catch (error) {
      console.error(
        "Delete Notification Error:",
        error
      );

      setError(error.message);
    } finally {
      setActionLoading(false);
    }
  };

  // =====================================================
  // FORMAT DATE
  // =====================================================

  const formatDate = (date) => {
    if (!date) {
      return "Date unavailable";
    }

    return new Date(date).toLocaleString();
  };

  // =====================================================
  // STATUS LABEL
  // =====================================================

  const getTypeLabel = (type) => {
    if (!type) {
      return "GENERAL";
    }

    return type
      .replaceAll("_", " ")
      .toLowerCase()
      .replace(/\b\w/g, (letter) =>
        letter.toUpperCase()
      );
  };

  // =====================================================
  // LOAD + AUTO REFRESH
  // =====================================================

  useEffect(() => {
    // Initial notification load
    fetchNotifications(true);

    const token =
      localStorage.getItem("enjoMealAdminToken") ||
      localStorage.getItem("token") ||
      localStorage.getItem("enjoMealToken");

    let socket;

    if (token) {
      socket = io("https://enjomeal-api.onrender.com", {
        auth: { token },
        transports: ["websocket", "polling"],
      });

      socket.on("grocery:order:new", (payload) => {
        setGroceryAlert(
          "New grocery order received! Order ID: " +
            (payload?.orderNumber || payload?.orderId || "New order")
        );
        playGroceryAlert();
        fetchNotifications(false);
      });

      socket.on("notification:new", (payload) => {
        if (payload?.notification?.type === "GROCERY_ORDER_PLACED") {
          fetchNotifications(false);
        }
      });

      socket.on("connect_error", (err) => {
        console.error("Admin notification socket error:", err.message);
      });
    }

    // Automatically check for new notifications
    const notificationInterval = setInterval(() => {
      fetchNotifications(false);
    }, 10000);

    // Cleanup when page is closed/unmounted
    return () => {
      clearInterval(notificationInterval);
      if (socket) socket.disconnect();
    };
  }, []);

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
        <h2>Loading notifications...</h2>
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
        background: "#fff8f3",
        padding: "25px",
      }}
    >
      {/* =================================================
          HEADER
      ================================================= */}

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
            Notifications
          </h1>

          <p
            style={{
              margin: 0,
              color: "#666",
            }}
          >
            Manage your EnjoMeal notifications
          </p>
        </div>

        <button
          onClick={() => fetchNotifications(true)}
          disabled={loading}
          style={{
            padding: "10px 16px",
            border: "none",
            borderRadius: "8px",
            background: "#0d6efd",
            color: "#fff",
            fontWeight: "700",
            cursor: "pointer",
          }}
        >
          🔄 Refresh
        </button>
      </div>

      {groceryAlert && (
        <div
          role="status"
          style={{
            background: "#fff3cd",
            color: "#664d03",
            padding: "15px",
            borderRadius: "10px",
            marginBottom: "20px",
            border: "1px solid #ffecb5",
            fontWeight: "700",
          }}
        >
          🛒 {groceryAlert}
        </div>
      )}

      <div style={{ marginBottom: "20px" }}>
        <button
          type="button"
          onClick={enableGrocerySound}
          style={{
            padding: "10px 14px",
            border: "none",
            borderRadius: "8px",
            background: soundEnabled ? "#198754" : "#6c757d",
            color: "#fff",
            fontWeight: "700",
            cursor: "pointer",
          }}
        >
          {soundEnabled ? "🔔 Grocery Sound Enabled" : "🔔 Enable Grocery Alert Sound"}
        </button>
      </div>

      {/* =================================================
          ERROR
      ================================================= */}

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
            onClick={() => fetchNotifications(true)}
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

      {/* =================================================
          STATISTICS
      ================================================= */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "15px",
          marginBottom: "20px",
        }}
      >
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
            Total Notifications
          </p>

          <h2 style={{ margin: 0 }}>
            {notifications.length}
          </h2>
        </div>

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
            Unread
          </p>

          <h2 style={{ margin: 0 }}>
            {unreadCount}
          </h2>
        </div>
      </div>

      {/* =================================================
          ACTION BAR
      ================================================= */}

      {notifications.length > 0 && (
        <div
          style={{
            background: "#fff",
            padding: "15px",
            borderRadius: "10px",
            marginBottom: "20px",
            boxShadow:
              "0 2px 8px rgba(0,0,0,0.08)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "10px",
            flexWrap: "wrap",
          }}
        >
          <strong>
            {unreadCount > 0
              ? `${unreadCount} unread notification${
                  unreadCount > 1 ? "s" : ""
                }`
              : "All notifications are read"}
          </strong>

          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              disabled={actionLoading}
              style={{
                padding: "9px 14px",
                border: "none",
                borderRadius: "7px",
                background: actionLoading
                  ? "#aaa"
                  : "#198754",
                color: "#fff",
                fontWeight: "700",
                cursor: actionLoading
                  ? "not-allowed"
                  : "pointer",
              }}
            >
              ✓ Mark All as Read
            </button>
          )}
        </div>
      )}

      {/* =================================================
          NOTIFICATION LIST
      ================================================= */}

      {notifications.length === 0 ? (
        <div
          style={{
            background: "#fff",
            padding: "40px 20px",
            borderRadius: "12px",
            textAlign: "center",
            boxShadow:
              "0 2px 8px rgba(0,0,0,0.08)",
          }}
        >
          <div
            style={{
              fontSize: "45px",
              marginBottom: "10px",
            }}
          >
            🔔
          </div>

          <h2
            style={{
              marginBottom: "8px",
            }}
          >
            No Notifications
          </h2>

          <p
            style={{
              margin: 0,
              color: "#666",
            }}
          >
            You don't have any notifications yet.
          </p>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gap: "14px",
          }}
        >
                    {notifications.map(
            (notification) => (
              <div
                key={notification._id}
                style={{
                  background:
                    notification.isRead
                      ? "#fff"
                      : "#eef6ff",
                  border:
                    notification.isRead
                      ? "1px solid #e5e5e5"
                      : "1px solid #b6d4fe",
                  borderRadius: "12px",
                  padding: "18px",
                  boxShadow:
                    "0 2px 8px rgba(0,0,0,0.06)",
                }}
              >
                {/* NOTIFICATION HEADER */}

                <div
                  style={{
                    display: "flex",
                    justifyContent:
                      "space-between",
                    alignItems: "flex-start",
                    gap: "12px",
                    flexWrap: "wrap",
                  }}
                >
                  <div
                    style={{
                      flex: 1,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        flexWrap: "wrap",
                      }}
                    >
                      <h3
                        style={{
                          margin: 0,
                        }}
                      >
                        🔔{" "}
                        {notification.title}
                      </h3>

                      {!notification.isRead && (
                        <span
                          style={{
                            padding: "4px 8px",
                            borderRadius: "15px",
                            background:
                              "#0d6efd",
                            color: "#fff",
                            fontSize: "11px",
                            fontWeight: "700",
                          }}
                        >
                          NEW
                        </span>
                      )}
                    </div>

                    <p
                      style={{
                        margin:
                          "7px 0 0 0",
                        color: "#555",
                        lineHeight: "1.5",
                      }}
                    >
                      {notification.message}
                    </p>
                  </div>

                  <span
                    style={{
                      padding: "5px 9px",
                      borderRadius: "15px",
                      background: "#f8f9fa",
                      color: "#555",
                      fontSize: "11px",
                      fontWeight: "700",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {getTypeLabel(
                      notification.type
                    )}
                  </span>
                </div>

                {/* ORDER */}

                {notification.order && (
                  <p
                    style={{
                      margin:
                        "12px 0 0 0",
                      color: "#555",
                      fontSize: "13px",
                    }}
                  >
                    <strong>Order:</strong>{" "}
                    {notification.order._id ||
                      "N/A"}
                  </p>
                )}

                {/* DATE */}

                <p
                  style={{
                    margin:
                      "8px 0 0 0",
                    color: "#888",
                    fontSize: "12px",
                  }}
                >
                  {formatDate(
                    notification.createdAt
                  )}
                </p>

                {/* ACTIONS */}

                <div
                  style={{
                    marginTop: "14px",
                    display: "flex",
                    gap: "8px",
                    flexWrap: "wrap",
                  }}
                >
                  {!notification.isRead && (
                    <button
                      onClick={() =>
                        markAsRead(
                          notification._id
                        )
                      }
                      disabled={actionLoading}
                      style={{
                        padding:
                          "8px 12px",
                        border: "none",
                        borderRadius: "7px",
                        background:
                          actionLoading
                            ? "#aaa"
                            : "#198754",
                        color: "#fff",
                        fontWeight: "700",
                        cursor:
                          actionLoading
                            ? "not-allowed"
                            : "pointer",
                      }}
                    >
                      ✓ Mark as Read
                    </button>
                  )}

                  <button
                    onClick={() =>
                      deleteNotification(
                        notification._id
                      )
                    }
                    disabled={actionLoading}
                    style={{
                      padding:
                        "8px 12px",
                      border: "none",
                      borderRadius: "7px",
                      background:
                        actionLoading
                          ? "#aaa"
                          : "#dc3545",
                      color: "#fff",
                      fontWeight: "700",
                      cursor:
                        actionLoading
                          ? "not-allowed"
                          : "pointer",
                    }}
                  >
                    🗑 Delete
                  </button>
                </div>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}

export default Notifications;
