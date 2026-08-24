import { useState } from "react";
import API from "../api/api";

function Login({onLogin}) {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
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

    console.log("LOGIN BUTTON CLICKED");
    console.log("Sending data:", {
      email: formData.email,
      password: "********",
    });

    setLoading(true);
    setMessage("");
    setError("");

    try {
      const response = await API.post("/auth/login", formData);

      console.log("LOGIN API RESPONSE:", response);
      console.log("LOGIN RESPONSE DATA:", response.data);

      const { token, user } = response.data;

      localStorage.setItem("enjoMealToken", token);
      localStorage.setItem(
        "enjoMealUser",
        JSON.stringify(user)
      );

      setMessage("Login successful!");

      console.log("LOGIN SUCCESS");
      console.log("Logged-in user:", user);
      if (onLogin) {
        onLogin();
      }
      console.log("Token saved:", !!token);
    } catch (error) {
      console.error("LOGIN ERROR:", error);
      console.error("ERROR RESPONSE:", error.response);
      console.error("ERROR DATA:", error.response?.data);
      console.error("ERROR STATUS:", error.response?.status);

      setError(
        error.response?.data?.message ||
          error.message ||
          "Login failed. Please try again."
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
        <h2>Welcome back To ENJOMEAL</h2>

        <p style={{ color: "#777" }}>
          Login to your EnjoMeal account
        </p>

        <label>
          Email
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Enter your email"
            required
            style={{
              width: "100%",
              padding: "13px",
              marginTop: "7px",
              marginBottom: "18px",
              boxSizing: "border-box",
              border: "1px solid #ddd",
              borderRadius: "10px",
            }}
          />
        </label>

        <label>
          Password
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Enter your password"
            required
            style={{
              width: "100%",
              padding: "13px",
              marginTop: "7px",
              marginBottom: "20px",
              boxSizing: "border-box",
              border: "1px solid #ddd",
              borderRadius: "10px",
            }}
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
          }}
        >
          {loading ? "Logging in..." : "Login"}
        </button>

        <p style={{ marginTop: "18px", textAlign: "center", color: "#777",
          }}
          >
              Don't have an account?{" "}
        <button
            type="button"
            onClick={() => {
            window.location.href = "/register";
          }}
            style={{ border: "none", background: "transparent", color: "#e85d04", fontWeight: "700",
                  cursor: "pointer",
                  padding: 0,
          }}
          >
              Register
        </button>
        </p>

        {message && (
          <p style={{ color: "green" }}>
            {message}
          </p>
        )}

        {error && (
          <p style={{ color: "red" }}>
            {error}
          </p>
        )}
      </form>
    </div>
  );
}

export default Login;