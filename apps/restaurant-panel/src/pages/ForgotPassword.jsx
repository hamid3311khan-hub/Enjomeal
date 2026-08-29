import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/api";

function ForgotPassword() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setMessage("");

    if (!email.trim()) {
      setError("Please enter your registered email.");
      return;
    }

    try {
      setLoading(true);

      const response = await API.post("/auth/forgot-password", {
        email: email.trim().toLowerCase(),
      });

      setMessage(
        response.data?.message ||
          "If this email is registered, a password reset OTP has been sent."
      );

      navigate("/verify-reset-otp", {
        state: {
          email: email.trim().toLowerCase(),
        },
      });
    } catch (error) {
      console.error("Forgot Password Error:", error);

      setError(
        error.response?.data?.message ||
          "Unable to process password reset request."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "#f5f7fb",
        padding: "20px",
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          width: "100%",
          maxWidth: "420px",
          background: "#fff",
          padding: "30px",
          borderRadius: "12px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
        }}
      >
        <h2 style={{ textAlign: "center", marginBottom: "10px" }}>
          Forgot Password
        </h2>

        <p
          style={{
            textAlign: "center",
            color: "#666",
            marginBottom: "25px",
          }}
        >
          Enter your registered restaurant email.
        </p>

        {error && (
          <div
            style={{
              background: "#ffe5e5",
              color: "#c62828",
              padding: "10px",
              borderRadius: "8px",
              marginBottom: "15px",
            }}
          >
            {error}
          </div>
        )}

        {message && (
          <div
            style={{
              background: "#e8f5e9",
              color: "#2e7d32",
              padding: "10px",
              borderRadius: "8px",
              marginBottom: "15px",
            }}
          >
            {message}
          </div>
        )}

        <input
          type="email"
          placeholder="Registered Email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="email"
          style={{
            width: "100%",
            padding: "12px",
            marginBottom: "15px",
            border: "1px solid #ccc",
            borderRadius: "8px",
            boxSizing: "border-box",
          }}
        />

        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            padding: "12px",
            border: "none",
            borderRadius: "8px",
            background: "#e85d04",
            color: "#fff",
            fontWeight: "700",
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Sending OTP..." : "Send OTP"}
        </button>

        <button
          type="button"
          onClick={() => navigate("/login")}
          style={{
            width: "100%",
            marginTop: "12px",
            padding: "10px",
            border: "none",
            background: "transparent",
            color: "#555",
            cursor: "pointer",
          }}
        >
          Back to Login
        </button>
      </form>
    </div>
  );
}

export default ForgotPassword;
