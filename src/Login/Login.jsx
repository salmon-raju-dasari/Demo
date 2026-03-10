import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { Password } from "primereact/password";
import { authService } from "../services/api/auth.service";
import api from "../services/api/axios";
import "./Login.css";

export default function Login() {
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const toast = useRef(null);
  const location = useLocation();

  // If user is already authenticated, redirect them away from the login page
  // UNLESS they came from forgot-username or forgot-password (they want to login as different user)
  useEffect(() => {
    try {
      const fromForgotFlow = location.state?.fromForgotFlow;
      if (authService.isAuthenticated() && !fromForgotFlow) {
        const returnUrl = location.state?.from?.pathname || "/dashboard";
        navigate(returnUrl, { replace: true });
      }
    } catch (error) {
      console.log(error);
      // ignore errors
    }
  }, [location, navigate]);

  const handleLogin = async () => {
    if (!userId || !password) {
      toast.current.show({
        severity: "warn",
        summary: "Warning",
        detail: "Please enter user ID and password",
        life: 3000,
      });
      return;
    }

    try {
      setLoading(true);
      const response = await authService.login({
        user_id: userId,
        password,
      });
      console.log("Login response:", response);

      // Store user_id in localStorage for payment tracking
      localStorage.setItem("user_id", userId);

      // Fetch current user details to get business name
      try {
        const businessResponse = await api.get("/business");
        console.log("Business response from login:", businessResponse.data);

        if (businessResponse.data?.business_name) {
          console.log(
            "Storing business name:",
            businessResponse.data.business_name,
          );
          localStorage.setItem(
            "business_name",
            businessResponse.data.business_name,
          );
        }
      } catch (userError) {
        console.error("Error fetching business details:", userError);
      }

      // Fetch payment status to get expiry time
      try {
        const API_BASE_URL =
          import.meta.env.VITE_API_BASE_URL || "http://136.114.116.97:8000/api";
        const paymentResponse = await fetch(
          `${API_BASE_URL}/payment/status/${userId}`,
        );
        const paymentData = await paymentResponse.json();

        if (paymentData.expires_at) {
          // Store expiry time for next status check
          localStorage.setItem(
            `payment_expires_at_${userId}`,
            paymentData.expires_at,
          );
          console.log("Payment expiry stored:", paymentData.expires_at);
        } else {
          // No expiry found - clear any existing expiry
          localStorage.removeItem(`payment_expires_at_${userId}`);
          console.log("No payment expiry found");
        }
      } catch (paymentError) {
        console.error("Error fetching payment status:", paymentError);
        // Continue with login even if payment status fetch fails
      }

      // Show success message
      toast.current.show({
        severity: "success",
        summary: "Success",
        detail: "Login successful!",
        life: 2000,
      });

      // Navigate to dashboard after success message
      setTimeout(() => {
        navigate("/dashboard");
      }, 1000);
    } catch (error) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        className: "failed-toast",
        detail: error.response?.data?.detail || error.message || "Login failed",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleLogin();
    }
  };

  return (
    <>
      <Toast ref={toast} />
      <div className="login-container">
        <div className="login-card">
          {/* Header */}
          <div className="login-header">
            <div className="login-icon">
              <i className="pi pi-building"></i>
            </div>
            <h1 className="login-title">Welcome Back</h1>
            <p className="login-subtitle">Enterprise Inventory Management</p>
          </div>

          {/* Form Content */}
          <div className="login-content">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleLogin();
              }}
            >
              {/* User ID Field */}
              <div className="form-group">
                <label htmlFor="userId">
                  <i
                    className="pi pi-user"
                    style={{ marginRight: "0.5rem" }}
                  ></i>
                  User ID
                </label>
                <InputText
                  id="userId"
                  placeholder="Enter your User ID"
                  className="login-input"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value.toUpperCase())}
                  onKeyPress={handleKeyPress}
                  autoFocus
                />
              </div>

              {/* Password Field */}
              <div className="form-group">
                <label htmlFor="password">
                  <i
                    className="pi pi-lock"
                    style={{ marginRight: "0.5rem" }}
                  ></i>
                  Password
                </label>
                <Password
                  inputId="password"
                  placeholder="Enter your password"
                  value={password}
                  className="login-input"
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyPress={handleKeyPress}
                  feedback={false}
                  toggleMask={true}
                />
              </div>

              {/* Action Buttons */}
              <div className="button-group">
                <Button
                  type="submit"
                  label="Sign In"
                  loading={loading}
                  className="login-btn-primary"
                  style={{ width: "100%", borderRadius: "8px" }}
                />
                <Button
                  type="button"
                  label="Register"
                  onClick={() => navigate("/register/owner", { replace: true })}
                  className="login-btn-secondary"
                  style={{ width: "100%", borderRadius: "8px" }}
                />
              </div>

              {/* Help Links */}
              <div className="link-group">
                <button
                  type="button"
                  className="link-button"
                  onClick={() => navigate("/forgot-username")}
                >
                  <i
                    className="pi pi-user"
                    style={{ marginRight: "0.3rem" }}
                  ></i>
                  Forgot Username?
                </button>
                <span className="link-separator hidden sm:inline">•</span>
                <button
                  type="button"
                  className="link-button"
                  onClick={() => navigate("/forgot-password")}
                >
                  <i
                    className="pi pi-key"
                    style={{ marginRight: "0.3rem" }}
                  ></i>
                  Forgot Password?
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
