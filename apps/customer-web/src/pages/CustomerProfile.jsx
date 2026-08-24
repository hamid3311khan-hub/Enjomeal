import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/api";

function CustomerProfile() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await API.get("/auth/profile");

        if (response.data.success) {
          setUser(response.data.user);

          localStorage.setItem(
            "enjoMealUser",
            JSON.stringify(response.data.user)
          );
        } else {
          setError("Profile load nahi ho raha.");
        }
      } catch (err) {
        console.error("Profile API Error:", err);

        setError(
          err.response?.data?.message ||
            "Failed to load profile."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("enjoMealToken");
    localStorage.removeItem("enjoMealUser");

    navigate("/login", {
      replace: true,
    });
  };

  if (loading) {
    return (
      <div style={pageStyle}>
        <h2>Loading profile...</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div style={pageStyle}>
        <p style={{ color: "red" }}>{error}</p>

        <button
          onClick={() => navigate("/restaurants")}
          style={buttonStyle}
        >
          Back to Restaurants
        </button>
      </div>
    );
  }

  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        <button
          onClick={() => navigate("/restaurants")}
          style={{
            ...buttonStyle,
            background: "#eee",
            color: "#333",
          }}
        >
          ← Back
        </button>

        <h1 style={{ color: "#e85d04" }}>
          👤 Customer Profile
        </h1>

        <div style={profileRowStyle}>
          <strong>Name</strong>
          <span>{user?.name || "Not available"}</span>
        </div>

        <div style={profileRowStyle}>
          <strong>Email</strong>
          <span>{user?.email || "Not available"}</span>
        </div>

        <div style={profileRowStyle}>
          <strong>Phone</strong>
          <span>{user?.phone || "Not provided"}</span>
        </div>

        <div style={profileRowStyle}>
          <strong>Role</strong>
          <span>{user?.role || "customer"}</span>
        </div>

        <div style={profileRowStyle}>
          <strong>Account Status</strong>
          <span
            style={{
              color: user?.isActive ? "green" : "red",
              fontWeight: "700",
            }}
          >
            {user?.isActive ? "Active" : "Inactive"}
          </span>
        </div>

        <button
          onClick={() => navigate("/my-orders")}
          style={buttonStyle}
        >
          📦 My Orders
        </button>

        <button
          onClick={() => navigate("/notifications")}
          style={buttonStyle}
        >
          🔔 Notifications
        </button>

        <button
          onClick={() => navigate("/cart")}
          style={buttonStyle}
        >
          🛒 My Cart
        </button>

        <button
          onClick={handleLogout}
          style={{
            ...buttonStyle,
            background: "#dc3545",
          }}
        >
          🚪 Logout
        </button>
      </div>
    </div>
  );
}

const pageStyle = {
  minHeight: "100vh",
  background: "#fff8f3",
  padding: "30px 20px",
  boxSizing: "border-box",
};

const cardStyle = {
  width: "100%",
  maxWidth: "600px",
  margin: "0 auto",
  background: "#fff",
  padding: "25px",
  borderRadius: "16px",
  boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
  boxSizing: "border-box",
};

const profileRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  gap: "20px",
  padding: "15px 0",
  borderBottom: "1px solid #eee",
};

const buttonStyle = {
  width: "100%",
  padding: "13px",
  marginTop: "12px",
  border: "none",
  borderRadius: "9px",
  background: "#e85d04",
};
export default CustomerProfile;
