import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
} from "react-router-dom";

import Login from "./pages/Login";
import CustomerRegister from "./pages/CustomerRegister";
import RestaurantList from "./pages/RestaurantList";
import RestaurantDetails from "./pages/RestaurantDetails";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import OrderDetails from "./pages/OrderDetails";
import MyOrders from "./pages/MyOrders";
import Notifications from "./pages/Notifications";

// =====================================================
// LOGIN PAGE
// =====================================================

function LoginPage() {
  const navigate = useNavigate();

  const handleLogin = () => {
    navigate("/restaurants", {
      replace: true,
    });
  };

  return <Login onLogin={handleLogin} />;
}

// =====================================================
// AUTH PROTECTED ROUTE
// =====================================================

function ProtectedRoute({ children }) {
  const token = localStorage.getItem("enjoMealToken");

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

// =====================================================
// APP
// =====================================================

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* ROOT */}
        <Route
  path="/"
  element={
    localStorage.getItem("enjoMealToken") ? (
      <Navigate to="/restaurants" replace />
    ) : (
      <Navigate to="/login" replace />
    )
  }
/>

        {/* LOGIN */}
        <Route
          path="/login"
          element={<LoginPage />}
        />

        {/* CUSTOMER REGISTER */}
        <Route
          path="/register"
          element={<CustomerRegister />}
        />

        {/* RESTAURANT LIST */}
        <Route
          path="/restaurants"
          element={
            <ProtectedRoute>
              <RestaurantList />
            </ProtectedRoute>
          }
        />

        {/* RESTAURANT MENU */}
        <Route
          path="/restaurants/:restaurantId"
          element={
            <ProtectedRoute>
              <RestaurantDetails />
            </ProtectedRoute>
          }
        />

        {/* CART */}
        <Route
          path="/cart"
          element={
            <ProtectedRoute>
              <Cart />
            </ProtectedRoute>
          }
        />

        {/* CHECKOUT */}
        <Route
          path="/checkout"
          element={
            <ProtectedRoute>
              <Checkout />
            </ProtectedRoute>
          }
        />

        {/* ORDER DETAILS */}
        <Route
          path="/orders/:orderId"
          element={
            <ProtectedRoute>
              <OrderDetails />
            </ProtectedRoute>
          }
        />

        {/* MY ORDERS */}
        <Route
          path="/my-orders"
          element={
            <ProtectedRoute>
              <MyOrders />
            </ProtectedRoute>
          }
        />

        {/* NOTIFICATIONS */}
        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
              <Notifications />
            </ProtectedRoute>
          }
        />

        {/* UNKNOWN ROUTE */}
        <Route
          path="*"
          element={
            <Navigate
              to="/login"
              replace
            />
          }
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;