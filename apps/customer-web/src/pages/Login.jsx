import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/api";

function Login({ onLogin }) {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // =====================================================
  // HANDLE INPUT CHANGE
  // =====================================================

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
    setMessage("");
  };

  // =====================================================
  // LOGIN
  // =====================================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (loading) {
      return;
    }

    setLoading(true);
    setMessage("");
    setError("");

    try {
      const email = formData.email
        .trim()
        .toLowerCase();

      const password = formData.password;

      if (!email || !password) {
        setError(
          "Please enter your email and password."
        );
        return;
      }

      const response = await API.post(
        "/auth/login",
        {
          email,
          password,
        }
      );

      console.log(
        "LOGIN API RESPONSE:",
        response.data
      );

      const { token, user } =
        response.data;

      if (!token) {
        throw new Error(
          "Login successful but authentication token was not received."
        );
      }

      if (!user) {
        throw new Error(
          "Login successful but user information was not received."
        );
      }

      // =================================================
      // CUSTOMER ROLE CHECK
      // =================================================

      if (
        user.role &&
        user.role !== "customer"
      ) {
        setError(
          "This account cannot be used in the Customer Panel."
        );

        return;
      }

      // =================================================
      // SAVE AUTH DATA
      // =================================================

      localStorage.setItem(
        "enjoMealToken",
        token
      );

      localStorage.setItem(
        "enjoMealUser",
        JSON.stringify(user)
      );

      setMessage(
        "Login successful!"
      );

      console.log(
        "LOGIN SUCCESS"
      );

      console.log(
        "Logged-in user:",
        user
      );

      console.log(
        "Token saved:",
        true
      );

      // =================================================
      // NAVIGATION
      // =================================================

      if (onLogin) {
        onLogin();
      } else {
        navigate(
          "/restaurants",
          {
            replace: true,
          }
        );
      }
    } catch (error) {
      console.error(
        "LOGIN ERROR:",
        error
      );

      localStorage.removeItem(
        "enjoMealToken"
      );

      localStorage.removeItem(
        "enjoMealUser"
      );

      setError(
        error.response?.data?.message ||
          error.message ||
          "Login failed. Please check your credentials and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // REGISTER
  // =====================================================

  const handleRegister = () => {
    navigate("/register");
  };

  // =====================================================
  // FORGOT PASSWORD
  // =====================================================

  const handleForgotPassword = () => {
    navigate("/forgot-password");
  };

  // =====================================================
  // UI
  // =====================================================

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: "#fff8f3",
        padding: "20px",
        boxSizing: "border-box",
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
          boxShadow:
            "0 15px 40px rgba(0,0,0,0.08)",
          boxSizing: "border-box",
        }}
      >
        {/* =================================================
            HEADER
        ================================================= */}

        <h2
          style={{
            marginTop: 0,
            marginBottom: "8px",
          }}
        >
          Welcome back to ENJOMEAL
        </h2>

        <p
          style={{
            color: "#777",
            marginTop: 0,
            marginBottom: "26px",
          }}
        >
          Login to your EnjoMeal account
        </p>

        {/* =================================================
            EMAIL
        ================================================= */}

        <label
          htmlFor="login-email"
          style={{
            display: "block",
            fontWeight: "600",
          }}
        >
          Email
        </label>

        <input
          id="login-email"
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="Enter your email"
          autoComplete="email"
          inputMode="email"
          required
          disabled={loading}
          style={{
            width: "100%",
            padding: "13px",
            marginTop: "7px",
            marginBottom: "18px",
            boxSizing: "border-box",
            border: "1px solid #ddd",
            borderRadius: "10px",
            outline: "none",
          }}
        />

        {/* =================================================
            PASSWORD
        ================================================= */}

        <label
          htmlFor="login-password"
          style={{
            display: "block",
            fontWeight: "600",
          }}
        >
          Password
        </label>

        <input
          id="login-password"
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          placeholder="Enter your password"
          autoComplete="current-password"
          required
          disabled={loading}
          style={{
            width: "100%",
            padding: "13px",
            marginTop: "7px",
            marginBottom: "8px",
            boxSizing: "border-box",
            border: "1px solid #ddd",
            borderRadius: "10px",
            outline: "none",
          }}
        />

        {/* =================================================
            FORGOT PASSWORD
        ================================================= */}

        <div
          style={{
            textAlign: "right",
            marginBottom: "20px",
          }}
        >
          <button
            type="button"
            onClick={
              handleForgotPassword
            }
            disabled={loading}
            style={{
              border: "none",
              background:
                "transparent",
              color: "#e85d04",
              fontWeight: "600",
              cursor: loading
                ? "not-allowed"
                : "pointer",
              padding: 0,
              fontSize: "14px",
            }}
          >
            Forgot Password?
          </button>
        </div>

        {/* =================================================
            LOGIN BUTTON
        ================================================= */}

        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            padding: "14px",
            border: 0,
            borderRadius: "10px",
            background: loading
              ? "#f0a77b"
              : "#e85d04",
            color: "#fff",
            fontWeight: "700",
            cursor: loading
              ? "not-allowed"
              : "pointer",
            fontSize: "15px",
          }}
        >
          {loading
            ? "Logging in..."
            : "Login"}
        </button>

        {/* =================================================
            REGISTER
        ================================================= */}

        <p
          style={{
            marginTop: "18px",
            marginBottom: 0,
            textAlign: "center",
            color: "#777",
          }}
        >
	<div
  style={{
    textAlign: "right",
    marginBottom: "15px",
  }}
>
  <button
    type="button"
    onClick={() => navigate("/forgot-password")}
    style={{
      border: "none",
      background: "transparent",
      color: "#e85d04",
      fontWeight: "600",
      cursor: "pointer",
      padding: 0,
    }}
  >
    Forgot Password?
  </button>
</div>
          Don't have an account?{" "}

          <button
            type="button"
            onClick={
              handleRegister
            }
            disabled={loading}
            style={{
              border: "none",
              background:
                "transparent",
              color: "#e85d04",
              fontWeight: "700",
              cursor: loading
                ? "not-allowed"
                : "pointer",
              padding: 0,
              fontSize: "inherit",
            }}
          >
            Register
          </button>
        </p>

        {/* =================================================
            SUCCESS MESSAGE
        ================================================= */}

        {message && (
          <p
            role="status"
            style={{
              color: "green",
              marginTop: "18px",
              marginBottom: 0,
            }}
          >
            {message}
          </p>
        )}

        {/* =================================================
            ERROR MESSAGE
        ================================================= */}

        {error && (
          <p
            role="alert"
            style={{
              color: "red",
              marginTop: "18px",
              marginBottom: 0,
            }}
          >
            {error}
          </p>
        )}
      </form>
    </div>
  );
}

export default Login;
