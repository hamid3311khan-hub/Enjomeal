import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/api";

function Login({ onLogin }) {
  const navigate = useNavigate();

  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");

  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // =====================================================
  // MOBILE CHANGE
  // =====================================================

  const handleMobileChange = (event) => {
    const value = event.target.value.replace(/\D/g, "");

    if (value.length <= 10) {
      setMobile(value);
    }

    setError("");
    setMessage("");
  };

  // =====================================================
  // OTP CHANGE
  // =====================================================

  const handleOtpChange = (event) => {
    const value = event.target.value.replace(/\D/g, "");

    if (value.length <= 6) {
      setOtp(value);
    }

    setError("");
    setMessage("");
  };

  // =====================================================
  // SEND OTP
  // =====================================================

  const handleSendOtp = () => {
    if (loading) {
      return;
    }

    setError("");
    setMessage("");

    if (!/^[6-9]\d{9}$/.test(mobile)) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }

    if (
      typeof window.sendOtp !== "function"
    ) {
      setError(
        "OTP service is not ready. Please refresh the page and try again."
      );
      console.error(
        "MSG91 sendOtp method is not available."
      );
      return;
    }

    setLoading(true);

    const identifier = `91${mobile}`;

    console.log(
      "Sending OTP to:",
      `******${mobile.slice(-4)}`
    );

    window.sendOtp(
      identifier,

      (data) => {
        console.log(
          "MSG91 OTP SENT:",
          data
        );

        setOtpSent(true);
        setMessage(
          "OTP sent successfully to your mobile number."
        );

        setLoading(false);
      },

      (error) => {
        console.error(
          "MSG91 SEND OTP ERROR:",
          error
        );

        setError(
          "OTP could not be sent. Please try again."
        );

        setLoading(false);
      }
    );
  };

  // =====================================================
  // VERIFY OTP
  // =====================================================

  const handleVerifyOtp = () => {
    if (loading) {
      return;
    }

    setError("");
    setMessage("");

    if (!/^\d{4}$/.test(otp)) {
      setError("Please enter the 6-digit OTP.");
      return;
    }

    if (
      typeof window.verifyOtp !== "function"
    ) {
      setError(
        "OTP service is not ready. Please refresh the page and try again."
      );

      console.error(
        "MSG91 verifyOtp method is not available."
      );

      return;
    }

    setLoading(true);

    window.verifyOtp(
      Number(otp),

      async (data) => {
        console.log(
          "MSG91 OTP VERIFIED:",
          data
        );

        try {
          /*
           * MSG91 returns the verified access token
           * after successful OTP verification.
           */

          const accessToken =
            typeof data === "string"
              ? data
              : data?.accessToken ||
                data?.["access-token"] ||
                data?.token ||
                data?.data?.accessToken ||
                data?.data?.["access-token"] ||
                data?.data?.token;

          if (!accessToken) {
            console.error(
              "MSG91 response does not contain access token:",
              data
            );

            throw new Error(
              "MSG91 access token was not received."
            );
          }

          // =================================================
          // SEND MSG91 TOKEN TO ENJOMEAL BACKEND
          // =================================================

          const response = await API.post(
            "/auth/otp-login",
            {
              accessToken,
            }
          );

          console.log(
            "ENJOMEAL OTP LOGIN RESPONSE:",
            response.data
          );

          const {
            token,
            user,
          } = response.data;

          if (!token) {
            throw new Error(
              "EnjoMeal authentication token was not received."
            );
          }

          if (!user) {
            throw new Error(
              "User information was not received."
            );
          }

          // =================================================
          // CUSTOMER ROLE CHECK
          // =================================================

          if (
            user.role &&
            user.role !== "customer"
          ) {
            throw new Error(
              "This account cannot be used in the Customer Panel."
            );
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
            "CUSTOMER OTP LOGIN SUCCESS"
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
            "ENJOMEAL OTP LOGIN ERROR:",
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
              "OTP login failed. Please try again."
          );
        } finally {
          setLoading(false);
        }
      },

      (error) => {
        console.error(
          "MSG91 VERIFY OTP ERROR:",
          error
        );

        setError(
          "Invalid OTP or OTP verification failed."
        );

        setLoading(false);
      }
    );
  };

  // =====================================================
  // RESEND OTP
  // =====================================================

  const handleResendOtp = () => {
    if (loading) {
      return;
    }

    setError("");
    setMessage("");

    if (
      typeof window.retryOtp !== "function"
    ) {
      setError(
        "Resend service is not ready. Please refresh the page."
      );

      return;
    }

    setLoading(true);

    window.retryOtp(
      null,

      (data) => {
        console.log(
          "MSG91 OTP RESENT:",
          data
        );

        setMessage(
          "OTP resent successfully."
        );

        setLoading(false);
      },

      (error) => {
        console.error(
          "MSG91 RESEND OTP ERROR:",
          error
        );

        setError(
          "OTP could not be resent. Please try again."
        );

        setLoading(false);
      }
    );
  };

  // =====================================================
  // CHANGE NUMBER
  // =====================================================

  const handleChangeNumber = () => {
    setOtpSent(false);
    setOtp("");
    setError("");
    setMessage("");
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
      <div
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
          Welcome to ENJOMEAL
        </h2>

        <p
          style={{
            color: "#777",
            marginTop: 0,
            marginBottom: "26px",
          }}
        >
          Login with your mobile number
        </p>

        {/* =================================================
            MOBILE NUMBER
        ================================================= */}

        <label
          htmlFor="login-mobile"
          style={{
            display: "block",
            fontWeight: "600",
          }}
        >
          Mobile Number
        </label>

        <div
          style={{
            display: "flex",
            gap: "8px",
            marginTop: "7px",
            marginBottom: "18px",
          }}
        >
          <div
            style={{
              padding: "13px 12px",
              border: "1px solid #ddd",
              borderRadius: "10px",
              background: "#f7f7f7",
              fontWeight: "600",
            }}
          >
            +91
          </div>

          <input
            id="login-mobile"
            type="tel"
            value={mobile}
            onChange={handleMobileChange}
            placeholder="Enter 10-digit mobile number"
            autoComplete="tel"
            inputMode="numeric"
            maxLength={10}
            disabled={loading || otpSent}
            style={{
              flex: 1,
              minWidth: 0,
              padding: "13px",
              boxSizing: "border-box",
              border: "1px solid #ddd",
              borderRadius: "10px",
              outline: "none",
            }}
          />
        </div>

        {/* =================================================
            SEND OTP
        ================================================= */}

        {!otpSent && (
          <button
            type="button"
            onClick={handleSendOtp}
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
              ? "Sending OTP..."
              : "Send OTP"}
          </button>
        )}

        {/* =================================================
            OTP SECTION
        ================================================= */}

        {otpSent && (
          <>
            <label
              htmlFor="login-otp"
              style={{
                display: "block",
                fontWeight: "600",
                marginBottom: "7px",
              }}
            >
              Enter OTP
            </label>

            <input
              id="login-otp"
              type="tel"
              value={otp}
              onChange={handleOtpChange}
              placeholder="Enter 4-digit OTP"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={4}
              disabled={loading}
              style={{
                width: "100%",
                padding: "13px",
                boxSizing: "border-box",
                border: "1px solid #ddd",
                borderRadius: "10px",
                outline: "none",
                letterSpacing: "4px",
                textAlign: "center",
                fontSize: "18px",
              }}
            />

            {/* VERIFY */}

            <button
              type="button"
              onClick={handleVerifyOtp}
              disabled={loading}
              style={{
                width: "100%",
                padding: "14px",
                marginTop: "16px",
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
                ? "Verifying..."
                : "Verify OTP & Login"}
            </button>

            {/* RESEND */}

            <button
              type="button"
              onClick={handleResendOtp}
              disabled={loading}
              style={{
                width: "100%",
                marginTop: "12px",
                padding: "10px",
                border: "none",
                background: "transparent",
                color: "#e85d04",
                fontWeight: "600",
                cursor: loading
                  ? "not-allowed"
                  : "pointer",
              }}
            >
              Resend OTP
            </button>

            {/* CHANGE NUMBER */}

            <button
              type="button"
              onClick={handleChangeNumber}
              disabled={loading}
              style={{
                width: "100%",
                padding: "10px",
                border: "none",
                background: "transparent",
                color: "#777",
                fontWeight: "600",
                cursor: loading
                  ? "not-allowed"
                  : "pointer",
              }}
            >
              Change Mobile Number
            </button>
          </>
        )}

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
              textAlign: "center",
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
              textAlign: "center",
            }}
          >
            {error}
          </p>
        )}
      </div>
    </div>
  );
}

export default Login;
