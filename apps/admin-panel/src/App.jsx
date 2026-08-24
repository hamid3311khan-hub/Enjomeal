import { useEffect, useState } from "react";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Restaurants from "./pages/Restaurants";
import Customers from "./pages/Customers";
import Delivery from "./pages/Delivery";
import Orders from "./pages/Orders";
import Notifications from "./pages/Notifications";


// =================================================
// AUTH STORAGE KEYS
// =================================================

const TOKEN_KEY = "enjoMealToken";
const USER_KEY = "enjoMealUser";


// =================================================
// APP
// =================================================

function App() {

  // ============================================
  // AUTH STATE
  // ============================================

  const [isLoggedIn, setIsLoggedIn] =
    useState(false);

  const [authChecking, setAuthChecking] =
    useState(true);

  const [activePage, setActivePage] =
    useState("dashboard");

  const [isMobile, setIsMobile] = useState(
    window.innerWidth <= 768
  );

  const [authError, setAuthError] =
    useState("");


  // ============================================
  // CLEAR AUTH DATA
  // ============================================

  const clearAuthData = () => {

    localStorage.removeItem(
      TOKEN_KEY
    );

    localStorage.removeItem(
      USER_KEY
    );

    // Old token key cleanup
    localStorage.removeItem(
      "enjoMealToken"
    );
  };


  // ============================================
  // VERIFY ADMIN SESSION
  // ============================================

  useEffect(() => {

    const verifyAdminSession =
      async () => {

        try {

          setAuthError("");

          const token =
            localStorage.getItem(
              TOKEN_KEY
            );

          console.log(
            "Checking admin token:",
            token
              ? "Token found"
              : "No token found"
          );


          // =====================================
          // NO TOKEN
          // =====================================

          if (!token) {

            setIsLoggedIn(false);

            return;
          }


          // =====================================
          // VERIFY TOKEN WITH BACKEND
          // =====================================

          const response =
            await fetch(
              "http://localhost:5000/api/auth/profile",
              {
                method: "GET",

                headers: {
                  "Content-Type":
                    "application/json",

                  Authorization:
                    `Bearer ${token}`,
                },
              }
            );


          // =====================================
          // RESPONSE DATA
          // =====================================

          const data =
            await response.json();


          console.log(
            "Admin Session Response:",
            data
          );


          // =====================================
          // INVALID / EXPIRED TOKEN
          // =====================================

          if (
            !response.ok ||
            !data.success
          ) {

            console.warn(
              "Admin session invalid:",
              data.message
            );

            clearAuthData();

            setIsLoggedIn(false);

            setAuthError(
              data.message ||
              "Your session has expired. Please login again."
            );

            return;
          }


          // =====================================
          // CURRENT USER
          // =====================================

          const currentUser =
            data.user;


          // =====================================
          // USER NOT FOUND
          // =====================================

          if (!currentUser) {

            clearAuthData();

            setIsLoggedIn(false);

            setAuthError(
              "User session could not be verified. Please login again."
            );

            return;
          }


          // =====================================
          // ADMIN ONLY
          // =====================================

          if (
            currentUser.role !== "admin"
          ) {

            clearAuthData();

            setIsLoggedIn(false);

            setAuthError(
              "Only admin users can access this panel."
            );

            return;
          }


          // =====================================
          // SAVE LATEST USER
          // =====================================

          localStorage.setItem(
            USER_KEY,
            JSON.stringify(
              currentUser
            )
          );


          // =====================================
          // SESSION VALID
          // =====================================

          setIsLoggedIn(true);

          setAuthError("");

        } catch (error) {

          console.error(
            "Session Verification Error:",
            error
          );

          clearAuthData();

          setIsLoggedIn(false);

          setAuthError(
            "Unable to verify your session. Please login again."
          );

        } finally {

          setAuthChecking(false);

        }
      };


    verifyAdminSession();

  }, []);


  // ============================================
  // MOBILE RESIZE
  // ============================================

  useEffect(() => {

    const handleResize = () => {

      setIsMobile(
        window.innerWidth <= 768
      );

    };


    window.addEventListener(
      "resize",
      handleResize
    );


    return () => {

      window.removeEventListener(
        "resize",
        handleResize
      );

    };

  }, []);


  // ============================================
  // LOGIN SUCCESS
  // ============================================

  const handleLoginSuccess = (
    user
  ) => {

    try {

      setAuthError("");


      // =====================================
      // GET SAVED TOKEN
      // =====================================

      const token =
        localStorage.getItem(
          TOKEN_KEY
        );


      // =====================================
      // TOKEN NOT FOUND
      // =====================================

      if (!token) {

        clearAuthData();

        setIsLoggedIn(false);

        setAuthError(
          "Login successful but authentication token was not saved."
        );

        return;
      }


      // =====================================
      // USER NOT FOUND
      // =====================================

      if (!user) {

        clearAuthData();

        setIsLoggedIn(false);

        setAuthError(
          "Login successful but user information was not received."
        );

        return;
      }


      // =====================================
      // ADMIN CHECK
      // =====================================

      if (
        user.role !== "admin"
      ) {

        clearAuthData();

        setIsLoggedIn(false);

        setAuthError(
          "Only admin users can access this panel."
        );

        return;
      }


      // =====================================
      // SAVE USER
      // =====================================

      localStorage.setItem(
        USER_KEY,
        JSON.stringify(user)
      );


      // =====================================
      // LOGIN COMPLETE
      // =====================================

      setAuthError("");

      setIsLoggedIn(true);

      setActivePage(
        "dashboard"
      );


      console.log(
        "Admin login successful"
      );

    } catch (error) {

      console.error(
        "Login Session Error:",
        error
      );

      clearAuthData();

      setIsLoggedIn(false);

      setAuthError(
        "Unable to create admin session."
      );

    }

  };


  // ============================================
  // LOGOUT
  // ============================================

  const handleLogout = () => {

    clearAuthData();

    setIsLoggedIn(false);

    setActivePage(
      "dashboard"
    );

    setAuthError("");

  };


  // ============================================
  // PAGE TITLE
  // ============================================

  const getPageTitle = () => {

    switch (activePage) {

      case "dashboard":
        return "Admin Dashboard";

      case "restaurants":
        return "Restaurants";

      case "customers":
        return "Customers";

      case "delivery":
        return "Delivery Partners";

      case "orders":
        return "Orders";

      case "notifications":
        return "Notifications";

      default:
        return "Admin Dashboard";

    }

  };


  // ============================================
  // PAGE SUBTITLE
  // ============================================

  const getPageSubtitle = () => {

    switch (activePage) {

      case "dashboard":
        return "Manage EnjoMeal platform";

      case "restaurants":
        return "Manage EnjoMeal restaurants";

      case "customers":
        return "Manage EnjoMeal customers";

      case "delivery":
        return "Manage delivery partners";

      case "orders":
        return "Manage EnjoMeal orders";

      case "notifications":
        return "Manage platform notifications";

      default:
        return "Manage EnjoMeal platform";

    }

  };


  // ============================================
  // PAGE CONTENT
  // ============================================

  const renderPage = () => {

    switch (activePage) {

      case "dashboard":
        return <Dashboard />;

      case "restaurants":
        return <Restaurants />;

      case "customers":
        return <Customers />;

      case "delivery":
        return <Delivery />;

      case "orders":
        return <Orders />;
      

      case "notifications":
        return (
          <Notifications
          />
        );

      default:
        return <Dashboard />;

    }

  };


  // ============================================
  // AUTH CHECKING SCREEN
  // ============================================

  if (authChecking) {

    return (
      <div
        style={
          styles.loadingScreen
        }
      >
        Checking authentication...
      </div>
    );

  }


  // ============================================
  // LOGIN SCREEN
  // ============================================

  if (!isLoggedIn) {

    return (
      <>

        {authError && (
          <div
            style={
              styles.authError
            }
          >
            {authError}
          </div>
        )}

        <Login
          onLoginSuccess={
            handleLoginSuccess
          }
        />

      </>
    );

  }


  // ============================================
  // ADMIN PANEL
  // ============================================

  return (
    <div style={styles.app}>

      {/* SIDEBAR */}

      <aside
        style={{
          ...styles.sidebar,

          ...(isMobile
            ? styles.mobileSidebar
            : {}),
        }}
      >

        {/* LOGO */}

        <div style={styles.logo}>
          EnjoMeal
        </div>

        <div style={styles.adminText}>
          ADMIN PANEL
        </div>


        {/* DASHBOARD */}

        <button
          style={{
            ...styles.menuButton,

            ...(activePage ===
            "dashboard"
              ? styles.activeButton
              : {}),
          }}

          onClick={() =>
            setActivePage(
              "dashboard"
            )
          }
        >

          <span
            style={styles.menuIcon}
          >
            📊
          </span>

          {!isMobile &&
            "Dashboard"}

        </button>


        {/* RESTAURANTS */}

        <button
          style={{
            ...styles.menuButton,

            ...(activePage ===
            "restaurants"
              ? styles.activeButton
              : {}),
          }}

          onClick={() =>
            setActivePage(
              "restaurants"
            )
          }
        >

          <span
            style={styles.menuIcon}
          >
            🏪
          </span>

          {!isMobile &&
            "Restaurants"}

        </button>


        {/* CUSTOMERS */}

        <button
          style={{
            ...styles.menuButton,

            ...(activePage ===
            "customers"
              ? styles.activeButton
              : {}),
          }}

          onClick={() =>
            setActivePage(
              "customers"
            )
          }
        >

          <span
            style={styles.menuIcon}
          >
            👥
          </span>

          {!isMobile &&
            "Customers"}

        </button>
        {/* DELIVERY */}

        <button
          style={{
            ...styles.menuButton,

            ...(activePage ===
            "delivery"
              ? styles.activeButton
              : {}),
          }}

          onClick={() =>
            setActivePage(
              "delivery"
            )
          }
        >

          <span
            style={styles.menuIcon}
          >
            🛵
          </span>

          {!isMobile &&
            "Delivery Partners"}

        </button>


        {/* ORDERS */}

        <button
          style={{
            ...styles.menuButton,

            ...(activePage ===
            "orders"
              ? styles.activeButton
              : {}),
          }}

          onClick={() =>
            setActivePage(
              "orders"
            )
          }
        >

          <span
            style={styles.menuIcon}
          >
            📦
          </span>

          {!isMobile &&
            "Orders"}

        </button>


        {/* NOTIFICATIONS */}

        <button
          style={{
            ...styles.menuButton,

            ...(activePage ===
            "notifications"
              ? styles.activeButton
              : {}),
          }}

          onClick={() =>
            setActivePage(
              "notifications"
            )
          }
        >

          <span
            style={styles.menuIcon}
          >
            🔔
          </span>

          {!isMobile &&
            "Notifications"}

        </button>


        {/* LOGOUT */}

        <button
          style={
            styles.logoutButton
          }

          onClick={
            handleLogout
          }
        >

          <span
            style={styles.menuIcon}
          >
            🚪
          </span>

          {!isMobile &&
            "Logout"}

        </button>

      </aside>


      {/* =========================================
          MAIN CONTENT
      ========================================= */}

      <main
        style={{
          ...styles.main,

          ...(isMobile
            ? styles.mobileMain
            : {}),
        }}
      >

        {/* =======================================
            HEADER
        ======================================= */}

        <header
          style={styles.header}
        >

          <div
            style={
              styles.headerLeft
            }
          >

            <h2
              style={
                styles.headerTitle
              }
            >
              {getPageTitle()}
            </h2>

            <p
              style={
                styles.headerSubtitle
              }
            >
              {getPageSubtitle()}
            </p>

          </div>


          {/* =====================================
              ADMIN PROFILE
          ===================================== */}

          <div
            style={
              styles.adminProfile
            }
          >

            <div
              style={styles.avatar}
            >
              A
            </div>

            <div
              style={
                styles.profileText
              }
            >

              <strong>
                Administrator
              </strong>

              <div
                style={styles.role}
              >
                Admin
              </div>

            </div>

          </div>

        </header>


        {/* =======================================
            PAGE CONTENT
        ======================================= */}

        <section
          style={
            styles.pageContent
          }
        >

          {renderPage()}

        </section>

      </main>

    </div>
  );
}


