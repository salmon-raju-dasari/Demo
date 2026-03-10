import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "../services/api/auth.service";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { Dialog } from "primereact/dialog";
import { api } from "../services/api/axios";
import "./Auth.css";

export default function ForgotUsername() {
  const [email, setEmail] = useState("");
  const [businessId, setBusinessId] = useState("");
  const [emailError, setEmailError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const navigate = useNavigate();
  const toast = useRef(null);

  // If user is already authenticated, redirect to dashboard
  useEffect(() => {
    if (authService.isAuthenticated()) {
      navigate("/dashboard", { replace: true });
    }
  }, [navigate]);

  const handleSendOTP = async () => {
    setEmailError("");

    if (!email) {
      setEmailError("Email address is required");
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailError("Please enter a valid email address");
      return;
    }

    try {
      setLoading(true);
      const requestData = { email: email };

      // Add business_id if provided
      if (businessId && businessId.trim()) {
        // Strip BUS prefix if present
        const numericId = businessId.replace(/^BUS/i, "").trim();
        if (numericId) {
          requestData.business_id = parseInt(numericId);
        }
      }

      await api.post("/employees/forgot-username-otp", requestData);

      toast.current.show({
        severity: "success",
        summary: "Success",
        detail:
          "Your User ID(s) have been sent to your email. Please check your inbox.",
        life: 5000,
      });
      setShowSuccessDialog(true);
    } catch (error) {
      const errorDetail =
        error.response?.data?.detail ||
        "Failed to send User IDs. Please try again.";
      setEmailError(errorDetail);
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: errorDetail,
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSendOTP();
    }
  };

  return (
    <>
      <Toast ref={toast} />
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <div className="auth-icon">
              <i className="pi pi-user"></i>
            </div>
            <h1 className="auth-title">Find Your User ID</h1>
            <p className="auth-subtitle">
              Enter your email to receive your User ID(s)
            </p>
          </div>

          <div className="auth-content">
            <form>
              <div className="auth-form-group">
                <label htmlFor="email">
                  Email Address <span className="auth-required">*</span>
                </label>
                <InputText
                  id="email"
                  type="email"
                  placeholder="Enter your registered email"
                  className={`auth-input ${emailError ? "auth-input-error" : ""}`}
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setEmailError("");
                  }}
                  onKeyPress={handleKeyPress}
                />
                {emailError && (
                  <small className="auth-error-text">{emailError}</small>
                )}
              </div>

              <div className="auth-form-group">
                <label htmlFor="businessId">
                  Business ID <span className="auth-optional">(Optional)</span>
                </label>
                <InputText
                  id="businessId"
                  type="text"
                  placeholder="Enter Business ID (e.g., BUS20001)"
                  className="auth-input"
                  value={businessId}
                  onChange={(e) => {
                    setBusinessId(e.target.value);
                  }}
                  onKeyPress={handleKeyPress}
                />
                <small className="auth-helper-text">
                  Enter Business ID (e.g., BUS20001) to get User ID for a
                  specific business only
                </small>
              </div>

              <small className="auth-info-text">
                If you have multiple accounts with this email, all User IDs will
                be sent (unless Business ID is specified).
              </small>

              <div className="auth-button-group">
                <Button
                  label="Send User ID(s)"
                  icon="pi pi-send"
                  className="auth-btn-primary"
                  loading={loading}
                  onClick={handleSendOTP}
                />
              </div>

              <div className="auth-link-group">
                <button
                  type="button"
                  className="auth-link-button"
                  onClick={() =>
                    navigate("/login", { state: { fromForgotFlow: true } })
                  }
                >
                  <i className="pi pi-arrow-left"></i>
                  Back to Login
                </button>
                <button
                  type="button"
                  className="auth-link-button"
                  onClick={() => navigate("/forgot-password")}
                >
                  <i className="pi pi-key"></i>
                  Forgot Password?
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <Dialog
        header="User ID Sent Successfully"
        visible={showSuccessDialog}
        style={{ width: "90vw", maxWidth: "500px" }}
        headerClassName="auth-dialog-header"
        onHide={() => {
          setShowSuccessDialog(false);
          navigate("/login", { state: { fromForgotFlow: true } });
        }}
        footer={
          <Button
            label="Go to Login"
            icon="pi pi-sign-in"
            onClick={() => {
              setShowSuccessDialog(false);
              navigate("/login", { state: { fromForgotFlow: true } });
            }}
            autoFocus
          />
        }
      >
        <div className="auth-success-content">
          <i className="pi pi-check-circle"></i>
          <p className="auth-success-title">
            Your User ID(s) have been sent to your email address.
          </p>
          <p className="auth-success-message">
            Please check your inbox. If you have multiple accounts, all User IDs
            will be listed with their business details.
          </p>
          <p className="auth-success-message">
            Use the appropriate User ID based on which business you want to
            access.
          </p>
        </div>
      </Dialog>
    </>
  );
}
