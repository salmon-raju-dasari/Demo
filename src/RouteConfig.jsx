import { Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Unauthorized } from "./components/Unauthorized";
import { NotFound } from "./components/NotFound";
import { MainLayout } from "./components/Layout/MainLayout";
import Login from "./Login/Login";
import Dashboard from "./components/dashboard";
import Profile from "./components/Profile";
import AddProducts from "./components/AddProducts";
import Employees from "./components/Employees";
// Import your other components

const RouteConfig = () => {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/login" element={<Login />} />
      <Route path="/unauthorized" element={<Unauthorized />} />

      {/* Protected routes with MainLayout */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute requiredRoles={["admin", "user"]}>
            <MainLayout>
              <Dashboard />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/profile"
        element={
          <ProtectedRoute requiredRoles={["user", "admin"]}>
            <MainLayout>
              <Profile />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/products/add"
        element={
          <ProtectedRoute requiredRoles={["user", "admin"]}>
            <MainLayout>
              <AddProducts />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      {/* Add more routes as needed */}
      <Route
        path="/products"
        element={
          <ProtectedRoute requiredRoles={["user", "admin"]}>
            <MainLayout>
              <div className="dashboard-card">
                <h3>All Products</h3>
                <p>Products list will appear here</p>
              </div>
            </MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/inventory"
        element={
          <ProtectedRoute requiredRoles={["user", "admin"]}>
            <MainLayout>
              <div className="dashboard-card">
                <h3>Inventory</h3>
                <p>Inventory management will appear here</p>
              </div>
            </MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/settings"
        element={
          <ProtectedRoute requiredRoles={["admin"]}>
            <MainLayout>
              <div className="dashboard-card">
                <h3>Settings</h3>
                <p>Settings panel will appear here</p>
              </div>
            </MainLayout>
          </ProtectedRoute>
        }
      />

      {/* Wildcard route for 404 - must be last */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};
export default RouteConfig;
