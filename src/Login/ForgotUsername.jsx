import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "../services/api/auth.service";
import { Card } from "primereact/card";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { Dialog } from "primereact/dialog";
import { api } from "../services/api/axios";

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
        requestData.business_id = parseInt(businessId.trim());
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
      <div>
        <Card
          title="Forgot User ID"
          subTitle="Enter your email to receive your User ID(s)"
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
                className={`w-full ${emailError ? "p-invalid" : ""}`}
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setEmailError("");
                }}
                onKeyPress={handleKeyPress}
              />
              {emailError && (
                <small className="p-error block mt-1">{emailError}</small>
              )}
            </div>

            <div className="p-field">
              <label htmlFor="businessId" className="block mb-2 font-medium">
                Business ID <span className="text-gray-500">(Optional)</span>
              </label>
              <InputText
                id="businessId"
                type="text"
                placeholder="Enter Business ID (if known)"
                className="w-full"
                value={businessId}
                onChange={(e) =>
                  setBusinessId(e.target.value.replace(/\D/g, ""))
                }
                onKeyPress={handleKeyPress}
              />
              <small className="block mt-1 text-600">
                Enter Business ID to get User ID for a specific business only
              </small>
            </div>

            <small className="text-600 -mt-2">
              If you have multiple accounts with this email, all User IDs will
              be sent (unless Business ID is specified).
            </small>

            <Button
              label="Send User ID(s)"
              icon="pi pi-send"
              className="w-full"
              loading={loading}
              onClick={handleSendOTP}
            />

            <div className="flex flex-column gap-2 mt-3">
              <Button
                label="Back to Login"
                icon="pi pi-arrow-left"
                className="p-button-text"
                onClick={() =>
                  navigate("/login", { state: { fromForgotFlow: true } })
                }
              />
              <Button
                label="Forgot Password?"
                icon="pi pi-key"
                className="p-button-link"
                onClick={() => navigate("/forgot-password")}
              />
            </div>
          </div>
        </Card>
      </div>

      <Dialog
        header="Username Sent Successfully"
        visible={showSuccessDialog}
        style={{ width: "90vw", maxWidth: "500px" }}
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
        <div className="flex align-items-center gap-3">
          <i
            className="pi pi-check-circle text-green-500"
            style={{ fontSize: "3rem" }}
          ></i>
          <div>
            <p className="m-0 font-medium">
              Your User ID(s) have been sent to your email address.
            </p>
            <p className="mt-2 text-600">
              Please check your inbox. If you have multiple accounts, all User
              IDs will be listed with their business details.
            </p>
            <p className="mt-2 text-600">
              Use the appropriate User ID based on which business you want to
              access.
            </p>
          </div>
        </div>
      </Dialog>
    </>
  );
}