// =================================================
// COMING SOON
// =================================================

function ComingSoon({
  title,
}) {

  return (
    <div
      style={
        styles.comingSoon
      }
    >

      <div
        style={
          styles.comingSoonIcon
        }
      >
        🚧
      </div>

      <h2
        style={
          styles.comingSoonTitle
        }
      >
        {title}
      </h2>

      <p
        style={
          styles.comingSoonText
        }
      >
        This section will be added in
        the next part.
      </p>

    </div>
  );
}


// =================================================
// STYLES
// =================================================

const styles = {

  // =============================================
  // APP
  // =============================================

  app: {

    display: "flex",

    width: "100%",

    minHeight: "100vh",

    background: "#f5f7fb",

    overflowX: "hidden",

    boxSizing: "border-box",

  },


  // =============================================
  // AUTH CHECKING SCREEN
  // =============================================

  loadingScreen: {

    minHeight: "100vh",

    width: "100%",

    display: "flex",

    alignItems: "center",

    justifyContent: "center",

    background: "#f5f7fb",

    color: "#6b7280",

    fontSize: "15px",

    boxSizing: "border-box",

  },


  // =============================================
  // SIDEBAR
  // =============================================

  sidebar: {

    width: "240px",

    minWidth: "240px",

    minHeight: "100vh",

    background:
      "linear-gradient(180deg, #111827 0%, #172554 100%)",

    padding: "25px 15px",

    boxSizing: "border-box",

    position: "sticky",

    top: 0,

    alignSelf: "flex-start",

  },


  // =============================================
  // MOBILE SIDEBAR
  // =============================================

  mobileSidebar: {

    width: "70px",

    minWidth: "70px",

    padding: "15px 8px",

  },


  // =============================================
  // LOGO
  // =============================================

  logo: {

    color: "#ffffff",

    fontSize: "25px",

    fontWeight: "bold",

    textAlign: "center",

    marginBottom: "5px",

  },


  // =============================================
  // ADMIN TEXT
  // =============================================

  adminText: {

    color: "#9ca3af",

    fontSize: "11px",

    textAlign: "center",

    marginBottom: "30px",

    letterSpacing: "1px",

  },


  // =============================================
  // MENU BUTTON
  // =============================================

  menuButton: {

    width: "100%",

    minHeight: "45px",

    padding: "12px 15px",

    marginBottom: "8px",

    border: "none",

    borderRadius: "8px",

    background: "transparent",

    color: "#d1d5db",

    textAlign: "left",

    cursor: "pointer",

    fontSize: "14px",

    display: "flex",

    alignItems: "center",

    gap: "10px",

    boxSizing: "border-box",

    transition:
      "background 0.2s ease",

  },


  // =============================================
  // ACTIVE MENU BUTTON
  // =============================================

  activeButton: {

    background: "#2563eb",

    color: "#ffffff",

    boxShadow:
      "0 4px 12px rgba(37, 99, 235, 0.25)",

  },


  // =============================================
  // MENU ICON
  // =============================================

  menuIcon: {

    width: "22px",

    minWidth: "22px",

    textAlign: "center",

    fontSize: "16px",

  },


  // =============================================
  // LOGOUT BUTTON
  // =============================================

  logoutButton: {

    width: "100%",

    minHeight: "45px",

    padding: "12px 15px",

    marginTop: "25px",

    border: "1px solid #374151",

    borderRadius: "8px",

    background: "transparent",

    color: "#fca5a5",

    textAlign: "left",

    cursor: "pointer",

    fontSize: "14px",

    display: "flex",

    alignItems: "center",

    gap: "10px",

    boxSizing: "border-box",

  },


  // =============================================
  // MAIN
  // =============================================

  main: {

    flex: 1,

    width:
      "calc(100% - 240px)",

    minWidth: 0,

    minHeight: "100vh",

    background: "#f5f7fb",

    boxSizing: "border-box",

    overflowX: "hidden",

  },


  // =============================================
  // MOBILE MAIN
  // =============================================

  mobileMain: {

    width:
      "calc(100% - 70px)",

    minWidth: 0,

  },


  // =============================================
  // HEADER
  // =============================================

  header: {

    width: "100%",

    minHeight: "75px",

    background: "#ffffff",

    display: "flex",

    justifyContent:
      "space-between",

    alignItems: "center",

    padding: "12px 30px",

    borderBottom:
      "1px solid #e5e7eb",

    boxSizing: "border-box",

    gap: "20px",

  },


  // =============================================
  // HEADER LEFT
  // =============================================

  headerLeft: {

    minWidth: 0,

  },


  // =============================================
  // HEADER TITLE
  // =============================================

  headerTitle: {

    margin: 0,

    fontSize: "20px",

    color: "#111827",

    whiteSpace: "nowrap",

    overflow: "hidden",

    textOverflow: "ellipsis",

  },


  // =============================================
  // HEADER SUBTITLE
  // =============================================

  headerSubtitle: {

    margin: "4px 0 0",

    fontSize: "13px",

    color: "#6b7280",

    whiteSpace: "nowrap",

    overflow: "hidden",

    textOverflow: "ellipsis",

  },


  // =============================================
  // ADMIN PROFILE
  // =============================================

  adminProfile: {

    display: "flex",

    alignItems: "center",

    gap: "10px",

    whiteSpace: "nowrap",

    flexShrink: 0,

  },


  // =============================================
  // ADMIN AVATAR
  // =============================================

  avatar: {

    width: "38px",

    height: "38px",

    borderRadius: "50%",

    background: "#2563eb",

    color: "#ffffff",

    display: "flex",

    alignItems: "center",

    justifyContent: "center",

    fontWeight: "bold",

    flexShrink: 0,

  },
  // =============================================
  // PROFILE TEXT
  // =============================================

  profileText: {

    color: "#111827",

    fontSize: "14px",

  },


  // =============================================
  // PROFILE ROLE
  // =============================================

  role: {

    fontSize: "12px",

    color: "#6b7280",

    marginTop: "2px",

  },


  // =============================================
  // PAGE CONTENT
  // =============================================

  pageContent: {

    width: "100%",

    minWidth: 0,

    boxSizing: "border-box",

    overflowX: "hidden",

  },


  // =============================================
  // COMING SOON
  // =============================================

  comingSoon: {

    margin: "30px",

    padding: "60px 30px",

    background: "#ffffff",

    border:
      "1px solid #e5e7eb",

    borderRadius: "14px",

    textAlign: "center",

    boxSizing: "border-box",

  },


  // =============================================
  // COMING SOON ICON
  // =============================================

  comingSoonIcon: {

    fontSize: "45px",

    marginBottom: "10px",

  },


  // =============================================
  // COMING SOON TITLE
  // =============================================

  comingSoonTitle: {

    margin: "0 0 8px",

    color: "#111827",

  },


  // =============================================
  // COMING SOON TEXT
  // =============================================

  comingSoonText: {

    margin: 0,

    color: "#6b7280",

    fontSize: "14px",

  },


  // =============================================
  // AUTH ERROR
  // =============================================

  authError: {

    position: "fixed",

    top: "15px",

    left: "50%",

    transform:
      "translateX(-50%)",

    zIndex: 9999,

    background: "#fee2e2",

    color: "#b91c1c",

    border:
      "1px solid #fecaca",

    borderRadius: "8px",

    padding: "12px 18px",

    fontSize: "13px",

    boxShadow:
      "0 4px 12px rgba(0,0,0,0.1)",

    maxWidth: "90%",

    textAlign: "center",

    boxSizing: "border-box",

  },


  // =============================================
  // EXTRA MOBILE HEADER
  // =============================================

  mobileHeader: {

    padding: "12px 15px",

    gap: "10px",

  },


  // =============================================
  // MOBILE PROFILE
  // =============================================

  mobileProfileText: {

    display: "none",

  },


  // =============================================
  // MOBILE PAGE
  // =============================================

  mobilePageContent: {

    width: "100%",

    padding: 0,

    margin: 0,

    boxSizing: "border-box",

  },


  // =============================================
  // GENERAL CARD
  // =============================================

  card: {

    background: "#ffffff",

    border:
      "1px solid #e5e7eb",

    borderRadius: "12px",

    boxSizing: "border-box",

  },


  // =============================================
  // BUTTON RESET
  // =============================================

  buttonReset: {

    fontFamily:
      "inherit",

  },

};


// =================================================
// EXPORT
// =================================================

export default App;