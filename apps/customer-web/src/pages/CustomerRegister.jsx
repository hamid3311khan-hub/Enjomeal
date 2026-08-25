import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/api";

function CustomerRegister() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setMessage("");
    setError("");

    try {
      const response = await API.post("/auth/register", {
        ...formData,
        role: "customer",
      });

      const data = response.data;

      setMessage(data.message || "Registration successful!");

      setFormData({
        name: "",
        email: "",
        phone: "",
        password: "",
      });

      // Registration successful → Login page
      setTimeout(() => {
        navigate("/login", { replace: true });
      }, 1000);
    } catch (err) {
      console.error("REGISTRATION ERROR:", err);

      setError(
        err.response?.data?.message ||
          err.message ||
          "Registration failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: "#fff8f3",
        padding: "20px",
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          width: "100%",
          maxWidth: "420px",
          padding: "32px",
          background: "#fff",
          borderRadius: "18px",
          boxShadow: "0 15px 40px rgba(0,0,0,0.08)",
        }}
      >
        <h2>Customer Registration</h2>

        <p style={{ color: "#777" }}>
          Create your EnjoMeal customer account
        </p>

        <label>
          Full Name
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Enter your name"
            required
            style={inputStyle}
          />
        </label>

        <label>
          Email
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Enter your email"
            required
            style={inputStyle}
          />
        </label>

        <label>
          Phone Number
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="Enter your phone number"
            required
            style={inputStyle}
          />
        </label>

        <label>
          Password
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Create a password"
            required
            style={inputStyle}
          />
        </label>

        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            padding: "14px",
            border: 0,
            borderRadius: "10px",
            background: "#e85d04",
            color: "#fff",
            fontWeight: "700",
            cursor: loading ? "not-allowed" : "pointer",
            marginTop: "8px",
          }}
        >
          {loading ? "Registering..." : "Register"}
        </button>

        {message && (
          <p style={{ color: "green", textAlign: "center" }}>
            {message}
          </p>
        )}

        {error && (
          <p style={{ color: "red", textAlign: "center" }}>
            {error}
          </p>
        )}

        <p
          style={{
            marginTop: "18px",
            textAlign: "center",
            color: "#777",
          }}
        >
          Already have an account?{" "}
          <button
            type="button"
            onClick={() => navigate("/login")}
            style={{
              border: "none",
              background: "transparent",
              color: "#e85d04",
              fontWeight: "700",
              cursor: "pointer",
              padding: 0,
            }}
          >
            Login
          </button>
        </p>
      </form>
    </div>
  );
}

const inputStyle = {
  width: "100%",
  padding: "13px",
  marginTop: "7px",
  marginBottom: "18px",
  boxSizing: "border-box",
  border: "1px solid #ddd",
  borderRadius: "10px",
};

export default CustomerRegister;
