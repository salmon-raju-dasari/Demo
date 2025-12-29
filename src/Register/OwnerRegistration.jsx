import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "primereact/card";
import { InputText } from "primereact/inputtext";
import { Password } from "primereact/password";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { api } from "../services/api/axios";

const OwnerRegistration = () => {
  const navigate = useNavigate();
  const toast = useRef(null);
  const [form, setForm] = useState({
    name: "",
    phone_number: "",
    email: "",
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
        import.meta.env.VITE_API_BASE_URL
      );
      const response = await api.post("/employees/register-owner", {
        name: form.name,
        email: form.email,
        phone_number: form.phone_number,
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
        6000
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
      <div className="flex justify-content-center mt-6">
        <Card
          title="Register Your Business - Owner"
          className="sm:max-w-100 w-[90%] m-auto p-2 border-round-lg shadow-2"
        >
          <form onSubmit={handleSubmit} className="p-fluid">
            <div className="field mb-3">
              <label className="block mb-2">
                Username <span className="text-red-500">*</span>
              </label>
              <InputText
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Enter username"
                className={`w-full ${errors.name ? "p-invalid" : ""}`}
              />
              {errors.name && (
                <small className="p-error block mt-1">{errors.name}</small>
              )}
            </div>
            <div className="field mb-3">
              <label className="block mb-2">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <InputText
                name="phone_number"
                value={form.phone_number}
                onChange={handleChange}
                placeholder="Enter phone number"
                className={`w-full ${errors.phone_number ? "p-invalid" : ""}`}
              />
              {errors.phone_number && (
                <small className="p-error block mt-1">
                  {errors.phone_number}
                </small>
              )}
            </div>
            <div className="field mb-3">
              <label className="block mb-2">
                Email <span className="text-red-500">*</span>
              </label>
              <InputText
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="Enter email"
                className={`w-full ${errors.email ? "p-invalid" : ""}`}
              />
              {errors.email && (
                <small className="p-error block mt-1">{errors.email}</small>
              )}
            </div>
            <div className="field mb-3">
              <label className="block mb-2">
                Password <span className="text-red-500">*</span>
              </label>
              <Password
                name="password"
                value={form.password}
                onChange={handleChange}
                feedback={false}
                toggleMask
                className={`w-full ${errors.password ? "p-invalid" : ""}`}
                inputClassName="w-full"
                placeholder="Enter password (min 8 characters)"
              />
              {errors.password && (
                <small className="p-error block mt-1">{errors.password}</small>
              )}
            </div>
            <div className="field mb-3">
              <label className="block mb-2">
                Confirm Password <span className="text-red-500">*</span>
              </label>
              <Password
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleChange}
                feedback={false}
                toggleMask
                className={`w-full ${
                  errors.confirmPassword ? "p-invalid" : ""
                }`}
                inputClassName="w-full"
                placeholder="Confirm password"
              />
              {errors.confirmPassword && (
                <small className="p-error block mt-1">
                  {errors.confirmPassword}
                </small>
              )}
            </div>

            <div className="flex flex-col sm:flex-row align-items-center gap-3 mt-2">
              <Button
                type="submit"
                label={loading ? "Registering..." : "Register Owner"}
                className="w-full"
                loading={loading}
              />
              <Button
                type="button"
                label="Back to Login"
                className="w-full p-button-secondary"
                onClick={() => navigate("/login")}
              />
            </div>
          </form>
        </Card>
      </div>
    </>
  );
};

export default OwnerRegistration;
