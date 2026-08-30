import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
} from "react-router-dom";

import Login from "./pages/Login";
import CustomerRegister from "./pages/CustomerRegister";

import ForgotPassword from "./pages/ForgotPassword";
import VerifyResetOTP from "./pages/VerifyResetOTP";
import ResetPassword from "./pages/ResetPassword";

import RestaurantList from "./pages/RestaurantList";
import RestaurantDetails from "./pages/RestaurantDetails";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import OrderDetails from "./pages/OrderDetails";
import MyOrders from "./pages/MyOrders";
import Notifications from "./pages/Notifications";
import CustomerProfile from "./pages/CustomerProfile";

import CustomerLayout from "./components/CustomerLayout";
import Coupons from "./pages/Coupons";

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
// CUSTOMER LAYOUT ROUTE
// =====================================================

function CustomerProtectedLayout() {
  return (
    <ProtectedRoute>
      <CustomerLayout />
    </ProtectedRoute>
  );
}

// =====================================================
// APP
// =====================================================

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* =================================================
            ROOT
           ================================================= */}

        <Route
          path="/"
          element={
            localStorage.getItem("enjoMealToken") ? (
              <Navigate
                to="/restaurants"
                replace
              />
            ) : (
              <Navigate
                to="/login"
                replace
              />
            )
          }
        />

        {/* =================================================
            LOGIN
           ================================================= */}

        <Route
          path="/login"
          element={<LoginPage />}
        />

        {/* =================================================
            CUSTOMER REGISTER
           ================================================= */}

        <Route
          path="/register"
          element={<CustomerRegister />}
        />

        {/* =================================================
            PASSWORD RESET
            PUBLIC ROUTES
           ================================================= */}

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

        {/* =================================================
            PROTECTED CUSTOMER AREA
           ================================================= */}

        <Route
          element={<CustomerProtectedLayout />}
        >

          {/* RESTAURANT LIST */}

          <Route
            path="/restaurants"
            element={<RestaurantList />}
          />

          {/* RESTAURANT MENU */}

          <Route
            path="/restaurants/:restaurantId"
            element={<RestaurantDetails />}
          />

          {/* CART */}

          <Route
            path="/cart"
            element={<Cart />}
          />

          {/* CHECKOUT */}

          <Route
            path="/checkout"
            element={<Checkout />}
          />

          {/* ORDER DETAILS */}

          <Route
            path="/orders/:orderId"
            element={<OrderDetails />}
          />

          {/* MY ORDERS */}

          <Route
            path="/my-orders"
            element={<MyOrders />}
          />

          {/* NOTIFICATIONS */}

          <Route
            path="/notifications"
            element={<Notifications />}
          />
	 {/* COUPONS */}
<Route
  path="/coupons"
  element={<Coupons />}
/>


          {/* CUSTOMER PROFILE */}

          <Route
            path="/profile"
            element={<CustomerProfile />}
          />

        </Route>

        {/* =================================================
            UNKNOWN ROUTE
           ================================================= */}

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
