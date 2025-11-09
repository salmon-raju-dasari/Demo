import { Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Unauthorized } from "./components/Unauthorized";
import Login from "./Login/Login";
import Dashboard from "./components/dashboard";
import Profile from "./components/Profile";
// Import your other components

const RouteConfig = () => {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/login" element={<Login />} />
      <Route path="/unauthorized" element={<Unauthorized />} />

      {/* Protected route without role restriction */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute requiredRoles={["user"]}>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      {/* User role protected route */}
      <Route
        path="/profile"
        element={
          <ProtectedRoute requiredRoles={["user", "admin"]}>
            <Profile />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
};
export default RouteConfig;
