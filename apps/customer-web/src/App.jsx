import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
} from "react-router-dom";

// =====================================================
// PAGES
// =====================================================

import Login from "./pages/Login";
import CustomerRegister from "./pages/CustomerRegister";

import RestaurantList from "./pages/RestaurantList";
import RestaurantDetails from "./pages/RestaurantDetails";

import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";

import OrderDetails from "./pages/OrderDetails";
import MyOrders from "./pages/MyOrders";

import Notifications from "./pages/Notifications";
import CustomerProfile from "./pages/CustomerProfile";

// =====================================================
// CONSTANTS
// =====================================================

const TOKEN_KEY = "enjoMealToken";

// =====================================================
// AUTH HELPERS
// =====================================================

function isAuthenticated() {
  return Boolean(localStorage.getItem(TOKEN_KEY));
}

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
// PUBLIC ONLY ROUTE
// Logged-in customer should not access
// Login / Register pages
// =====================================================

function PublicOnlyRoute({ children }) {
  if (isAuthenticated()) {
    return (
      <Navigate
        to="/restaurants"
        replace
      />
    );
  }

  return children;
}

// =====================================================
// PROTECTED ROUTE
// =====================================================

function ProtectedRoute({ children }) {
  if (!isAuthenticated()) {
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

        {/* =================================================
            ROOT
        ================================================= */}

        <Route
          path="/"
          element={
            isAuthenticated() ? (
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
          element={
            <PublicOnlyRoute>
              <LoginPage />
            </PublicOnlyRoute>
          }
        />

        {/* =================================================
            CUSTOMER REGISTER
        ================================================= */}

        <Route
          path="/register"
          element={
            <PublicOnlyRoute>
              <CustomerRegister />
            </PublicOnlyRoute>
          }
        />

        {/* =================================================
            RESTAURANTS
        ================================================= */}

        <Route
          path="/restaurants"
          element={
            <ProtectedRoute>
              <RestaurantList />
            </ProtectedRoute>
          }
        />

        {/* =================================================
            RESTAURANT DETAILS / MENU
        ================================================= */}

        <Route
          path="/restaurants/:restaurantId"
          element={
            <ProtectedRoute>
              <RestaurantDetails />
            </ProtectedRoute>
          }
        />

        {/* =================================================
            CART
        ================================================= */}

        <Route
          path="/cart"
          element={
            <ProtectedRoute>
              <Cart />
            </ProtectedRoute>
          }
        />

        {/* =================================================
            CHECKOUT
        ================================================= */}

        <Route
          path="/checkout"
          element={
            <ProtectedRoute>
              <Checkout />
            </ProtectedRoute>
          }
        />

        {/* =================================================
            MY ORDERS
        ================================================= */}

        <Route
          path="/my-orders"
          element={
            <ProtectedRoute>
              <MyOrders />
            </ProtectedRoute>
          }
        />

        {/* =================================================
            ORDER DETAILS
        ================================================= */}

        <Route
          path="/orders/:orderId"
          element={
            <ProtectedRoute>
              <OrderDetails />
            </ProtectedRoute>
          }
        />

        {/* =================================================
            NOTIFICATIONS
        ================================================= */}

        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
              <Notifications />
            </ProtectedRoute>
          }
        />

        {/* =================================================
            CUSTOMER PROFILE
        ================================================= */}

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <CustomerProfile />
            </ProtectedRoute>
          }
        />

        {/* =================================================
            UNKNOWN ROUTE
        ================================================= */}

        <Route
          path="*"
          element={
            <Navigate
              to="/"
              replace
            />
          }
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;
