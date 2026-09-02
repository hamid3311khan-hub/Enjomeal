import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import "./Header.css";

function Header({ unreadCount = 0 }) {
  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = useState(false);

  const user = JSON.parse(
    localStorage.getItem("enjoMealUser") || "null"
  );

  const handleLogout = () => {
    localStorage.removeItem("enjoMealToken");
    localStorage.removeItem("enjoMealUser");

    setMenuOpen(false);

    navigate("/login", {
      replace: true,
    });
  };

  const closeMenu = () => {
    setMenuOpen(false);
  };

  return (
    <header className="customer-header">
      <div className="header-container">

        {/* BRAND */}
        <button
          className="brand"
          onClick={() => navigate("/restaurants")}
        >
          <span className="brand-icon">🍴</span>

          <span className="brand-text">
            Enjo<span>Meal</span>
          </span>
        </button>

        {/* DESKTOP NAVIGATION */}
        <nav className="desktop-nav">

          <NavLink
            to="/restaurants"
            className={({ isActive }) =>
              isActive
                ? "nav-link active"
                : "nav-link"
            }
          >
            Restaurants
          </NavLink>

          <NavLink
            to="/my-orders"
            className={({ isActive }) =>
              isActive
                ? "nav-link active"
                : "nav-link"
            }
          >
            Orders
          </NavLink>

          <NavLink
            to="/coupons"
            className={({ isActive }) =>
              isActive
                ? "nav-link active"
                : "nav-link"
            }
          >
            🎟️ Coupons
          </NavLink>

          <NavLink
            to="/notifications"
            className={({ isActive }) =>
              isActive
                ? "nav-icon-link active"
                : "nav-icon-link"
            }
          >
            <NavLink
  to="/support"
  className={({ isActive }) =>
    isActive
      ? "nav-link active"
      : "nav-link"
  }
>
  🛟 Support
</NavLink>
            <NavLink
  to="/my-tickets"
  className={({ isActive }) =>
    isActive
      ? "nav-link active"
      : "nav-link"
  }
>
  🎫 My Tickets
</NavLink>
            <span className="notification-icon">
              🔔

              {unreadCount > 0 && (
                <span className="notification-badge">
                  {unreadCount > 99
                    ? "99+"
                    : unreadCount}
                </span>
              )}
            </span>
          </NavLink>

          <NavLink
            to="/cart"
            className={({ isActive }) =>
              isActive
                ? "nav-icon-link active"
                : "nav-icon-link"
            }
          >
            🛒
          </NavLink>

          <NavLink
            to="/profile"
            className={({ isActive }) =>
              isActive
                ? "nav-icon-link active"
                : "nav-icon-link"
            }
          >
            👤
          </NavLink>

          <button
            className="logout-button"
            onClick={handleLogout}
          >
            Logout
          </button>

        </nav>

        {/* MOBILE MENU BUTTON */}
        <button
          className="mobile-menu-button"
          onClick={() =>
            setMenuOpen(!menuOpen)
          }
          aria-label="Toggle menu"
        >
          {menuOpen ? "✕" : "☰"}
        </button>
      </div>

      {/* MOBILE NAVIGATION */}
      {menuOpen && (
        <div className="mobile-nav">

          <div className="mobile-user">
            <div className="mobile-avatar">
              👤
            </div>

            <div>
              <strong>
                {user?.name || "Customer"}
              </strong>

              <small>
                {user?.email || ""}
              </small>
            </div>
          </div>

          <NavLink
            to="/restaurants"
            onClick={closeMenu}
            className={({ isActive }) =>
              isActive
                ? "mobile-nav-link active"
                : "mobile-nav-link"
            }
          >
            🍽️ Restaurants
          </NavLink>

          <NavLink
            to="/my-orders"
            onClick={closeMenu}
            className={({ isActive }) =>
              isActive
                ? "mobile-nav-link active"
                : "mobile-nav-link"
            }
          >
            📦 My Orders
          </NavLink>

          <NavLink
            to="/coupons"
            onClick={closeMenu}
            className={({ isActive }) =>
              isActive
                ? "mobile-nav-link active"
                : "mobile-nav-link"
            }
          >
            🎟️ Coupons
          </NavLink>

          <NavLink
            to="/notifications"
            onClick={closeMenu}
            className={({ isActive }) =>
              isActive
                ? "mobile-nav-link active"
                : "mobile-nav-link"
            }
          >
            <NavLink
  to="/support"
  onClick={closeMenu}
  className={({ isActive }) =>
    isActive
      ? "mobile-nav-link active"
      : "mobile-nav-link"
  }
>
  🛟 Support
</NavLink>

<NavLink
  to="/my-tickets"
  onClick={closeMenu}
  className={({ isActive }) =>
    isActive
      ? "mobile-nav-link active"
      : "mobile-nav-link"
  }
>
  🎫 My Tickets
</NavLink>
            🔔 Notifications

            {unreadCount > 0 && (
              <span className="mobile-notification-badge">
                {unreadCount > 99
                  ? "99+"
                  : unreadCount}
              </span>
            )}
          </NavLink>

          <NavLink
            to="/cart"
            onClick={closeMenu}
            className={({ isActive }) =>
              isActive
                ? "mobile-nav-link active"
                : "mobile-nav-link"
            }
          >
            🛒 Cart
          </NavLink>

          <NavLink
            to="/profile"
            onClick={closeMenu}
            className={({ isActive }) =>
              isActive
                ? "mobile-nav-link active"
                : "mobile-nav-link"
            }
          >
            👤 Profile
          </NavLink>

          <button
            className="mobile-logout"
            onClick={handleLogout}
          >
            Logout
          </button>

        </div>
      )}
    </header>
  );
}

export default Header;
