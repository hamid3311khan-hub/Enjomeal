import { useState } from "react";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (event) => {
    event.preventDefault();

    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "https://enjomeal-api.onrender.com/api/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Login failed."
        );
      }

      // ===============================
      // ROLE CHECK
      // ===============================

      if (data.user?.role !== "delivery") {
        setError(
          "Access denied. Delivery partner account required."
        );
        return;
      }

      // ===============================
      // SAVE DELIVERY TOKEN
      // ===============================

      localStorage.setItem(
        "enjoMealDeliveryToken",
        data.token
      );

      // Save user information
      localStorage.setItem(
        "enjoMealDeliveryUser",
        JSON.stringify(data.user)
      );

      console.log(
        "Delivery login successful:",
        data.user
      );

      // Success message
      alert("Delivery login successful.");
      
      // Go to delivery dashboard or home page
      window.location.href = "/delivery/dashboard";

    } catch (error) {
      console.error(
        "Delivery Login Error:",
        error
      );

      setError(
        error.message || "Login failed."
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
        background: "#f8f9fa",
        padding: "20px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "420px",
          background: "#fff",
          padding: "30px",
          borderRadius: "12px",
          boxShadow:
            "0 4px 15px rgba(0,0,0,0.08)",
        }}
      >
        <h1
          style={{
            textAlign: "center",
            marginBottom: "8px",
          }}
        >
          EnjoMeal
        </h1>

        <p
          style={{
            textAlign: "center",
            color: "#666",
            marginBottom: "25px",
          }}
        >
          Delivery Partner Login
        </p>

        {/* ERROR */}

        {error && (
          <div
            style={{
              background: "#ffe5e5",
              color: "#dc3545",
              padding: "10px",
              borderRadius: "8px",
              marginBottom: "18px",
              fontSize: "14px",
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <label>Email</label>

          <input
            type="email"
            value={email}
            onChange={(event) =>
              setEmail(event.target.value)
            }
            placeholder="Enter email"
            required
            disabled={loading}
            style={{
              width: "100%",
              padding: "12px",
              marginTop: "6px",
              marginBottom: "18px",
              border: "1px solid #ddd",
              borderRadius: "8px",
              boxSizing: "border-box",
            }}
          />

          <label>Password</label>

          <input
            type="password"
            value={password}
            onChange={(event) =>
              setPassword(event.target.value)
            }
            placeholder="Enter password"
            required
            disabled={loading}
            style={{
              width: "100%",
              padding: "12px",
              marginTop: "6px",
              marginBottom: "20px",
              border: "1px solid #ddd",
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
              background: loading
                ? "#aaa"
                : "#e85d04",
              color: "#fff",
              fontWeight: "700",
              cursor: loading
                ? "not-allowed"
                : "pointer",
            }}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;