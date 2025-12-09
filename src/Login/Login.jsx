import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Card } from "primereact/card";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { authService } from "../services/api/auth.service";
import { Password } from "primereact/password";

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
      <div>
        <Card
          title="Login"
          className="sm:max-w-100 w-[90%] m-auto mt-6 p-2 border-round-lg shadow-2"
        >
          <InputText
            placeholder="User ID (e.g., USR1000)"
            className="w-full mb-3"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            onKeyPress={handleKeyPress}
          />
          <Password
            placeholder="Password"
            value={password}
            className="w-full mb-3"
            onChange={(e) => setPassword(e.target.value)}
            onKeyPress={handleKeyPress}
            feedback={false}
            toggleMask={true}
          />

          <div className="flex flex-col sm:flex-row align-items-center gap-3">
            <Button
              label="Login"
              className="w-full"
              loading={loading}
              onClick={() => handleLogin()}
            />
            <Button
              label="Owner Registration"
              className="w-full p-button-secondary"
              onClick={() => navigate("/register/owner")}
            />
          </div>

          <div className="flex flex-column sm:flex-row gap-2 mt-4 justify-content-center">
            <Button
              label="Forgot Username?"
              icon="pi pi-user"
              className="p-button-link p-button-sm"
              onClick={() => navigate("/forgot-username")}
            />
            <span className="hidden sm:inline text-400">|</span>
            <Button
              label="Forgot Password?"
              icon="pi pi-key"
              className="p-button-link p-button-sm"
              onClick={() => navigate("/forgot-password")}
            />
          </div>
        </Card>
      </div>
    </>
  );
}
