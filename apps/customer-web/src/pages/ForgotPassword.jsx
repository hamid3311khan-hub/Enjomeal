import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/api";

function ForgotPassword() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // =====================================================
  // SUBMIT
  // =====================================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (loading) {
      return;
    }

    setError("");
    setMessage("");

    const normalizedEmail = email
      .toLowerCase()
      .trim();

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

    try {
      setLoading(true);

      // =================================================
      // REQUEST PASSWORD RESET OTP
      // =================================================

      const response = await API.post(
        "/auth/forgot-password",
        {
          email: normalizedEmail,
        }
      );

      if (response.data.success) {
        setMessage(
          response.data.message ||
            "If an account exists with this email, a password reset OTP has been sent."
        );

        // Store email for the next reset step
        sessionStorage.setItem(
          "enjoMealResetEmail",
          normalizedEmail
        );

        // Go to OTP verification page
        setTimeout(() => {
          navigate("/verify-reset-otp");
        }, 800);

        return;
      }

      setError(
        response.data.message ||
          "Unable to process password reset request."
      );
    } catch (err) {
      console.error(
        "Forgot Password Error:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Failed to request password reset. Please try again."
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
          Forgot Password?
        </h2>

        <p
          style={{
            textAlign: "center",
            color: "#777777",
            lineHeight: "1.5",
            marginBottom: "25px",
          }}
        >
          Enter your registered email address
          and we'll send you a password reset OTP.
        </p>

        {/* =================================================
            SUCCESS MESSAGE
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
            ERROR MESSAGE
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

        <form onSubmit={handleSubmit}>
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
              setMessage("");
            }}
            placeholder="Enter your registered email"
            autoComplete="email"
            required
            style={{
              width: "100%",
              padding: "12px",
              boxSizing: "border-box",
              border: "1px solid #dddddd",
              borderRadius: "8px",
              marginBottom: "18px",
              fontSize: "15px",
            }}
          />

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
              ? "Sending OTP..."
              : "Send Reset OTP"}
          </button>
        </form>

        {/* =================================================
            BACK TO LOGIN
           ================================================= */}

        <button
          type="button"
          onClick={() => navigate("/login")}
          style={{
            width: "100%",
            marginTop: "15px",
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

export default ForgotPassword;
