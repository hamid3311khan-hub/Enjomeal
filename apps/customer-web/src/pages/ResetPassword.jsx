import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/api";

function ResetPassword() {
  const navigate = useNavigate();

  const savedEmail =
    sessionStorage.getItem("enjoMealResetEmail") || "";

  const savedOTP =
    sessionStorage.getItem("enjoMealResetOTP") || "";

  const [email, setEmail] = useState(savedEmail);
  const [otp, setOtp] = useState(savedOTP);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // =====================================================
  // RESET PASSWORD
  // =====================================================

  const handleResetPassword = async (event) => {
    event.preventDefault();

    if (loading) {
      return;
    }

    setError("");
    setMessage("");

    const normalizedEmail = email
      .toLowerCase()
      .trim();

    const normalizedOTP = otp.trim();

    // ===================================================
    // VALIDATION
    // ===================================================

    if (!normalizedEmail) {
      setError("Please enter your email.");
      return;
    }

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        normalizedEmail
      )
    ) {
      setError("Please enter a valid email.");
      return;
    }

    if (!/^\d{6}$/.test(normalizedOTP)) {
      setError("Please enter the 6-digit OTP.");
      return;
    }

    if (!password) {
      setError("Please enter your new password.");
      return;
    }

    if (password.length < 6) {
      setError(
        "Password must be at least 6 characters."
      );
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      // =================================================
      // RESET PASSWORD API
      // =================================================

      const response = await API.post(
        "/auth/reset-password",
        {
          email: normalizedEmail,
          otp: normalizedOTP,
          password,
        }
      );

      if (response.data.success) {
        setMessage(
          response.data.message ||
            "Password reset successfully."
        );

        // Clear reset session data
        sessionStorage.removeItem(
          "enjoMealResetEmail"
        );

        sessionStorage.removeItem(
          "enjoMealResetOTP"
        );

        // Go to login
        setTimeout(() => {
          navigate("/login", {
            replace: true,
          });
        }, 1000);

        return;
      }

      setError(
        response.data.message ||
          "Failed to reset password."
      );
    } catch (err) {
      console.error(
        "Reset Password Error:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Failed to reset password. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // UI
  // =====================================================

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        boxSizing: "border-box",
        background: "#fff8f3",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "430px",
          padding: "30px",
          boxSizing: "border-box",
          background: "#ffffff",
          border: "1px solid #eeeeee",
          borderRadius: "14px",
          boxShadow:
            "0 5px 20px rgba(0,0,0,0.08)",
        }}
      >
        {/* =================================================
            HEADER
           ================================================= */}

        <h1
          style={{
            marginTop: 0,
            marginBottom: "8px",
            color: "#e85d04",
            textAlign: "center",
          }}
        >
          ENJOMEAL
        </h1>

        <h2
          style={{
            textAlign: "center",
            marginBottom: "8px",
          }}
        >
          Reset Password
        </h2>

        <p
          style={{
            textAlign: "center",
            color: "#777777",
            lineHeight: "1.5",
            marginBottom: "25px",
          }}
        >
          Create a new password for your
          account.
        </p>

        {/* =================================================
            SUCCESS
           ================================================= */}

        {message && (
          <div
            style={{
              marginBottom: "15px",
              padding: "12px",
              background: "#e8f7e8",
              border: "1px solid #b7dfb7",
              borderRadius: "8px",
              color: "#287a28",
              fontSize: "14px",
            }}
          >
            {message}
          </div>
        )}

        {/* =================================================
            ERROR
           ================================================= */}

        {error && (
          <div
            style={{
              marginBottom: "15px",
              padding: "12px",
              background: "#ffe5e5",
              border: "1px solid #ffb3b3",
              borderRadius: "8px",
              color: "#c00000",
              fontSize: "14px",
            }}
          >
            {error}
          </div>
        )}

        {/* =================================================
            FORM
           ================================================= */}

        <form onSubmit={handleResetPassword}>
          {/* EMAIL */}

          <label
            style={{
              display: "block",
              marginBottom: "7px",
              fontWeight: "600",
            }}
          >
            Email Address
          </label>

          <input
            type="email"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              setError("");
            }}
            placeholder="Enter your email"
            autoComplete="email"
            required
            style={{
              width: "100%",
              padding: "12px",
              boxSizing: "border-box",
              border: "1px solid #dddddd",
              borderRadius: "8px",
              marginBottom: "15px",
              fontSize: "15px",
            }}
          />

          {/* OTP */}

          <label
            style={{
              display: "block",
              marginBottom: "7px",
              fontWeight: "600",
            }}
          >
            OTP
          </label>

          <input
            type="text"
            value={otp}
            onChange={(event) => {
              const value =
                event.target.value
                  .replace(/\D/g, "")
                  .slice(0, 6);

              setOtp(value);
              setError("");
            }}
            placeholder="Enter 6-digit OTP"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength="6"
            required
            style={{
              width: "100%",
              padding: "12px",
              boxSizing: "border-box",
              border: "1px solid #dddddd",
              borderRadius: "8px",
              marginBottom: "15px",
              fontSize: "18px",
              letterSpacing: "4px",
              textAlign: "center",
            }}
          />

          {/* NEW PASSWORD */}

          <label
            style={{
              display: "block",
              marginBottom: "7px",
              fontWeight: "600",
            }}
          >
            New Password
          </label>

          <input
            type="password"
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              setError("");
            }}
            placeholder="Enter new password"
            autoComplete="new-password"
            required
            style={{
              width: "100%",
              padding: "12px",
              boxSizing: "border-box",
              border: "1px solid #dddddd",
              borderRadius: "8px",
              marginBottom: "15px",
              fontSize: "15px",
            }}
          />

          {/* CONFIRM PASSWORD */}

          <label
            style={{
              display: "block",
              marginBottom: "7px",
              fontWeight: "600",
            }}
          >
            Confirm Password
          </label>

          <input
            type="password"
            value={confirmPassword}
            onChange={(event) => {
              setConfirmPassword(
                event.target.value
              );
              setError("");
            }}
            placeholder="Confirm new password"
            autoComplete="new-password"
            required
            style={{
              width: "100%",
              padding: "12px",
              boxSizing: "border-box",
              border: "1px solid #dddddd",
              borderRadius: "8px",
              marginBottom: "20px",
              fontSize: "15px",
            }}
          />

          {/* RESET BUTTON */}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "13px",
              border: "none",
              borderRadius: "8px",
              background: loading
                ? "#aaaaaa"
                : "#e85d04",
              color: "#ffffff",
              fontWeight: "700",
              fontSize: "15px",
              cursor: loading
                ? "not-allowed"
                : "pointer",
            }}
          >
            {loading
              ? "Resetting Password..."
              : "Reset Password"}
          </button>
        </form>

        {/* =================================================
            BACK TO LOGIN
           ================================================= */}

        <button
          type="button"
          onClick={() =>
            navigate("/login")
          }
          style={{
            width: "100%",
            marginTop: "12px",
            padding: "12px",
            border: "1px solid #dddddd",
            borderRadius: "8px",
            background: "#ffffff",
            color: "#333333",
            fontWeight: "600",
            cursor: "pointer",
          }}
        >
          ← Back to Login
        </button>
      </div>
    </div>
  );
}

export default ResetPassword;
