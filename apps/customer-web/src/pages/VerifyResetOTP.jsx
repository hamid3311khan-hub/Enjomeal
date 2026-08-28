import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/api";

function VerifyResetOTP() {
  const navigate = useNavigate();

  const savedEmail =
    sessionStorage.getItem("enjoMealResetEmail") || "";

  const [email, setEmail] = useState(savedEmail);
  const [otp, setOtp] = useState("");

  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // =====================================================
  // VERIFY OTP
  // =====================================================

  const handleVerifyOTP = async (event) => {
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

    try {
      setLoading(true);

      // =================================================
      // VERIFY RESET OTP
      // =================================================

      const response = await API.post(
        "/auth/verify-reset-otp",
        {
          email: normalizedEmail,
          otp: normalizedOTP,
        }
      );

      if (response.data.success) {
        setMessage(
          response.data.message ||
            "OTP verified successfully."
        );

        // Save email and OTP for reset password step
        sessionStorage.setItem(
          "enjoMealResetEmail",
          normalizedEmail
        );

        sessionStorage.setItem(
          "enjoMealResetOTP",
          normalizedOTP
        );

        // Go to reset password page
        setTimeout(() => {
          navigate("/reset-password");
        }, 700);

        return;
      }

      setError(
        response.data.message ||
          "Invalid or expired OTP."
      );
    } catch (err) {
      console.error(
        "Verify Reset OTP Error:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Failed to verify OTP. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // RESEND OTP
  // =====================================================

  const handleResendOTP = async () => {
    if (resending) {
      return;
    }

    setError("");
    setMessage("");

    const normalizedEmail = email
      .toLowerCase()
      .trim();

    if (!normalizedEmail) {
      setError("Please enter your email.");
      return;
    }

    try {
      setResending(true);

      const response = await API.post(
        "/auth/forgot-password",
        {
          email: normalizedEmail,
        }
      );

      if (response.data.success) {
        sessionStorage.setItem(
          "enjoMealResetEmail",
          normalizedEmail
        );

        setOtp("");

        setMessage(
          response.data.message ||
            "A new password reset OTP has been sent."
        );

        return;
      }

      setError(
        response.data.message ||
          "Unable to resend OTP."
      );
    } catch (err) {
      console.error(
        "Resend OTP Error:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Failed to resend OTP. Please try again."
      );
    } finally {
      setResending(false);
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
          Verify OTP
        </h2>

        <p
          style={{
            textAlign: "center",
            color: "#777777",
            lineHeight: "1.5",
            marginBottom: "25px",
          }}
        >
          Enter the 6-digit OTP sent to your
          registered email address.
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

        <form onSubmit={handleVerifyOTP}>
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
              setMessage("");
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
              marginBottom: "18px",
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
              setMessage("");
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
              marginBottom: "18px",
              fontSize: "18px",
              letterSpacing: "4px",
              textAlign: "center",
            }}
          />

          {/* VERIFY */}

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
              ? "Verifying..."
              : "Verify OTP"}
          </button>
        </form>

        {/* =================================================
            RESEND
           ================================================= */}

        <button
          type="button"
          onClick={handleResendOTP}
          disabled={resending}
          style={{
            width: "100%",
            marginTop: "12px",
            padding: "12px",
            border: "1px solid #e85d04",
            borderRadius: "8px",
            background: "#ffffff",
            color: "#e85d04",
            fontWeight: "600",
            cursor: resending
              ? "not-allowed"
              : "pointer",
          }}
        >
          {resending
            ? "Sending..."
            : "Resend OTP"}
        </button>

        {/* =================================================
            BACK
           ================================================= */}

        <button
          type="button"
          onClick={() =>
            navigate("/forgot-password")
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
          ← Back
        </button>
      </div>
    </div>
  );
}

export default VerifyResetOTP;
