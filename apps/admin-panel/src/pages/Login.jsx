import { useState } from "react";

function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();

    setError("");

    // =====================================
    // BASIC VALIDATION
    // =====================================

    if (!email.trim() || !password) {
      setError(
        "Email and password are required."
      );

      return;
    }

    try {
      setLoading(true);

      // =====================================
      // LOGIN API
      // =====================================

      const response = await fetch(
        "https://enjomeal-api.onrender.com/api/auth/login",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            email: email.trim(),
            password,
          }),
        }
      );

      // =====================================
      // READ RESPONSE
      // =====================================

      const data =
        await response.json();

      console.log(
        "Login API Response:",
        data
      );

      // =====================================
      // API ERROR
      // =====================================

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Login failed."
        );
      }

      // =====================================
      // TOKEN CHECK
      // =====================================

      if (
        !data.token ||
        typeof data.token !==
          "string"
      ) {
        throw new Error(
          "Login successful but authentication token was not received."
        );
      }

      // =====================================
      // USER CHECK
      // =====================================

      if (!data.user) {
        throw new Error(
          "Login successful but user information was not received."
        );
      }

      // =====================================
      // ADMIN CHECK
      // =====================================

      if (
        data.user.role !== "admin"
      ) {
        throw new Error(
          "Only admin users can access this panel."
        );
      }

      // =====================================
      // CLEAR OLD AUTH DATA
      // =====================================

      localStorage.removeItem(
        "enjoMealToken"
      );

      localStorage.removeItem(
        "enjoMealToken"
      );

      localStorage.removeItem(
        "enjoMealUser"
      );

      // =====================================
      // SAVE NEW JWT TOKEN
      // IMPORTANT:
      // USE EXACT SAME KEY EVERYWHERE
      // =====================================

      localStorage.setItem(
        "enjoMealToken",
        data.token
      );

      // =====================================
      // SAVE LOGGED-IN USER
      // =====================================

      localStorage.setItem(
        "enjoMealUser",
        JSON.stringify(data.user)
      );

      // =====================================
      // VERIFY TOKEN WAS SAVED
      // =====================================

      const savedToken =
        localStorage.getItem(
          "enjoMealToken"
        );

      if (
        !savedToken ||
        savedToken !== data.token
      ) {
        throw new Error(
          "Authentication token could not be saved."
        );
      }

      // =====================================
      // VERIFY USER WAS SAVED
      // =====================================

      const savedUser =
        localStorage.getItem(
          "enjoMealUser"
        );

      if (!savedUser) {
        throw new Error(
          "User information could not be saved."
        );
      }

      console.log(
        "JWT token saved successfully."
      );

      console.log(
        "Token length:",
        savedToken.length
      );

      console.log(
        "Admin user saved successfully."
      );

      // =====================================
      // NOTIFY APP.JSX
      // SEND BOTH USER + TOKEN
      // =====================================

      if (onLoginSuccess) {
        onLoginSuccess(
          data.user,
          data.token
        );
      }

    } catch (error) {
      console.error(
        "Login Error:",
        error
      );

      setError(
        error.message ||
          "Login failed."
      );

      // =====================================
      // REMOVE INVALID LOGIN DATA
      // =====================================

      localStorage.removeItem(
        "enjoMealToken"
      );

      localStorage.removeItem(
        "enjoMealToken"
      );

      localStorage.removeItem(
        "enjoMealUser"
      );

    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>

      <div style={styles.loginCard}>

        {/* LOGO */}

        <div style={styles.logo}>
          EnjoMeal
        </div>

        <div style={styles.adminText}>
          ADMIN PANEL
        </div>

        <h2 style={styles.title}>
          Admin Login
        </h2>

        <p style={styles.subtitle}>
          Login to manage EnjoMeal platform
        </p>

        {/* ERROR */}

        {error && (
          <div style={styles.error}>
            {error}
          </div>
        )}

        {/* LOGIN FORM */}

        <form
          onSubmit={handleLogin}
        >

          {/* EMAIL */}

          <div
            style={styles.formGroup}
          >

            <label
              style={styles.label}
            >
              Email
            </label>

            <input
              type="email"
              placeholder="Enter admin email"
              value={email}
              onChange={(e) =>
                setEmail(
                  e.target.value
                )
              }
              style={styles.input}
              disabled={loading}
              autoComplete="email"
            />

          </div>

          {/* PASSWORD */}

          <div
            style={styles.formGroup}
          >

            <label
              style={styles.label}
            >
              Password
            </label>

            <input
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) =>
                setPassword(
                  e.target.value
                )
              }
              style={styles.input}
              disabled={loading}
              autoComplete="current-password"
            />

          </div>

          {/* LOGIN BUTTON */}

          <button
            type="submit"
            style={{
              ...styles.loginButton,

              ...(loading
                ? styles.disabledButton
                : {}),
            }}
            disabled={loading}
          >
            {loading
              ? "Logging in..."
              : "Login"}
          </button>

        </form>

      </div>

    </div>
  );
}


