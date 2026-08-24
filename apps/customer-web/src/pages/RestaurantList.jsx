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

  // =====================================================
  // FETCH DATA
  // =====================================================

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

  // =====================================================
  // LOGOUT
  // =====================================================

  const handleLogout = () => {
    localStorage.removeItem("enjoMealToken");
    localStorage.removeItem("enjoMealUser");

    navigate("/login", {
      replace: true,
    });
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
          alignItems: "center",
          justifyContent: "center",
          background: "#fff8f3",
        }}
      >
        <h2>Loading restaurants...</h2>
      </div>
    );
  }

  // =====================================================
  // ERROR
  // =====================================================

  if (error) {
    return (
      <div
        style={{
          minHeight: "100vh",
          padding: "30px",
          background: "#fff8f3",
        }}
      >
        <p style={{ color: "red" }}>{error}</p>

        <button
          onClick={() => window.location.reload()}
          style={primaryButtonStyle}
        >
          Retry
        </button>
      </div>
    );
  }

  // =====================================================
  // UI
  // =====================================================

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#fff8f3",
      }}
    >
      {/* =====================================================
          HEADER
      ===================================================== */}

      <header
        style={{
          background: "#ffffff",
          padding: "15px 25px",
          borderBottom: "1px solid #eeeeee",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "15px",
          flexWrap: "wrap",
        }}
      >
        {/* LOGO */}

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

        {/* NAVIGATION */}

        <div
          style={{
            display: "flex",
            gap: "8px",
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          {/* RESTAURANTS */}

          <button
            onClick={() => navigate("/restaurants")}
            style={navButtonStyle}
          >
            🏠 Restaurants
          </button>

          {/* MY ORDERS */}

          <button
            onClick={() => navigate("/my-orders")}
            style={navButtonStyle}
          >
            📦 My Orders
          </button>

          {/* NOTIFICATIONS */}

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
                  color: "#ffffff",
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

          {/* CART */}

          <button
            onClick={() => navigate("/cart")}
            style={navButtonStyle}
          >
            🛒 Cart
          </button>

          {/* PROFILE */}

          <button
            onClick={() => navigate("/profile")}
            style={navButtonStyle}
          >
            👤 Profile
          </button>

          {/* LOGOUT */}

          <button
            onClick={handleLogout}
            style={{
              ...navButtonStyle,
              background: "#dc3545",
              color: "#ffffff",
              borderColor: "#dc3545",
            }}
          >
            🚪 Logout
          </button>
        </div>
      </header>

      {/* =====================================================
          CUSTOMER INFO
      ===================================================== */}

      <section
        style={{
          padding: "25px 30px 10px",
        }}
      >
        <p
          style={{
            margin: 0,
            color: "#777777",
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

        <p
          style={{
            color: "#777777",
          }}
        >
          Choose a restaurant and enjoy your meal.
        </p>
      </section>

      {/* =====================================================
          RESTAURANTS
      ===================================================== */}

      <main
        style={{
          padding: "10px 30px 30px",
        }}
      >
        <h2>Popular Restaurants</h2>

        {restaurants.length === 0 ? (
          <div
            style={{
              background: "#ffffff",
              padding: "20px",
              borderRadius: "12px",
              border: "1px solid #eeeeee",
            }}
          >
            <p>No restaurants available.</p>
          </div>
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
                  border: "1px solid #dddddd",
                  borderRadius: "12px",
                  cursor: "pointer",
                  background: "#ffffff",
                  boxShadow:
                    "0 5px 15px rgba(0,0,0,0.05)",
                }}
              >
                <h2
                  style={{
                    marginTop: 0,
                  }}
                >
                  {restaurant.name}
                </h2>

                <p>
                  📍 {restaurant.city},{" "}
                  {restaurant.state}
                </p>

                <p>
                  🍽️{" "}
                  {restaurant.cuisine?.join(", ") ||
                    "Food"}
                </p>

                <p>
                  ⭐ Rating:{" "}
                  {restaurant.rating || 0}
                </p>

                <button
                  onClick={(event) => {
                    event.stopPropagation();

                    navigate(
                      `/restaurants/${restaurant._id}`
                    );
                  }}
                  style={primaryButtonStyle}
                >
                  View Menu
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

// =====================================================
// STYLES
// =====================================================

const navButtonStyle = {
  border: "1px solid #dddddd",
  borderRadius: "8px",
  padding: "9px 12px",
  cursor: "pointer",
  background: "#ffffff",
  color: "#333333",
  fontWeight: "600",
};

const primaryButtonStyle = {
  border: "none",
  borderRadius: "8px",
  padding: "10px 16px",
  cursor: "pointer",
  background: "#e85d04",
  color: "#ffffff",
  fontWeight: "600",
};

export default RestaurantList;
