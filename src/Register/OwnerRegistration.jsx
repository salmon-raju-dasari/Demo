import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { InputText } from "primereact/inputtext";
import { Password } from "primereact/password";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { api } from "../services/api/axios";
import "../Login/Login.css";

const OwnerRegistration = () => {
  const navigate = useNavigate();
  const toast = useRef(null);
  const [form, setForm] = useState({
    name: "",
    phone_number: "",
    email: "",
    business_name: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const showToast = (severity, summary, detail, life = 3000) => {
    toast.current?.show({ severity, summary, detail, life });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate all fields
    const newErrors = {};
    if (!form.name || !form.name.trim()) {
      newErrors.name = "Username is required";
    }
    if (!form.email || !form.email.trim()) {
      newErrors.email = "Email is required";
    }
    if (!form.business_name || !form.business_name.trim()) {
      newErrors.business_name = "Business name is required";
    }
    if (!form.phone_number || !form.phone_number.trim()) {
      newErrors.phone_number = "Phone number is required";
    }
    if (!form.password || form.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }
    if (!form.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (form.password !== form.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    // If there are errors, set them and return
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      showToast("warn", "Validation Error", "Please fix the errors below");
      return;
    }

    try {
      setLoading(true);
      console.log(
        "Submitting registration with API base URL:",
        import.meta.env.VITE_API_BASE_URL,
      );
      const response = await api.post("/employees/register-owner", {
        name: form.name,
        email: form.email,
        phone_number: form.phone_number,
        business_name: form.business_name,
        password: form.password,
        confirm_password: form.confirmPassword,
      });
      console.log("Registration response:", response); // Check if response is a validation error (422)
      if (response.status === 422) {
        let detail = "Validation failed";
        const errors = response.data?.detail;
        if (Array.isArray(errors)) {
          detail = errors
            .map((e) => {
              let field = e.loc?.[e.loc.length - 1] || "field";
              if (field === "name") field = "username";
              const msg = e.msg || "Invalid value";
              return `${field.replace("_", " ")}: ${msg}`;
            })
            .join("; ");
        } else if (typeof errors === "string") {
          detail = errors;
        }
        showToast("error", "Validation Error", detail);
        setLoading(false);
        return;
      }

      // Success case
      const userId = response.data?.user_id || `USR${response.data?.emp_id}`;
      const businessId = response.data?.business_id || "N/A";
      showToast(
        "success",
        "Registration Successful",
        `Account created! Your User ID: ${userId}, Business ID: ${businessId}. Please use your User ID to login.`,
        6000,
      );
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      console.error("Registration error:", err);
      console.error("Error response:", err.response);
      console.error("Error config:", err.config);
      let detail = "Registration failed";

      // Handle FastAPI validation errors (422)
      if (err?.response?.status === 422 && err?.response?.data?.detail) {
        const errors = err.response.data.detail;
        if (Array.isArray(errors)) {
          // Extract validation error messages
          detail = errors
            .map((e) => {
              let field = e.loc?.[e.loc.length - 1] || "field";
              if (field === "name") field = "username";
              return `${field}: ${e.msg}`;
            })
            .join("; ");
        } else {
          detail = err.response.data.detail;
        }
      } else {
        detail =
          err?.response?.data?.detail || err.message || "Registration failed";
      }

      showToast("error", "Registration Error", detail);
    } finally {
      setLoading(false);
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
              <i className="pi pi-user-plus"></i>
            </div>
            <h1 className="login-title">Create Account</h1>
            <p className="login-subtitle">Business Owner Registration</p>
          </div>

          {/* Form Content */}
          <div className="login-content">
            <form onSubmit={handleSubmit}>
              {/* Username Field */}
              <div className="form-group">
                <label htmlFor="name">
                  <i
                    className="pi pi-user"
                    style={{ marginRight: "0.5rem" }}
                  ></i>
                  Username
                </label>
                <InputText
                  id="name"
                  name="name"
                  placeholder="Enter username"
                  className={`login-input ${errors.name ? "p-invalid" : ""}`}
                  value={form.name}
                  onChange={handleChange}
                />
                {errors.name && (
                  <small className="p-error block mt-1">{errors.name}</small>
                )}
              </div>

              {/* Email Field */}
              <div className="form-group">
                <label htmlFor="email">
                  <i
                    className="pi pi-envelope"
                    style={{ marginRight: "0.5rem" }}
                  ></i>
                  Email
                </label>
                <InputText
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Enter email"
                  className={`login-input ${errors.email ? "p-invalid" : ""}`}
                  value={form.email}
                  onChange={handleChange}
                />
                {errors.email && (
                  <small className="p-error block mt-1">{errors.email}</small>
                )}
              </div>

              {/* Phone Number Field */}
              <div className="form-group">
                <label htmlFor="phone_number">
                  <i
                    className="pi pi-phone"
                    style={{ marginRight: "0.5rem" }}
                  ></i>
                  Phone Number
                </label>
                <InputText
                  id="phone_number"
                  name="phone_number"
                  placeholder="Enter phone number"
                  className={`login-input ${
                    errors.phone_number ? "p-invalid" : ""
                  }`}
                  value={form.phone_number}
                  onChange={handleChange}
                />
                {errors.phone_number && (
                  <small className="p-error block mt-1">
                    {errors.phone_number}
                  </small>
                )}
              </div>

              {/* Business Name Field */}
              <div className="form-group">
                <label htmlFor="business_name">
                  <i
                    className="pi pi-building"
                    style={{ marginRight: "0.5rem" }}
                  ></i>
                  Business Name
                </label>
                <InputText
                  id="business_name"
                  name="business_name"
                  placeholder="Enter business name"
                  className={`login-input ${
                    errors.business_name ? "p-invalid" : ""
                  }`}
                  value={form.business_name}
                  onChange={handleChange}
                />
                {errors.business_name && (
                  <small className="p-error block mt-1">
                    {errors.business_name}
                  </small>
                )}
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
                  name="password"
                  placeholder="Enter password (min 8 characters)"
                  className={`login-input ${
                    errors.password ? "p-invalid" : ""
                  }`}
                  value={form.password}
                  onChange={handleChange}
                  feedback={false}
                  toggleMask={true}
                />
                {errors.password && (
                  <small className="p-error block mt-1">{errors.password}</small>
                )}
              </div>

              {/* Confirm Password Field */}
              <div className="form-group">
                <label htmlFor="confirmPassword">
                  <i
                    className="pi pi-lock"
                    style={{ marginRight: "0.5rem" }}
                  ></i>
                  Confirm Password
                </label>
                <Password
                  inputId="confirmPassword"
                  name="confirmPassword"
                  placeholder="Confirm password"
                  className={`login-input ${
                    errors.confirmPassword ? "p-invalid" : ""
                  }`}
                  value={form.confirmPassword}
                  onChange={handleChange}
                  feedback={false}
                  toggleMask={true}
                />
                {errors.confirmPassword && (
                  <small className="p-error block mt-1">
                    {errors.confirmPassword}
                  </small>
                )}
              </div>

              {/* Action Buttons */}
              <div className="button-group">
                <Button
                  type="submit"
                  label={loading ? "Registering..." : "Register"}
                  loading={loading}
                  className="login-btn-primary"
                  style={{ width: "100%", borderRadius: "8px" }}
                />
                <Button
                  type="button"
                  label="Back to Login"
                  onClick={() => navigate("/login")}
                  className="login-btn-secondary"
                  style={{ width: "100%", borderRadius: "8px" }}
                />
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default OwnerRegistration;
