import { Navigate, useLocation } from "react-router-dom";
import { authService } from "../services/api/auth.service";
import { tokenService } from "../services/token.service";

export const ProtectedRoute = ({ children, requiredRoles = [] }) => {
  const location = useLocation();
  const isAuthenticated = authService.isAuthenticated();
  const userRole = tokenService.getUserRole();

  if (!isAuthenticated) {
    // Redirect to login page with return url
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If roles are specified, check if user has required role
  if (requiredRoles.length > 0 && !requiredRoles.includes(userRole)) {
    // Redirect to unauthorized page or home
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};
