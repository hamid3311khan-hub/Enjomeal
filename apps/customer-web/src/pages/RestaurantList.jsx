import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/api";

function RestaurantList() {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);

  const navigate = useNavigate();

  const user = JSON.parse(
    localStorage.getItem("enjoMealUser") || "null"
  );

  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        const response = await API.get("/restaurants");

        if (response.data.success) {
          setRestaurants(response.data.restaurants || []);
        } else {
          setError("Restaurants load nahi ho rahe.");
        }
      } catch (err) {
        console.error("Restaurant API Error:", err);

        setError(
          err.response?.data?.message ||
            "Failed to load restaurants."
        );
      } finally {
        setLoading(false);
      }
    };

    const fetchUnreadNotifications = async () => {
      try {
        const response = await API.get("/notifications/my");

        if (response.data.success) {
          setUnreadCount(response.data.unreadCount || 0);
        }
      } catch (err) {
        console.error(
          "Notification API Error:",
          err.response?.data?.message || err.message
        );
      }
    };

    fetchRestaurants();
    fetchUnreadNotifications();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("enjoMealToken");
    localStorage.removeItem("enjoMealUser");

    navigate("/login", {
      replace: true,
    });
  };

  if (loading) {
    return <h2 style={{ padding: "30px" }}>Loading restaurants...</h2>;
  }

  if (error) {
    return (
      <p style={{ padding: "30px", color: "red" }}>
        {error}
      </p>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#fff8f3",
      }}
    >
      {/* ================= HEADER ================= */}

      <header
        style={{
          background: "#fff",
          padding: "15px 25px",
          borderBottom: "1px solid #eee",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "15px",
          flexWrap: "wrap",
        }}
      >
        {/* Logo */}

        <h2
          style={{
            margin: 0,
            color: "#e85d04",
            cursor: "pointer",
          }}
          onClick={() => navigate("/restaurants")}
        >
          ENJOMEAL
        </h2>

        {/* Navigation */}

        <div
          style={{
            display: "flex",
            gap: "8px",
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <button
            onClick={() => navigate("/restaurants")}
            style={navButtonStyle}
          >
            🏠 Restaurants
          </button>

          <button
            onClick={() => navigate("/my-orders")}
            style={navButtonStyle}
          >
            📦 My Orders
          </button>

          <button
            onClick={() => navigate("/notifications")}
            style={{
              ...navButtonStyle,
              position: "relative",
            }}
          >
            🔔 Notifications

            {unreadCount > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: "-7px",
                  right: "-5px",
                  minWidth: "20px",
                  height: "20px",
                  padding: "0 4px",
                  borderRadius: "50%",
                  background: "red",
                  color: "#fff",
                  fontSize: "11px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: "bold",
                }}
              >
                {unreadCount}
              </span>
            )}
          </button>

          <button
            onClick={() => navigate("/cart")}
            style={navButtonStyle}
          >
            🛒 Cart
          </button>

          <button
            onClick={() => navigate("/profile")}
            style={navButtonStyle}
          >
            👤 Profile
          </button>

          <button
            onClick={handleLogout}
            style={{
              ...navButtonStyle,
              background: "#dc3545",
              color: "#fff",
              borderColor: "#dc3545",
            }}
          >
            🚪 Logout
          </button>
        </div>
      </header>

      {/* ================= CUSTOMER INFO ================= */}

      <div
        style={{
          padding: "25px 30px 10px",
        }}
      >
        <p
          style={{
            margin: 0,
            color: "#777",
          }}
        >
          Welcome back,
        </p>

        <h1
          style={{
            marginTop: "5px",
            marginBottom: "5px",
          }}
        >
          {user?.name || "Customer"} 👋
        </h1>

        <p style={{ color: "#777" }}>
          Choose a restaurant and enjoy your meal.
        </p>
      </div>

      {/* ================= RESTAURANTS ================= */}

      <main style={{ padding: "10px 30px 30px" }}>
        <h2>Popular Restaurants</h2>

        {restaurants.length === 0 ? (
          <p>No restaurants available.</p>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "15px",
            }}
          >
            {restaurants.map((restaurant) => (
              <div
                key={restaurant._id}
                onClick={() =>
                  navigate(
                    `/restaurants/${restaurant._id}`
                  )
                }
                style={{
                  padding: "20px",
                  border: "1px solid #ddd",
                  borderRadius: "12px",
                  cursor: "pointer",
                  background: "#fff",
                  boxShadow:
                    "0 5px 15px rgba(0,0,0,0.05)",
                }}
              >
                <h2>{restaurant.name}</h2>

                <p>
                  {restaurant.city}, {restaurant.state}
                </p>

                <p>
                  {restaurant.cuisine?.join(", ") ||
                    "Food"}
                </p>

                <p>
                  ⭐ Rating: {restaurant.rating || 0}
                </p>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

const navButtonStyle = {
  border: "1px solid #ddd",
  borderRadius: "8px",
  padding: "9px 12px",
  cursor: "pointer",
  background: "#fff",
  color: "#333",
  fontWeight: "600",
};

export default RestaurantList;