// =====================================================
// STYLES
// =====================================================

const styles = {

  // =============================================
  // PAGE
  // =============================================

  page: {
    minHeight: "100vh",
    width: "100%",

    display: "flex",

    justifyContent:
      "center",

    alignItems:
      "center",

    background: "#f5f7fb",

    padding: "20px",

    boxSizing: "border-box",
  },


  // =============================================
  // LOGIN CARD
  // =============================================

  loginCard: {
    width: "100%",

    maxWidth: "420px",

    background: "#ffffff",

    borderRadius: "14px",

    padding: "35px",

    boxSizing: "border-box",

    boxShadow:
      "0 10px 30px rgba(0, 0, 0, 0.08)",

    border:
      "1px solid #e5e7eb",
  },


  // =============================================
  // LOGO
  // =============================================

  logo: {
    textAlign: "center",

    color: "#2563eb",

    fontSize: "30px",

    fontWeight: "bold",
  },


  adminText: {
    textAlign: "center",

    color: "#6b7280",

    fontSize: "11px",

    letterSpacing: "2px",

    marginTop: "4px",

    marginBottom: "25px",
  },


  // =============================================
  // TITLE
  // =============================================

  title: {
    margin: 0,

    textAlign: "center",

    fontSize: "24px",

    color: "#111827",
  },


  subtitle: {
    textAlign: "center",

    color: "#6b7280",

    fontSize: "13px",

    marginTop: "8px",

    marginBottom: "25px",
  },


  // =============================================
  // ERROR
  // =============================================

  error: {
    background: "#fee2e2",

    color: "#b91c1c",

    border:
      "1px solid #fecaca",

    borderRadius: "8px",

    padding: "12px",

    fontSize: "13px",

    marginBottom: "18px",
  },


  // =============================================
  // FORM GROUP
  // =============================================

  formGroup: {
    marginBottom: "18px",
  },


  // =============================================
  // LABEL
  // =============================================

  label: {
    display: "block",

    fontSize: "13px",

    fontWeight: "600",

    color: "#374151",

    marginBottom: "7px",
  },


  // =============================================
  // INPUT
  // =============================================

  input: {
    width: "100%",

    height: "45px",

    padding: "0 12px",

    border:
      "1px solid #d1d5db",

    borderRadius: "8px",

    fontSize: "14px",

    outline: "none",

    boxSizing: "border-box",
  },


  // =============================================
  // LOGIN BUTTON
  // =============================================

  loginButton: {
    width: "100%",

    height: "45px",

    border: "none",

    borderRadius: "8px",

    background: "#2563eb",

    color: "#ffffff",

    fontSize: "15px",

    fontWeight: "600",

    cursor: "pointer",

    marginTop: "5px",
  },


  // =============================================
  // DISABLED BUTTON
  // =============================================

  disabledButton: {
    opacity: 0.7,

    cursor: "not-allowed",
  },
};


export default Login;