import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "../services/api/auth.service";
import { Card } from "primereact/card";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { Dialog } from "primereact/dialog";
import { api } from "../services/api/axios";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
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
      setLoading(true);
      await api.post("/employees/forgot-password-otp", {
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
      setLoading(false);
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
      setLoading(true);
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
      setLoading(false);
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
      <div>
        <Card
          title="Forgot Password"
          subTitle="Enter your email to receive a verification code"
          className="sm:max-w-100 w-[90%] m-auto mt-6 p-2 border-round-lg shadow-2"
        >
          <div className="flex flex-column gap-3">
            <div className="p-field">
              <label htmlFor="email" className="block mb-2 font-medium">
                Email Address <span className="text-red-500">*</span>
              </label>
              <InputText
                id="email"
                type="email"
                placeholder="Enter your registered email"
                className="w-full"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={otpSent}
              />
            </div>

            {!otpSent && (
              <Button
                label="Send OTP"
                icon="pi pi-send"
                className="w-full"
                loading={loading}
                onClick={handleSendOTP}
              />
            )}

            {otpSent && (
              <>
                <div className="p-field">
                  <label htmlFor="otp" className="block mb-2 font-medium">
                    Enter OTP <span className="text-red-500">*</span>
                  </label>
                  <InputText
                    id="otp"
                    placeholder="Enter 6-digit OTP"
                    className="w-full"
                    value={otp}
                    onChange={(e) =>
                      setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                    onKeyPress={handleKeyPress}
                    maxLength={6}
                  />
                  <small className="block mt-2 text-600">
                    OTP valid for 10 minutes. Check your email inbox and spam
                    folder.
                  </small>
                </div>

                <div className="flex gap-2">
                  <Button
                    label="Verify OTP"
                    icon="pi pi-check"
                    className="flex-1"
                    loading={loading}
                    onClick={handleVerifyOTP}
                  />
                  <Button
                    label="Resend OTP"
                    icon="pi pi-refresh"
                    className="flex-1 p-button-secondary"
                    loading={loading}
                    onClick={() => {
                      setOtp("");
                      setOtpSent(false);
                    }}
                  />
                </div>
              </>
            )}

            <div className="flex flex-column gap-2 mt-3">
              <Button
                label="Back to Login"
                icon="pi pi-arrow-left"
                className="p-button-text"
                onClick={() => navigate("/login")}
              />
              <Button
                label="Forgot Username?"
                icon="pi pi-user"
                className="p-button-link"
                onClick={() => navigate("/forgot-username")}
              />
            </div>
          </div>
        </Card>
      </div>

      <Dialog
        header="Password Reset Successfully"
        visible={showSuccessDialog}
        style={{ width: "90vw", maxWidth: "500px" }}
        onHide={() => {
          setShowSuccessDialog(false);
          navigate("/login");
        }}
        footer={
          <Button
            label="Go to Login"
            icon="pi pi-sign-in"
            onClick={() => {
              setShowSuccessDialog(false);
              navigate("/login");
            }}
            autoFocus
          />
        }
      >
        <div className="flex align-items-center gap-3">
          <i
            className="pi pi-check-circle text-green-500"
            style={{ fontSize: "3rem" }}
          ></i>
          <div>
            <p className="m-0 font-medium">
              Your temporary password has been sent to your email address.
            </p>
            <p className="mt-2 text-600">
              Please check your inbox and use the temporary password to login.
            </p>
            <p className="mt-2 text-orange-600 font-medium">
              ⚠️ Remember to change your password after logging in for security.
            </p>
          </div>
        </div>
      </Dialog>
    </>
  );
}
