import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "../services/api/auth.service";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { Dialog } from "primereact/dialog";
import { api } from "../services/api/axios";
import "../Login/Auth.css";

export default function ForgotPassword() {
  const [userId, setUserId] = useState("");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loadingOTP, setLoadingOTP] = useState(false);
  const [loadingVerify, setLoadingVerify] = useState(false);
  const [loadingResend, setLoadingResend] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
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
    if (!userId) {
      toast.current.show({
        severity: "warn",
        summary: "Warning",
        detail: "Please enter your User ID",
        life: 3000,
      });
      return;
    }

    if (!email) {
      toast.current.show({
        severity: "warn",
        summary: "Warning",
        detail: "Please enter your email address",
        life: 3000,
      });
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.current.show({
        severity: "warn",
        summary: "Warning",
        detail: "Please enter a valid email address",
        life: 3000,
      });
      return;
    }

    try {
      setLoadingOTP(true);
      await api.post("/employees/forgot-password-otp", {
        user_id: userId.toUpperCase(),
        email: email,
      });

      toast.current.show({
        severity: "success",
        summary: "Success",
        detail: "OTP has been sent to your email. Please check your inbox.",
        life: 5000,
      });
      setOtpSent(true);
    } catch (error) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail:
          error.response?.data?.detail ||
          "Failed to send OTP. Please try again.",
        life: 3000,
      });
    } finally {
      setLoadingOTP(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp) {
      toast.current.show({
        severity: "warn",
        summary: "Warning",
        detail: "Please enter the OTP",
        life: 3000,
      });
      return;
    }

    if (otp.length !== 6) {
      toast.current.show({
        severity: "warn",
        summary: "Warning",
        detail: "OTP must be 6 digits",
        life: 3000,
      });
      return;
    }

    try {
      setLoadingVerify(true);
      await api.post("/employees/verify-otp-password", {
        email: email,
        otp: otp,
      });

      setShowSuccessDialog(true);
    } catch (error) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail:
          error.response?.data?.detail ||
          "Invalid or expired OTP. Please try again.",
        life: 3000,
      });
    } finally {
      setLoadingVerify(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (!otpSent) {
        handleSendOTP();
      } else {
        handleVerifyOTP();
      }
    }
  };

  return (
    <>
      <Toast ref={toast} />
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <div className="auth-icon">
              <i className="pi pi-lock"></i>
            </div>
            <h1 className="auth-title">Reset Your Password</h1>
            <p className="auth-subtitle">
              Enter your User ID and email to receive a verification code
            </p>
          </div>

          <div className="auth-content">
            <form>
              {!otpSent && (
                <>
                  <div className="auth-form-group">
                    <label htmlFor="userId">
                      User ID <span className="auth-required">*</span>
                    </label>
                    <InputText
                      id="userId"
                      type="text"
                      placeholder="Enter your User ID (e.g., USR1000)"
                      className="auth-input"
                      value={userId}
                      onChange={(e) => setUserId(e.target.value.toUpperCase())}
                      onKeyPress={handleKeyPress}
                      disabled={otpSent}
                    />
                    <small className="auth-helper-text">
                      If you don't know your User ID, use "Forgot Username"
                      below.
                    </small>
                  </div>

                  <div className="auth-form-group">
                    <label htmlFor="email">
                      Email Address <span className="auth-required">*</span>
                    </label>
                    <InputText
                      id="email"
                      type="email"
                      placeholder="Enter your registered email"
                      className="auth-input"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onKeyPress={handleKeyPress}
                      disabled={otpSent}
                    />
                  </div>

                  <div className="auth-button-group">
                    <Button
                      label="Send OTP"
                      icon="pi pi-send"
                      className="auth-btn-primary"
                      loading={loadingOTP}
                      onClick={handleSendOTP}
                    />
                  </div>
                </>
              )}

              {otpSent && (
                <>
                  <div className="auth-form-group">
                    <label htmlFor="otp">
                      Enter OTP <span className="auth-required">*</span>
                    </label>
                    <InputText
                      id="otp"
                      placeholder="Enter 6-digit OTP"
                      className="auth-input"
                      value={otp}
                      onChange={(e) =>
                        setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                      }
                      onKeyPress={handleKeyPress}
                      maxLength={6}
                    />
                    <small className="auth-helper-text">
                      OTP valid for 10 minutes. Check your email inbox and spam
                      folder.
                    </small>
                  </div>

                  <div className="auth-button-group auth-button-group-flex">
                    <Button
                      label="Verify OTP"
                      icon="pi pi-check"
                      className="auth-btn-primary"
                      loading={loadingVerify}
                      onClick={handleVerifyOTP}
                    />
                    <Button
                      label="Resend OTP"
                      icon="pi pi-refresh"
                      className="auth-btn-secondary"
                      loading={loadingResend}
                      onClick={async () => {
                        try {
                          setLoadingResend(true);
                          await api.post("/employees/forgot-password-otp", {
                            user_id: userId.toUpperCase(),
                            email: email,
                          });
                          toast.current.show({
                            severity: "success",
                            summary: "Success",
                            detail: "OTP has been resent to your email.",
                            life: 5000,
                          });
                          setOtp("");
                        } catch (error) {
                          toast.current.show({
                            severity: "error",
                            summary: "Error",
                            detail:
                              error.response?.data?.detail ||
                              "Failed to resend OTP. Please try again.",
                            life: 3000,
                          });
                        } finally {
                          setLoadingResend(false);
                        }
                      }}
                    />
                  </div>
                </>
              )}

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
                  onClick={() => navigate("/forgot-username")}
                >
                  <i className="pi pi-user"></i>
                  Forgot Username?
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <Dialog
        header="Password Reset Successfully"
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
            Your temporary password has been sent to your email address.
          </p>
          <p className="auth-success-message">
            Please check your inbox and use the temporary password to login.
          </p>
          <p className="auth-success-warning">
            ⚠️ Remember to change your password after logging in for security.
          </p>
        </div>
      </Dialog>
    </>
  );
}
