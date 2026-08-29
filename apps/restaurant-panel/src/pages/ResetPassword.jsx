import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import API from "../api/api";

function ResetPassword() {
  const navigate = useNavigate();
  const location = useLocation();

  const email = location.state?.email || "";
  const resetToken = location.state?.resetToken || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setMessage("");

    if (!resetToken) {
      setError(
        "Reset session is missing or expired. Please request a new OTP."
      );
      return;
    }

    if (!password || !confirmPassword) {
      setError("Please enter and confirm your new password.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      const response = await API.post("/auth/reset-password", {
        resetToken,
        newPassword: password,
      });

      setMessage(
        response.data?.message ||
          "Password reset successfully."
      );

      setTimeout(() => {
        navigate("/login", {
          replace: true,
        });
      }, 1200);
    } catch (error) {
      console.error("Reset Password Error:", error);

      setError(
        error.response?.data?.message ||
          "Failed to reset password."
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
        <h2 style={{ textAlign: "center" }}>
          Reset Password
        </h2>

        {email && (
          <p
            style={{
              textAlign: "center",
              color: "#666",
              marginBottom: "20px",
            }}
          >
            Reset password for <strong>{email}</strong>
          </p>
        )}

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
          type="password"
          placeholder="New Password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="new-password"
          style={{
            width: "100%",
            padding: "12px",
            marginBottom: "15px",
            border: "1px solid #ccc",
            borderRadius: "8px",
            boxSizing: "border-box",
          }}
        />

        <input
          type="password"
          placeholder="Confirm New Password"
          value={confirmPassword}
          onChange={(event) =>
            setConfirmPassword(event.target.value)
          }
          autoComplete="new-password"
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
          {loading ? "Resetting..." : "Reset Password"}
        </button>
      </form>
    </div>
  );
}

export default ResetPassword;
