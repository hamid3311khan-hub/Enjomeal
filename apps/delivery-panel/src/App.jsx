import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import "./App.css";

function App() {
  const path = window.location.pathname;

  if (path === "/delivery/dashboard") {
    return <Dashboard />;
  }

  return <Login />;
}

export default App;