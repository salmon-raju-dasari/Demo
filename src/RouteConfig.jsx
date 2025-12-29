import { Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Unauthorized } from "./components/Unauthorized";
import { NotFound } from "./components/NotFound";
import { MainLayout } from "./components/Layout/MainLayout";
import Login from "./Login/Login";
import OwnerRegistration from "./Register/OwnerRegistration";
import ForgotUsername from "./Login/ForgotUsername";
import ForgotPassword from "./Login/ForgotPassword";
import Dashboard from "./components/dashboard";
import { ProfilePage } from "./components/Profile/ProfilePage";
import AddProducts from "./components/AddProducts";
import Employees from "./components/Employees";
import Business from "./components/Business";
import StoreManagement from "./components/StoreManagement";
import CustomLabelManagement from "./components/CustomLabelManagement";
import CategoryManagement from "./components/CategoryManagement";
// Import your other components

const RouteConfig = () => {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register/owner" element={<OwnerRegistration />} />
      <Route path="/forgot-username" element={<ForgotUsername />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/unauthorized" element={<Unauthorized />} />

      {/* Protected routes with MainLayout */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute
            requiredRoles={["admin", "owner", "manager", "employee"]}
          >
            <MainLayout>
              <Dashboard />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/profile"
        element={
          <ProtectedRoute
            requiredRoles={["admin", "owner", "manager", "employee"]}
          >
            <MainLayout>
              <ProfilePage />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/products/add"
        element={
          <ProtectedRoute requiredRoles={["admin", "owner", "manager"]}>
            <MainLayout>
              <AddProducts />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/employees"
        element={
          <ProtectedRoute requiredRoles={["admin", "owner", "manager"]}>
            <MainLayout>
              <Employees />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/custom-labels"
        element={
          <ProtectedRoute requiredRoles={["admin", "owner", "manager"]}>
            <MainLayout>
              <CustomLabelManagement />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/products/categories"
        element={
          <ProtectedRoute requiredRoles={["admin", "owner", "manager"]}>
            <MainLayout>
              <CategoryManagement />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/business"
        element={
          <ProtectedRoute requiredRoles={["owner"]}>
            <MainLayout>
              <Business />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      {/* Add more routes as needed */}
      <Route
        path="/products"
        element={
          <ProtectedRoute
            requiredRoles={["admin", "owner", "manager", "cashier", "employee"]}
          >
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
          <ProtectedRoute
            requiredRoles={["admin", "owner", "manager", "stock_keeper"]}
          >
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
          <ProtectedRoute requiredRoles={["admin", "owner"]}>
            <MainLayout>
              <div className="dashboard-card">
                <h3>Settings</h3>
                <p>Settings panel will appear here</p>
              </div>
            </MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/stores"
        element={
          <ProtectedRoute requiredRoles={["admin", "owner"]}>
            <MainLayout>
              <StoreManagement />
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
