import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import DeliveryRegister from "./pages/DeliveryRegister";
import "./App.css";

function App() {
  const path = window.location.pathname;

  // Delivery Registration
  if (path === "/register") {
    return <DeliveryRegister />;
  }

  // Delivery Dashboard
  if (path === "/delivery/dashboard") {
    return <Dashboard />;
  }

  // Default = Login
  return <Login />;
}

export default App;
