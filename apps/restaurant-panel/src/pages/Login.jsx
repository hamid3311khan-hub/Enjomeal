import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/api";

function Login() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (event) => {
    setFormData({
      ...formData,
      [event.target.name]: event.target.value,
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setLoading(true);
      setError("");

      // =====================================================
      // 1. LOGIN
      // =====================================================

      const response = await API.post("/auth/login", {
        email: formData.email,
        password: formData.password,
      });

      if (!response.data.success) {
        setError("Login failed.");
        return;
      }

      const { token, user } = response.data;

      // =====================================================
      // 2. RESTAURANT ACCOUNT CHECK
      // =====================================================

      if (user?.role !== "restaurant") {
        setError(
          "This account is not registered as a restaurant."
        );
        return;
      }

      // =====================================================
      // 3. SAVE LOGIN DATA
      // =====================================================

      localStorage.setItem(
        "enjoMealRestaurantToken",
        token
      );

      localStorage.setItem(
        "enjoMealRestaurantUser",
        JSON.stringify(user)
      );

      // =====================================================
      // 4. GET RESTAURANT PROFILE
      // =====================================================

      const restaurantResponse = await API.get(
        "/restaurants/my-restaurant",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!restaurantResponse.data.success) {
        setError(
          "Restaurant profile could not be found."
        );

        localStorage.removeItem(
          "enjoMealRestaurantToken"
        );

        localStorage.removeItem(
          "enjoMealRestaurantUser"
        );

        return;
      }

      const restaurant =
        restaurantResponse.data.restaurant;

      // =====================================================
      // 5. RESTAURANT APPROVAL CHECK
      // =====================================================

      if (
        restaurant.approvalStatus !== "APPROVED" ||
        !restaurant.isActive
      ) {
        setError(
          "Your restaurant is pending admin approval."
        );

        localStorage.removeItem(
          "enjoMealRestaurantToken"
        );

        localStorage.removeItem(
          "enjoMealRestaurantUser"
        );

        return;
      }

      // =====================================================
      // 6. SAVE RESTAURANT DATA
      // =====================================================

      localStorage.setItem(
        "enjoMealRestaurantId",
        restaurant._id
      );

      localStorage.setItem(
        "enjoMealRestaurant",
        JSON.stringify(restaurant)
      );

      // =====================================================
      // 7. GO TO DASHBOARD
      // =====================================================

      navigate("/dashboard", {
        replace: true,
      });
    } catch (err) {
      console.error(
        "Restaurant Login Error:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Login failed. Please check your email and password."
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
        background: "#fff8f3",
        padding: "20px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "420px",
          padding: "30px",
          background: "#fff",
          border: "1px solid #ddd",
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

        <h2
          style={{
            textAlign: "center",
            marginBottom: "25px",
          }}
        >
          Restaurant Login
        </h2>

        {error && (
          <p
            style={{
              color: "#dc3545",
              background: "#ffe5e5",
              padding: "10px",
              borderRadius: "8px",
            }}
          >
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit}>
          <label>Email</label>

          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Enter restaurant email"
            required
            style={{
              width: "100%",
              padding: "12px",
              marginTop: "7px",
              marginBottom: "18px",
              boxSizing: "border-box",
              border: "1px solid #ddd",
              borderRadius: "8px",
            }}
          />

          <label>Password</label>

          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Enter password"
            required
            style={{
              width: "100%",
              padding: "12px",
              marginTop: "7px",
              marginBottom: "20px",
              boxSizing: "border-box",
              border: "1px solid #ddd",
              borderRadius: "8px",
            }}
          />
<<<<<<< HEAD
          <button
=======
         <button
>>>>>>> ec25301 (Fix restaurant login forgot password placement)
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "14px",
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
            {loading
              ? "Logging in..."
              : "Login"}
          </button>
		    <button
  type="button"
  onClick={() => navigate("/forgot-password")}
  style={{
    marginTop: "10px",
    border: "none",
    background: "transparent",
    color: "#e85d04",
    cursor: "pointer",
    fontWeight: "600",
  }}
>
  Forgot Password?
</button>
        </form>
	<button
  type="button"
  onClick={() => navigate("/forgot-password")}
  style={{
    marginTop: "10px",
    border: "none",
    background: "transparent",
    color: "#e85d04",
    cursor: "pointer",
    fontWeight: "600",
  }}
>
  Forgot Password?
          </button>
        <p
          style={{
            textAlign: "center",
            marginTop: "18px",
          }}
        >
          New restaurant?{" "}

          <button
            type="button"
            onClick={() =>
              navigate("/register")
            }
            style={{
              border: "none",
              background: "none",
              color: "#e85d04",
              fontWeight: "700",
              cursor: "pointer",
            }}
          >
            Register Restaurant
          </button>
        </p>
      </div>
    </div>
  );
}

export default Login;
