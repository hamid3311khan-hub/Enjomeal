import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/api";

function RestaurantRegister() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    restaurantName: "",
    ownerName: "",
    email: "",
    phone: "",
    password: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    cuisine: "",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleChange = (event) => {
    setFormData({
      ...formData,
      [event.target.name]: event.target.value,
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setLoading(true);
      setMessage("");
      setError("");

      const response = await API.post("/auth/register", {
        // User model ke liye
        name: formData.ownerName,

        // Restaurant profile ke liye
        restaurantName: formData.restaurantName,
        ownerName: formData.ownerName,

        email: formData.email,
        phone: formData.phone,
        password: formData.password,

        address: formData.address,
        city: formData.city,
        state: formData.state,
        pincode: formData.pincode,

        cuisine: formData.cuisine
          ? [formData.cuisine]
          : [],

        role: "restaurant",
      });

      if (response.data.success) {
        setMessage(
          response.data.message ||
            "Restaurant registration submitted successfully."
        );

        setFormData({
          restaurantName: "",
          ownerName: "",
          email: "",
          phone: "",
          password: "",
          address: "",
          city: "",
          state: "",
          pincode: "",
          cuisine: "",
        });

        setTimeout(() => {
          navigate("/login");
        }, 2000);
      }
    } catch (err) {
      console.error(
        "Restaurant Registration Error:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Registration failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: "100%",
    padding: "12px",
    marginTop: "7px",
    marginBottom: "16px",
    boxSizing: "border-box",
    border: "1px solid #ddd",
    borderRadius: "8px",
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "#fff8f3",
        padding: "20px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "480px",
          padding: "30px",
          background: "#fff",
          border: "1px solid #ddd",
          borderRadius: "12px",
          boxShadow: "0 4px 15px rgba(0,0,0,0.08)",
        }}
      >
        <h1
          style={{
            textAlign: "center",
            marginBottom: "8px",
          }}
        >
          EnjoMeal
        </h1>

        <h2
          style={{
            textAlign: "center",
            marginBottom: "25px",
          }}
        >
          Restaurant Registration
        </h2>

        {error && (
          <p
            style={{
              color: "#dc3545",
              background: "#ffe5e5",
              padding: "10px",
              borderRadius: "8px",
              textAlign: "center",
            }}
          >
            {error}
          </p>
        )}

        {message && (
          <p
            style={{
              color: "#198754",
              background: "#e8f7ee",
              padding: "10px",
              borderRadius: "8px",
              textAlign: "center",
            }}
          >
            {message}
          </p>
        )}

        <form onSubmit={handleSubmit}>
          <label>Restaurant Name</label>

          <input
            type="text"
            name="restaurantName"
            value={formData.restaurantName}
            onChange={handleChange}
            placeholder="Enter restaurant name"
            required
            style={inputStyle}
          />

          <label>Owner Name</label>

          <input
            type="text"
            name="ownerName"
            value={formData.ownerName}
            onChange={handleChange}
            placeholder="Enter owner name"
            required
            style={inputStyle}
          />

          <label>Email</label>

          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Enter restaurant email"
            required
            style={inputStyle}
          />

          <label>Phone</label>

          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="Enter phone number"
            required
            style={inputStyle}
          />

          <label>Password</label>

          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Create password"
            required
            minLength="8"
            style={inputStyle}
          />

          <label>Address</label>

          <input
            type="text"
            name="address"
            value={formData.address}
            onChange={handleChange}
            placeholder="Restaurant full address"
            required
            style={inputStyle}
          />

          <label>City</label>

          <input
            type="text"
            name="city"
            value={formData.city}
            onChange={handleChange}
            placeholder="Enter city"
            required
            style={inputStyle}
          />

          <label>State</label>

          <input
            type="text"
            name="state"
            value={formData.state}
            onChange={handleChange}
            placeholder="Enter state"
            required
            style={inputStyle}
          />

          <label>Pincode</label>

          <input
            type="text"
            name="pincode"
            value={formData.pincode}
            onChange={handleChange}
            placeholder="Enter pincode"
            required
            style={inputStyle}
          />

          <label>Cuisine</label>

          <input
            type="text"
            name="cuisine"
            value={formData.cuisine}
            onChange={handleChange}
            placeholder="e.g. Indian, Mughlai"
            style={inputStyle}
          />

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "14px",
              border: "none",
              borderRadius: "8px",
              background: loading
                ? "#aaa"
                : "#e85d04",
              color: "#fff",
              fontWeight: "700",
              cursor: loading
                ? "not-allowed"
                : "pointer",
            }}
          >
            {loading
              ? "Registering..."
              : "Register Restaurant"}
          </button>
        </form>

        <p
          style={{
            textAlign: "center",
            marginTop: "18px",
          }}
        >
          Already registered?{" "}
          <button
            type="button"
            onClick={() => navigate("/login")}
            style={{
              border: "none",
              background: "none",
              color: "#e85d04",
              fontWeight: "700",
              cursor: "pointer",
            }}
          >
            Login
          </button>
        </p>
      </div>
    </div>
  );
}

export default RestaurantRegister;