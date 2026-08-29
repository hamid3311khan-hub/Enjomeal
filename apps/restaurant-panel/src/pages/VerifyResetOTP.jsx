import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import API from "../api/api";

function VerifyResetOTP() {
  const navigate = useNavigate();
  const location = useLocation();

  const email = location.state?.email || "";

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");

    if (!email) {
      setError("Email information is missing. Please request OTP again.");
      return;
    }

    if (!otp || otp.trim().length !== 6) {
      setError("Please enter the 6-digit OTP.");
      return;
    }

    try {
      setLoading(true);

      const response = await API.post("/auth/verify-reset-otp", {
        email,
        otp: otp.trim(),
      });

      const resetToken =
        response.data?.resetToken ||
        response.data?.data?.resetToken;

      if (!resetToken) {
        throw new Error("Reset token was not received.");
      }

      navigate("/reset-password", {
        state: {
          email,
          resetToken,
        },
      });
    } catch (error) {
      console.error("Verify Reset OTP Error:", error);

      setError(
        error.response?.data?.message ||
          error.message ||
          "Invalid or expired OTP."
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
          Verify OTP
        </h2>

        <p
          style={{
            textAlign: "center",
            color: "#666",
          }}
        >
          Enter the 6-digit OTP sent to:
        </p>

        <p
          style={{
            textAlign: "center",
            fontWeight: "700",
            marginBottom: "20px",
          }}
        >
          {email}
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

        <input
          type="text"
          inputMode="numeric"
          maxLength={6}
          placeholder="Enter 6-digit OTP"
          value={otp}
          onChange={(event) =>
            setOtp(event.target.value.replace(/\D/g, ""))
          }
          style={{
            width: "100%",
            padding: "12px",
            marginBottom: "15px",
            border: "1px solid #ccc",
            borderRadius: "8px",
            boxSizing: "border-box",
            textAlign: "center",
            fontSize: "20px",
            letterSpacing: "5px",
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
          {loading ? "Verifying..." : "Verify OTP"}
        </button>

        <button
          type="button"
          onClick={() => navigate("/forgot-password")}
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
          Request New OTP
        </button>
      </form>
    </div>
  );
}

export default VerifyResetOTP;
EOF
