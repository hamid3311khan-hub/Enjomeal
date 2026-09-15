import { useEffect, useState } from "react";

const API_URL =
  "https://enjomeal-api.onrender.com/api/notifications";

function DeliveryNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");

  const getToken = () => {
    return localStorage.getItem(
      "enjoMealDeliveryToken"
    );
  };

  // ==========================================
  // FETCH NOTIFICATIONS
  // ==========================================

  const fetchNotifications = async (
    showLoader = true
  ) => {
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

      setError(
        error.message ||
          "Failed to load notifications"
      );
    } finally {
      if (showLoader) {
        setLoading(false);
      }
    }
  };

  // ==========================================
  // MARK SINGLE AS READ
  // ==========================================

  const markAsRead = async (
    notificationId
  ) => {
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

  // ==========================================
  // MARK ALL AS READ
  // ==========================================

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

  // ==========================================
  // DELETE NOTIFICATION
  // ==========================================

  const deleteNotification = async (
    notificationId
  ) => {
    try {
      setActionLoading(true);
      setError("");

      const token = getToken();

      const notification =
        notifications.find(
          (item) =>
            item._id === notificationId
        );

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

      setNotifications((previous) =>
        previous.filter(
          (item) =>
            item._id !== notificationId
        )
      );

      if (
        notification &&
        !notification.isRead
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

  // ==========================================
  // FORMAT DATE
  // ==========================================

  const formatDate = (date) => {
    if (!date) {
      return "Date unavailable";
    }

    return new Date(date).toLocaleString(
      "en-IN"
    );
  };

  // ==========================================
  // TYPE LABEL
  // ==========================================

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

  // ==========================================
  // LOAD + AUTO REFRESH
  // ==========================================

  useEffect(() => {
    fetchNotifications(true);

    const interval = setInterval(() => {
      fetchNotifications(false);
    }, 10000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          background: "#f5f7fb",
        }}
      >
        <h2>
          Loading notifications...
        </h2>
      </div>
    );
  }

  // ==========================================
  // PAGE
  // ==========================================

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
          maxWidth: "900px",
          margin: "0 auto",
        }}
      >
        {/* HEADER */}

        <div
          style={{
            background: "#fff",
            padding: "22px",
            borderRadius: "16px",
            boxShadow:
              "0 3px 12px rgba(0,0,0,0.08)",
            marginBottom: "20px",
          }}
        >
          <button
            onClick={() =>
              (window.location.href =
                "/delivery/dashboard")
            }
            style={{
              padding: "10px 18px",
              border: "none",
              borderRadius: "8px",
              background: "#eeeeee",
              fontWeight: "700",
              cursor: "pointer",
              marginBottom: "15px",
            }}
          >
            ← Dashboard
          </button>

          <h1
            style={{
              margin: "0 0 8px",
            }}
          >
            🔔 Notifications
          </h1>

          <p
            style={{
              margin: 0,
              color: "#666",
            }}
          >
            Unread notifications:{" "}
            <strong>
              {unreadCount}
            </strong>
          </p>

          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              disabled={actionLoading}
              style={{
                marginTop: "15px",
                padding: "10px 16px",
                border: "none",
                borderRadius: "8px",
                background: "#198754",
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

        {/* EMPTY */}

        {notifications.length === 0 ? (
          <div
            style={{
              background: "#fff",
              padding: "40px 20px",
              borderRadius: "16px",
              textAlign: "center",
              boxShadow:
                "0 3px 12px rgba(0,0,0,0.08)",
            }}
          >
            <div
              style={{
                fontSize: "50px",
                marginBottom: "10px",
              }}
            >
              🔕
            </div>

            <h2>
              No Notifications
            </h2>

            <p
              style={{
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
                        : "#eef5ff",
                    padding: "18px",
                    borderRadius: "14px",
                    boxShadow:
                      "0 3px 10px rgba(0,0,0,0.07)",
                    borderLeft:
                      notification.isRead
                        ? "4px solid #ddd"
                        : "4px solid #0d6efd",
                  }}
                >
                  {/* TOP */}

                  <div
                    style={{
                      display: "flex",
                      justifyContent:
                        "space-between",
                      alignItems: "flex-start",
                      gap: "10px",
                    }}
                  >
                    <div>
                      <h3
                        style={{
                          margin:
                            "0 0 6px",
                        }}
                      >
                        {notification.title ||
                          "Notification"}
                      </h3>

                      <span
                        style={{
                          display:
                            "inline-block",
                          background: "#e9ecef",
                          padding:
                            "4px 8px",
                          borderRadius: "6px",
                          fontSize: "12px",
                          fontWeight: "700",
                        }}
                      >
                        {getTypeLabel(
                          notification.type
                        )}
                      </span>
                    </div>

                    {!notification.isRead && (
                      <span
                        style={{
                          background: "#0d6efd",
                          color: "#fff",
                          padding: "5px 8px",
                          borderRadius: "6px",
                          fontSize: "12px",
                          fontWeight: "700",
                        }}
                      >
                        NEW
                      </span>
                    )}
                  </div>

                  {/* MESSAGE */}

                  <p
                    style={{
                      margin:
                        "14px 0 8px",
                      color: "#555",
                      lineHeight: 1.5,
                    }}
                  >
                    {notification.message ||
                      "No message available."}
                  </p>

                  {/* DATE */}

                  <p
                    style={{
                      margin: "0 0 15px",
                      color: "#888",
                      fontSize: "13px",
                    }}
                  >
                    🕒{" "}
                    {formatDate(
                      notification.createdAt
                    )}
                  </p>

                  {/* ACTIONS */}

                  <div
                    style={{
                      display: "flex",
                      gap: "10px",
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
                            "9px 14px",
                          border: "none",
                          borderRadius: "7px",
                          background:
                            "#198754",
                          color: "#fff",
                          fontWeight: "700",
                          cursor:
                            "pointer",
                        }}
                      >
                        ✓ Mark Read
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
                          "9px 14px",
                        border: "none",
                        borderRadius: "7px",
                        background:
                          "#dc3545",
                        color: "#fff",
                        fontWeight: "700",
                        cursor:
                          "pointer",
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
    </div>
  );
}

export default DeliveryNotifications;
