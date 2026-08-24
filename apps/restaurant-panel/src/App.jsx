import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Login from "./pages/Login";
import RestaurantRegister from "./pages/RestaurantRegister";
import Orders from "./pages/Orders";
import Menu from "./pages/Menu";

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

    window.location.href = "/login";
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

      <p>Restaurant Panel is ready.</p>

      {/* Manage Orders */}
      <button
        onClick={() => {
          window.location.href = "/orders";
        }}
        style={{
          padding: "12px 20px",
          marginRight: "10px",
          border: "none",
          borderRadius: "8px",
          background: "#e85d04",
          color: "#fff",
          fontWeight: "700",
          cursor: "pointer",
        }}
      >
        Manage Orders
      </button>

      {/* View Orders */}
      <button
        onClick={() => {
          window.location.href = "/orders";
        }}
        style={{
          padding: "12px 20px",
          marginRight: "10px",
          border: "none",
          borderRadius: "8px",
          background: "#e85d04",
          color: "#fff",
          fontWeight: "700",
          cursor: "pointer",
        }}
      >
        View Orders
      </button>
        
        <button
        onClick={() => {
          window.location.href = "/menu";
      }}
      style={{
        padding: "12px 20px",
        marginRight: "10px",
        border: "none",
        borderRadius: "8px",
        background: "#e85d04",
        color: "#fff",
        fontWeight: "700",
        cursor: "pointer",
      }}
    >
        Manage Menu
      </button>
        

      {/* Logout */}
      <button
        onClick={handleLogout}
        style={{
          padding: "12px 20px",
          border: "none",
          borderRadius: "8px",
          background: "#dc3545",
          color: "#fff",
          fontWeight: "700",
          cursor: "pointer",
        }}
      >
        Logout
      </button>
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

      </Routes>
    </BrowserRouter>
  );
}

export default App;