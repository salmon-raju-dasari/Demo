import { Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Unauthorized } from "./components/Unauthorized";
import { NotFound } from "./components/NotFound";
import { MainLayout } from "./components/Layout/MainLayout";
import Login from "./Login/Login";
import OwnerRegistration from "./Register/OwnerRegistration";
import ForgotUsername from "./Login/ForgotUsername";
import ForgotPassword from "./Login/ForgotPassword";
import Dashboard from "./components/Dashboard";
import { ProfilePage } from "./components/Profile/ProfilePage";
import AddProducts from "./components/AddProducts";
import AllProducts from "./components/AllProducts";
import Employees from "./components/Employees";
import Business from "./components/Business";
import StoreManagement from "./components/StoreManagement";
import CustomLabelManagement from "./components/CustomLabelManagement";
import CategoryManagement from "./components/CategoryManagement";
import SalesScreen from "./components/SalesScreen";
import SalesHistory from "./components/SalesHistory";
import UnitManagement from "./components/UnitManagement";
import InventoryManagement from "./components/InventoryManagement";
import RoleManagement from "./components/RoleManagement";
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
        path="/units"
        element={
          <ProtectedRoute requiredRoles={["admin", "owner", "manager"]}>
            <MainLayout>
              <UnitManagement />
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
              <AllProducts />
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
              <InventoryManagement />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/roles"
        element={
          <ProtectedRoute requiredRoles={["admin", "owner"]}>
            <MainLayout>
              <RoleManagement />
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

      <Route
        path="/sales"
        element={
          <ProtectedRoute
            requiredRoles={["admin", "owner", "manager", "cashier", "employee"]}
          >
            <MainLayout>
              <SalesScreen />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/sales/history"
        element={
          <ProtectedRoute requiredRoles={["admin", "owner", "manager"]}>
            <MainLayout>
              <SalesHistory />
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
