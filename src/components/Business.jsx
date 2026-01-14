import { useState, useRef, useEffect } from "react";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Toast } from "primereact/toast";
import { FileUpload } from "primereact/fileupload";
import { Image } from "primereact/image";
import { Card } from "primereact/card";
import { InputTextarea } from "primereact/inputtextarea";
import { Dialog } from "primereact/dialog";
import { ProgressSpinner } from "primereact/progressspinner";
import api from "../services/api/axios";
import "../styles/business.css";

export default function Business() {
  const toast = useRef(null);
  const fileUploadRef = useRef(null);
  const formDataRef = useRef(null);
  const hasFetchedRef = useRef(false);

  const [loading, setLoading] = useState(false);
  const [businessExists, setBusinessExists] = useState(false);
  const [logoPreview, setLogoPreview] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    business_name: "",
    business_type: "",
    category: "",
    owner_name: "",
    phone_number: "",
    email: "",
    gst_number: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    country: "",
    invoice_prefix: "",
    bank_account_number: "",
    ifsc_code: "",
    upi_id: "",
  });

  const businessTypes = [
    { label: "Retail Store", value: "Retail Store" },
    { label: "Supermarket", value: "Supermarket" },
    { label: "Grocery Store", value: "Grocery Store" },
    { label: "Convenience Store", value: "Convenience Store" },
    { label: "Department Store", value: "Department Store" },
    { label: "Wholesale", value: "Wholesale" },
    { label: "E-commerce", value: "E-commerce" },
    { label: "Other", value: "Other" },
  ];

  const categories = [
    { label: "Food & Beverages", value: "Food & Beverages" },
    { label: "Electronics", value: "Electronics" },
    { label: "Clothing & Apparel", value: "Clothing & Apparel" },
    { label: "Home & Furniture", value: "Home & Furniture" },
    { label: "Health & Beauty", value: "Health & Beauty" },
    { label: "Sports & Outdoors", value: "Sports & Outdoors" },
    { label: "Books & Stationery", value: "Books & Stationery" },
    { label: "Toys & Games", value: "Toys & Games" },
    { label: "Automotive", value: "Automotive" },
    { label: "General Merchandise", value: "General Merchandise" },
  ];

  const countries = [
    { label: "India", value: "India" },
    { label: "United States", value: "United States" },
    { label: "United Kingdom", value: "United Kingdom" },
    { label: "Canada", value: "Canada" },
    { label: "Australia", value: "Australia" },
  ];

  // Fetch business details on mount
  useEffect(() => {
    // Prevent duplicate fetch in React Strict Mode (dev environment)
    if (!hasFetchedRef.current) {
      hasFetchedRef.current = true;
      fetchBusinessDetails();
    }
  }, []);

  const fetchBusinessDetails = async (skipInfoToast = false) => {
    try {
      setLoading(true);
      const response = await api.get("/business");
      if (response.data) {
        setFormData(response.data);
        formDataRef.current = response.data; // Sync ref
        setBusinessExists(true);

        // Load logo if exists (using has_logo field)
        if (response.data.has_logo) {
          try {
            // Fetch logo as blob to handle CORS in Electron
            const logoResponse = await api.get("/business/logo", {
              responseType: "blob",
            });
            const logoBlob = new Blob([logoResponse.data], {
              type: logoResponse.headers["content-type"] || "image/jpeg",
            });
            const logoUrl = URL.createObjectURL(logoBlob);
            setLogoPreview(logoUrl);
          } catch (logoError) {
            console.error("Error loading logo:", logoError);
            setLogoPreview(null);
          }
        } else {
          setLogoPreview(null);
        }
      }
    } catch (error) {
      if (error.response?.status === 404) {
        // Business doesn't exist yet, stay in create mode
        setBusinessExists(false);
        // Show informational message for first-time users only on initial load
        if (!skipInfoToast) {
          const detailMessage =
            error.response?.data?.detail ||
            "No business details found. Please create your business profile first to get started.";

          toast.current?.show({
            severity: "info",
            summary: "No Business Profile Found",
            detail: detailMessage,
            life: 6000,
          });
        }
      } else {
        console.error("Error fetching business details:", error);
        // Only show error toast if not in the middle of submit operation
        if (!skipInfoToast) {
          toast.current?.show({
            severity: "error",
            summary: "Error Loading Business",
            detail:
              error.response?.data?.detail ||
              "Failed to load business details. Please try again.",
            life: 4000,
          });
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };
      formDataRef.current = updated; // Update ref immediately
      return updated;
    });
    // Remove error for this field as soon as user starts entering/selecting value
    if (value !== null && value !== "" && value !== undefined) {
      setErrors((prev) => {
        const updated = { ...prev };
        delete updated[field];
        return updated;
      });
    }
  };

  const handleSubmit = async () => {
    // Prevent double submission
    if (loading) {
      console.log("Submission already in progress, ignoring duplicate call");
      return;
    }

    try {
      // Use ref to get the most current form data (handles async state updates)
      const currentFormData = formDataRef.current || formData;

      // Validate required fields
      const newErrors = {};
      if (
        !currentFormData.business_name ||
        !currentFormData.business_name.trim()
      ) {
        newErrors.business_name = "Business name is required";
      }
      if (!currentFormData.owner_name || !currentFormData.owner_name.trim()) {
        newErrors.owner_name = "Owner name is required";
      }
      if (
        !currentFormData.phone_number ||
        !currentFormData.phone_number.trim()
      ) {
        newErrors.phone_number = "Phone number is required";
      }
      if (!currentFormData.email || !currentFormData.email.trim()) {
        newErrors.email = "Email is required";
      }

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        toast.current?.show({
          severity: "warn",
          summary: "Validation Error",
          detail:
            "Please fill in all required fields (Business Name, Owner Name, Phone, Email)",
          life: 4000,
        });
        return;
      }

      // Clear errors if validation passes
      setErrors({});

      setLoading(true);

      console.log(
        `Submitting business ${businessExists ? "update" : "create"}:`,
        currentFormData
      );

      let response;
      if (businessExists) {
        // Update existing business
        response = await api.put("/business", currentFormData);

        // Check if response is actually a validation error (422)
        if (response.status === 422) {
          throw { response }; // Throw to trigger catch block
        }

        console.log("Update response:", response.data);
        toast.current?.show({
          severity: "success",
          summary: "Updated",
          detail: "Business details updated successfully",
          life: 3000,
        });
      } else {
        // Create new business
        response = await api.post("/business", currentFormData);

        // Check if response is actually a validation error (422)
        if (response.status === 422) {
          throw { response }; // Throw to trigger catch block
        }

        console.log("Create response:", response.data);
        setBusinessExists(true);
        toast.current?.show({
          severity: "success",
          summary: "Created",
          detail: "Business details created successfully",
          life: 3000,
        });
      }

      // Upload logo if selected
      if (uploadedFile) {
        await uploadLogo();
      }

      // Refresh business details without showing info toast
      await fetchBusinessDetails(true);
    } catch (error) {
      console.error("Error saving business:", error);

      let errorMessage =
        "Failed to save business details. Please check your input and try again.";
      let severity = "error";
      let summary = "Save Failed";

      // Handle different error status codes
      if (error.response?.status === 422) {
        // Pydantic validation errors
        severity = "warn";
        summary = "Invalid Input";

        // Extract validation errors from Pydantic format
        if (error.response?.data?.detail) {
          if (Array.isArray(error.response.data.detail)) {
            // Pydantic returns array of validation errors
            const errors = error.response.data.detail;
            const emailError = errors.find((err) => err.loc?.includes("email"));

            if (emailError) {
              errorMessage = `Email validation failed: ${
                emailError.msg || "Please enter a valid email address"
              }`;
            } else {
              // Combine all validation errors
              errorMessage = errors
                .map((err) => {
                  const field = err.loc?.slice(-1)[0] || "field";
                  return `${field}: ${err.msg}`;
                })
                .join("; ");
            }
          } else if (typeof error.response.data.detail === "string") {
            errorMessage = error.response.data.detail;
          }
        }
      } else if (error.response?.status === 400) {
        severity = "warn";
        summary = "Validation Error";
        errorMessage = error.response?.data?.detail || errorMessage;
      } else if (error.response?.status === 409) {
        severity = "warn";
        summary = "Conflict";
        errorMessage = error.response?.data?.detail || errorMessage;
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      }

      toast.current?.show({
        severity: severity,
        summary: summary,
        detail: errorMessage,
        life: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  const uploadLogo = async () => {
    try {
      const formData = new FormData();
      formData.append("file", uploadedFile);

      const response = await api.post("/business/upload-logo", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      // Show success with file size if available
      const detail = response.data?.file_size_mb
        ? `Logo uploaded successfully (${response.data.file_size_mb} MB)`
        : "Business logo uploaded successfully";

      toast.current?.show({
        severity: "success",
        summary: "Logo Uploaded",
        detail: detail,
        life: 3000,
      });

      setUploadedFile(null);
      if (fileUploadRef.current) {
        fileUploadRef.current.clear();
      }

      // Reload business details to update logo preview (skip info toast)
      fetchBusinessDetails(true);
    } catch (error) {
      console.error("Error uploading logo:", error);

      // Determine severity and summary based on error type
      const severity = error.response?.status === 400 ? "warn" : "error";
      const summary =
        error.response?.status === 400 ? "Invalid File" : "Upload Failed";

      toast.current?.show({
        severity: severity,
        summary: summary,
        detail:
          error.response?.data?.detail ||
          "Failed to upload logo. Please try again with a different image.",
        life: 5000,
      });
    }
  };

  const onFileSelect = (e) => {
    const file = e.files[0];
    setUploadedFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onload = (event) => {
      setLogoPreview(event.target.result);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="business-container">
      <Toast ref={toast} />
      
      {/* Loading Dialog */}
      <Dialog
        visible={loading}
        modal
        closable={false}
        showHeader={false}
        style={{ width: '220px', borderRadius: '12px', overflow: 'hidden' }}
        contentStyle={{ 
          padding: '2rem',
          textAlign: 'center',
          border: 'none',
          borderRadius: '12px'
        }}
      >
        <ProgressSpinner 
          style={{ width: '50px', height: '50px' }} 
          strokeWidth="4"
        />
        <p style={{ marginTop: '1rem', marginBottom: '0.25rem', fontWeight: '600' }}>Business Details</p>
        <p style={{ marginTop: 0, marginBottom: 0, fontSize: '0.875rem', color: '#666' }}>Loading...</p>
      </Dialog>

      <div className="business-header">
        <h2>
          <i className="pi pi-building"></i> Business Management
        </h2>
        <p>Configure your business details and settings</p>
      </div>

      <Card className="business-form-card">
        <div className="business-form">
          {/* Logo Section */}
          <div className="form-section logo-section">
            <h3>Business Logo</h3>
            <div className="logo-upload-area">
              {logoPreview && (
                <div className="logo-preview">
                  <Image
                    src={logoPreview}
                    alt="Business Logo"
                    width="150"
                    preview
                  />
                </div>
              )}
              <FileUpload
                ref={fileUploadRef}
                mode="basic"
                accept="image/*"
                maxFileSize={5000000}
                onSelect={onFileSelect}
                chooseLabel="Choose Logo"
                className="logo-upload-btn"
                auto={false}
              />
              <small className="text-muted">
                Max size: 5MB. Formats: JPG, PNG, GIF, WebP
              </small>
            </div>
          </div>

          {/* Basic Information */}
          <div className="form-section">
            <h3>Basic Information</h3>
            <div className="form-grid">
              <div className="form-field">
                <label htmlFor="business_name">
                  Business Name <span className="required">*</span>
                </label>
                <InputText
                  id="business_name"
                  value={formData.business_name}
                  onChange={(e) =>
                    handleChange("business_name", e.target.value)
                  }
                  placeholder="Enter business name"
                  className={errors.business_name ? "p-invalid" : ""}
                />
                {errors.business_name && (
                  <small className="p-error">{errors.business_name}</small>
                )}
              </div>

              <div className="form-field">
                <label htmlFor="business_type">Business Type</label>
                <Dropdown
                  id="business_type"
                  value={formData.business_type}
                  options={businessTypes}
                  onChange={(e) => handleChange("business_type", e.value)}
                  placeholder="Select business type"
                  filter
                />
              </div>

              <div className="form-field">
                <label htmlFor="category">Category</label>
                <Dropdown
                  id="category"
                  value={formData.category}
                  options={categories}
                  onChange={(e) => handleChange("category", e.value)}
                  placeholder="Select category"
                  filter
                />
              </div>

              <div className="form-field">
                <label htmlFor="invoice_prefix">Invoice Prefix</label>
                <InputText
                  id="invoice_prefix"
                  value={formData.invoice_prefix}
                  onChange={(e) =>
                    handleChange("invoice_prefix", e.target.value)
                  }
                  placeholder="e.g., INV"
                />
              </div>
            </div>
          </div>

          {/* Owner Information */}
          <div className="form-section">
            <h3>Owner Information</h3>
            <div className="form-grid">
              <div className="form-field">
                <label htmlFor="owner_name">
                  Owner Name <span className="required">*</span>
                </label>
                <InputText
                  id="owner_name"
                  value={formData.owner_name}
                  onChange={(e) => handleChange("owner_name", e.target.value)}
                  placeholder="Enter owner name"
                  className={errors.owner_name ? "p-invalid" : ""}
                />
                {errors.owner_name && (
                  <small className="p-error">{errors.owner_name}</small>
                )}
              </div>

              <div className="form-field">
                <label htmlFor="phone_number">
                  Phone Number <span className="required">*</span>
                </label>
                <InputText
                  id="phone_number"
                  value={formData.phone_number}
                  onChange={(e) => handleChange("phone_number", e.target.value)}
                  placeholder="Enter phone number"
                  className={errors.phone_number ? "p-invalid" : ""}
                />
                {errors.phone_number && (
                  <small className="p-error">{errors.phone_number}</small>
                )}
              </div>

              <div className="form-field">
                <label htmlFor="email">
                  Email <span className="required">*</span>
                </label>
                <InputText
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  placeholder="Enter email address"
                  className={errors.email ? "p-invalid" : ""}
                />
                {errors.email && (
                  <small className="p-error">{errors.email}</small>
                )}
              </div>

              <div className="form-field">
                <label htmlFor="gst_number">GST Number</label>
                <InputText
                  id="gst_number"
                  value={formData.gst_number}
                  onChange={(e) => handleChange("gst_number", e.target.value)}
                  placeholder="Enter GST number"
                />
              </div>
            </div>
          </div>

          {/* Address Information */}
          <div className="form-section">
            <h3>Address Information</h3>
            <div className="form-grid">
              <div className="form-field full-width">
                <label htmlFor="address">Address</label>
                <InputTextarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleChange("address", e.target.value)}
                  placeholder="Enter business address"
                  rows={3}
                />
              </div>

              <div className="form-field">
                <label htmlFor="city">City</label>
                <InputText
                  id="city"
                  value={formData.city}
                  onChange={(e) => handleChange("city", e.target.value)}
                  placeholder="Enter city"
                />
              </div>

              <div className="form-field">
                <label htmlFor="state">State</label>
                <InputText
                  id="state"
                  value={formData.state}
                  onChange={(e) => handleChange("state", e.target.value)}
                  placeholder="Enter state"
                />
              </div>

              <div className="form-field">
                <label htmlFor="pincode">Pincode</label>
                <InputText
                  id="pincode"
                  value={formData.pincode}
                  onChange={(e) => handleChange("pincode", e.target.value)}
                  placeholder="Enter pincode"
                />
              </div>

              <div className="form-field">
                <label htmlFor="country">Country</label>
                <Dropdown
                  id="country"
                  value={formData.country}
                  options={countries}
                  onChange={(e) => handleChange("country", e.value)}
                  placeholder="Select country"
                  filter
                />
              </div>
            </div>
          </div>

          {/* Banking Information */}
          <div className="form-section">
            <h3>Banking Information</h3>
            <div className="form-grid">
              <div className="form-field">
                <label htmlFor="bank_account_number">Bank Account Number</label>
                <InputText
                  id="bank_account_number"
                  value={formData.bank_account_number}
                  onChange={(e) =>
                    handleChange("bank_account_number", e.target.value)
                  }
                  placeholder="Enter account number"
                />
              </div>

              <div className="form-field">
                <label htmlFor="ifsc_code">IFSC Code</label>
                <InputText
                  id="ifsc_code"
                  value={formData.ifsc_code}
                  onChange={(e) => handleChange("ifsc_code", e.target.value)}
                  placeholder="Enter IFSC code"
                />
              </div>

              <div className="form-field">
                <label htmlFor="upi_id">UPI ID</label>
                <InputText
                  id="upi_id"
                  value={formData.upi_id}
                  onChange={(e) => handleChange("upi_id", e.target.value)}
                  placeholder="Enter UPI ID"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="form-actions">
            <Button
              label={
                businessExists
                  ? "Update Business Details"
                  : "Create Business Details"
              }
              icon="pi pi-check"
              onClick={handleSubmit}
              loading={loading}
              disabled={loading}
              className="save-btn"
            />
          </div>
        </div>
      </Card>
    </div>
  );
}
