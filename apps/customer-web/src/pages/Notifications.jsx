import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = "http://localhost:5000/api/notifications";

function Notifications() {
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const token = localStorage.getItem("enjoMealToken");

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_URL}/my`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to fetch notifications"
        );
      }

      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (error) {
      console.error("Notification Error:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchNotifications();
    } else {
      setError("Authentication token not found. Please login again.");
      setLoading(false);
    }
  }, []);

  const markAsRead = async (notificationId) => {
    try {
      const response = await fetch(
        `${API_URL}/${notificationId}/read`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to mark notification as read"
        );
      }

      await fetchNotifications();
    } catch (error) {
      console.error("Mark Read Error:", error);
      setError(error.message);
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch(`${API_URL}/read-all`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to mark all notifications as read"
        );
      }

      await fetchNotifications();
    } catch (error) {
      console.error("Mark All Read Error:", error);
      setError(error.message);
    }
  };

  const handleNotificationClick = async (notification) => {
    try {
      // Notification ko read mark karo
      if (!notification.isRead) {
        await markAsRead(notification._id);
      }

      // Order notification hai aur order available hai
      if (notification.order) {
        const orderId =
          typeof notification.order === "object"
            ? notification.order._id
            : notification.order;

        if (orderId) {
          navigate(`/orders/${orderId}`);
        }
      }
    } catch (error) {
      console.error("Notification Click Error:", error);
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      const response = await fetch(
        `${API_URL}/${notificationId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to delete notification"
        );
      }

      await fetchNotifications();
    } catch (error) {
      console.error("Delete Notification Error:", error);
      setError(error.message);
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <h1>Notifications</h1>
        <p>Loading notifications...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Notifications</h1>
          <p style={styles.subtitle}>
            Stay updated with your EnjoMeal orders
          </p>
        </div>

        <button
          onClick={fetchNotifications}
          style={styles.refreshButton}
        >
          ↻ Refresh
        </button>
      </div>

      {error && (
        <div style={styles.error}>
          {error}
        </div>
      )}

      <div style={styles.stats}>
        <div style={styles.statCard}>
          <h3>Total Notifications</h3>
          <strong>{notifications.length}</strong>
        </div>

        <div style={styles.statCard}>
          <h3>Unread</h3>
          <strong>{unreadCount}</strong>
        </div>
      </div>

      {unreadCount > 0 && (
        <button
          onClick={markAllAsRead}
          style={styles.markAllButton}
        >
          ✓ Mark All as Read
        </button>
      )}

      {notifications.length === 0 ? (
        <div style={styles.empty}>
          <div style={styles.icon}>🔔</div>
          <h2>No Notifications</h2>
          <p>You don't have any notifications yet.</p>
        </div>
      ) : (
        <div style={styles.list}>
          {notifications.map((notification) => (
            <div
              key={notification._id}
              style={{
                ...styles.card,
                backgroundColor: notification.isRead
                  ? "#ffffff"
                  : "#eef6ff",
              }}
            >
              <div style={styles.cardTop}>
                <div>
                  <h3 style={styles.notificationTitle}>
                    🔔 {notification.title}
                    {!notification.isRead && (
                      <span style={styles.newBadge}>
                        NEW
                      </span>
                    )}
                  </h3>

                  <p style={styles.message}>
                    {notification.message}
                  </p>
                </div>

                <span style={styles.type}>
                  {notification.type}
                </span>
              </div>

              <p style={styles.date}>
                {notification.createdAt
                  ? new Date(
                      notification.createdAt
                    ).toLocaleString()
                  : ""}
              </p>
              <div style={styles.actions}>
  {!notification.isRead && (
    <button
      onClick={() =>
        markAsRead(notification._id)
      }
      style={styles.readButton}
    >
      ✓ Mark as Read
    </button>
  )}

  {notification.order && (
    <button
      onClick={() =>
        handleNotificationClick(notification)
      }
      style={styles.orderButton}
    >
      View Order →
    </button>
  )}

  <button
    onClick={() =>
      deleteNotification(notification._id)
    }
    style={styles.deleteButton}
  >
    Delete
    </button>
    
</div>
            

            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    padding: "24px",
    maxWidth: "1100px",
    margin: "0 auto",
    fontFamily: "Arial, sans-serif",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "20px",
    marginBottom: "24px",
  },

  title: {
    margin: 0,
    fontSize: "32px",
  },

  subtitle: {
    marginTop: "6px",
    color: "#666",
  },

  refreshButton: {
    border: "none",
    borderRadius: "8px",
    padding: "10px 16px",
    cursor: "pointer",
  },

  stats: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "16px",
    marginBottom: "20px",
  },

  statCard: {
    padding: "20px",
    border: "1px solid #ddd",
    borderRadius: "12px",
    textAlign: "center",
  },

  markAllButton: {
    border: "none",
    borderRadius: "8px",
    padding: "10px 16px",
    cursor: "pointer",
    marginBottom: "20px",
  },

  error: {
    padding: "12px",
    marginBottom: "20px",
    borderRadius: "8px",
    background: "#ffe5e5",
    color: "#b00020",
  },

  empty: {
    textAlign: "center",
    padding: "60px 20px",
    border: "1px solid #ddd",
    borderRadius: "12px",
  },

  icon: {
    fontSize: "42px",
  },

  list: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },

  card: {
    border: "1px solid #ddd",
    borderRadius: "12px",
    padding: "20px",
  },

  cardTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: "20px",
  },

  notificationTitle: {
    margin: 0,
  },

  newBadge: {
    marginLeft: "10px",
    fontSize: "11px",
    padding: "4px 7px",
    borderRadius: "10px",
    background: "#1976d2",
    color: "#fff",
  },

  message: {
    color: "#555",
    marginTop: "8px",
  },

  type: {
    fontSize: "12px",
    color: "#666",
  },

  date: {
    fontSize: "12px",
    color: "#888",
  },

  actions: {
    display: "flex",
    gap: "10px",
    marginTop: "12px",
  },

  readButton: {
    border: "none",
    borderRadius: "6px",
    padding: "8px 12px",
    cursor: "pointer",
  },

  deleteButton: {
    border: "none",
    borderRadius: "6px",
    padding: "8px 12px",
    cursor: "pointer",
  },
  orderButton: {
    border: "none",
    borderRadius: "6px",
    padding: "8px 12px",
    cursor: "pointer",
    background: "#1976d2",
    color: "#fff",
  },
};

export default Notifications;