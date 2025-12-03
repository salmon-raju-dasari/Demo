import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Card } from "primereact/card";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { authService } from "../services/api/auth.service";
import { Password } from "primereact/password";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const toast = useRef(null);
  const location = useLocation();

  // If user is already authenticated, redirect them away from the login page
  useEffect(() => {
    try {
      if (authService.isAuthenticated()) {
        const returnUrl = location.state?.from?.pathname || "/dashboard";
        navigate(returnUrl, { replace: true });
      }
    } catch (error) {
      console.log(error);
      // ignore errors
    }
  }, [location, navigate]);

  const handleLogin = async () => {
    if (!email || !password) {
      toast.current.show({
        severity: "warn",
        summary: "Warning",
        detail: "Please enter username and password",
        life: 3000,
      });
      return;
    }

    try {
      setLoading(true);
      const response = await authService.login({
        email,
        password,
      });
      console.log("Login response:", response);
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
        detail: error.response?.data?.message || "Login failed",
        life: 3000,
      });
    } finally {
      setLoading(false);
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
            placeholder="Username"
            className="w-full mb-3"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Password
            placeholder="Password"
            value={password}
            className="w-full mb-3"
            onChange={(e) => setPassword(e.target.value)}
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
          </div>
        </Card>
      </div>
    </>
  );
}
