import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/api";

function RestaurantList() {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);

  const navigate = useNavigate();
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


  if (loading) {
    return <h2>Loading restaurants...</h2>;
  }

  if (error) {
    return <p style={{ color: "red" }}>{error}</p>;
  }

  return (
    <div style={{ padding: "30px" }}>

  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "25px",
      gap: "15px",
    }}
  >
    <h1 style={{ margin: 0 }}>
      Popular Restaurants
    </h1>

    <button
      onClick={() => navigate("/notifications")}
      style={{
        position: "relative",
        border: "none",
        borderRadius: "10px",
        padding: "10px 16px",
        cursor: "pointer",
        background: "#1976d2",
        color: "#fff",
        fontSize: "15px",
        fontWeight: "bold",
      }}
    >
      🔔 Notifications

      {unreadCount > 0 && (
        <span
          style={{
            position: "absolute",
            top: "-8px",
            right: "-8px",
            minWidth: "22px",
            height: "22px",
            borderRadius: "50%",
            background: "red",
            color: "#fff",
            fontSize: "12px",
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
  </div>

      {restaurants.length === 0 ? (
        <p>No restaurants available.</p>
      ) : (
        restaurants.map((restaurant) => (
          <div
            key={restaurant._id}
            onClick={() =>
              navigate(`/restaurants/${restaurant._id}`)
            }
            style={{
              padding: "20px",
              marginBottom: "15px",
              border: "1px solid #ddd",
              borderRadius: "12px",
              cursor: "pointer",
              background: "#fff",
            }}
          >
            <h2>{restaurant.name}</h2>

            <p>
              {restaurant.city}, {restaurant.state}
            </p>

            <p>
              {restaurant.cuisine?.join(", ") || "Food"}
            </p>

            <p>
              Rating: {restaurant.rating || 0}
            </p>
          </div>
        ))
      )}
    </div>
  );
}

export default RestaurantList;