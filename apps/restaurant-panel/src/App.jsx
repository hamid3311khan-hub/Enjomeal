import { BrowserRouter, Routes, Route, Navigate, useNavigate
} from "react-router-dom";

import Login from "./pages/Login";
import RestaurantRegister from "./pages/RestaurantRegister";
import Orders from "./pages/Orders";
import Menu from "./pages/Menu";
import ForgotPassword from "./pages/ForgotPassword";
import VerifyResetOTP from "./pages/VerifyResetOTP";
import ResetPassword from "./pages/ResetPassword";
import RestaurantReports from "./pages/RestaurantReports";

function ProtectedRoute({ children }) {
  const token = localStorage.getItem(
    "enjoMealRestaurantToken"
  );

  if (!token) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  return children;
}

function Dashboard() {
    const navigate = useNavigate();
    const user = JSON.parse(
    localStorage.getItem(
      "enjoMealRestaurantUser"
    ) || "null"
  );

  const handleLogout = () => {
    localStorage.removeItem(
      "enjoMealRestaurantToken"
    );

    localStorage.removeItem(
      "enjoMealRestaurantUser"
    );

    navigate("/login");
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "30px",
        background: "#fff8f3",
      }}
    >
      <h1>Restaurant Dashboard</h1>

      <p>
        Welcome{" "}
        <strong>
          {user?.name || "Restaurant"}
        </strong>
      </p>

      <p style={{ color: "#666", marginTop: "8px" }}>
  Your dashboard is ready to manage your Menu, Incoming Orders, and Business Growth.
</p>

{/* DASHBOARD ACTIONS */}
<div
  style={{
    width: "100%",
    maxWidth: "760px",
    margin: "25px auto 0",
    display: "grid",
    gridTemplateColumns:
      "repeat(2, minmax(0, 1fr))",
    gap: "12px",
  }}
>
  {/* Manage Orders */}
  <button
    onClick={() => navigate("/orders")}
    style={{
      width: "100%",
      padding: "14px 12px",
      border: "none",
      borderRadius: "10px",
      background: "#e85d04",
      color: "#fff",
      fontWeight: "700",
      fontSize: "16px",
      cursor: "pointer",
    }}
  >
    Manage Orders
  </button>

  {/* View Orders */}
  <button
    onClick={() => navigate("/orders")}
    style={{
      width: "100%",
      padding: "14px 12px",
      border: "none",
      borderRadius: "10px",
      background: "#e85d04",
      color: "#fff",
      fontWeight: "700",
      fontSize: "16px",
      cursor: "pointer",
    }}
  >
    View Orders
  </button>

  {/* Manage Menu */}
  <button
    onClick={() => navigate("/menu")}
    style={{
      width: "100%",
      padding: "14px 12px",
      border: "none",
      borderRadius: "10px",
      background: "#e85d04",
      color: "#fff",
      fontWeight: "700",
      fontSize: "16px",
      cursor: "pointer",
    }}
  >
    Manage Menu
  </button>

  {/* Business Report */}
  <button
    onClick={() => navigate("/reports")}
    style={{
      width: "100%",
      padding: "14px 12px",
      border: "none",
      borderRadius: "10px",
      background: "#198754",
      color: "#fff",
      fontWeight: "700",
      fontSize: "16px",
      cursor: "pointer",
    }}
  >
    Business Report
  </button>

  {/* Logout */}
  <button
    onClick={handleLogout}
    style={{
      gridColumn: "1 / -1",
      justifySelf: "center",
      width: "220px",
      padding: "14px 20px",
      border: "none",
      borderRadius: "10px",
      background: "#dc3545",
      color: "#fff",
      fontWeight: "700",
      fontSize: "16px",
      cursor: "pointer",
    }}
  >
    Logout
  </button>
</div>
   </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Login */}
        <Route
          path="/login"
          element={<Login />}
        />
	<Route
  path="/forgot-password"
  element={<ForgotPassword />}
/>

<Route
  path="/verify-reset-otp"
  element={<VerifyResetOTP />}
/>

<Route
  path="/reset-password"
  element={<ResetPassword />}
/>

        {/* Restaurant Registration */}
        <Route
          path="/register"
          element={<RestaurantRegister />}
        />

        {/* Dashboard */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* Orders */}
        <Route
          path="/orders"
          element={
            <ProtectedRoute>
              <Orders />
            </ProtectedRoute>
          }
        />

        {/* Root */}
        <Route
          path="/"
          element={
            <Navigate
              to="/login"
              replace
            />
          }
        />

        {/* Unknown route */}
        <Route
          path="*"
          element={
            <Navigate
              to="/login"
              replace
            />
          }
        />
        {/* Menu */}
        <Route
          path="/menu"
          element={
            <ProtectedRoute>
              <Menu />
            </ProtectedRoute>
          }
        />

		  {/* Restaurant Business Report */}
<Route
  path="/reports"
  element={
    <ProtectedRoute>
      <RestaurantReports />
    </ProtectedRoute>
  }
/>

      </Routes>
    </BrowserRouter>
  );
}

export default App;
