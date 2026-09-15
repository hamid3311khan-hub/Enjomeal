import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import DeliveryRegister from "./pages/DeliveryRegister";
import DeliveryReports from "./pages/DeliveryReports";
import DeliveryNotifications from "./pages/DeliveryNotifications";
import "./App.css";

function App() {
  const path = window.location.pathname;

  if (path === "/delivery/dashboard") {
    return <Dashboard />;
  }

  if (path === "/delivery/notifications") {
  return <DeliveryNotifications />;
  }

  if (path === "/delivery/reports") {
    return <DeliveryReports />;
  }

  if (path === "/delivery/register") {
    return <DeliveryRegister />;
  }

  return <Login />;
}

export default App;
