import { useState, useRef, useEffect } from "react";
import { Avatar } from "primereact/avatar";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { Chip } from "primereact/chip";
import { Card } from "primereact/card";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { Password } from "primereact/password";
import { tokenService } from "../../services/token.service";
import { useNavigate } from "react-router-dom";
import api from "../../services/api/axios";
import { compressImage } from "../../utils/imageCompression";
import "./ProfilePage.css";

export const ProfilePage = () => {
  const navigate = useNavigate();
  const toast = useRef(null);
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [employee, setEmployee] = useState(null);
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Fetch current employee data
  useEffect(() => {
    fetchEmployeeData();
    // Cleanup preview URL when component unmounts
    return () => {
      if (selectedImage && selectedImage.startsWith("blob:")) {
        URL.revokeObjectURL(selectedImage);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchEmployeeData = async () => {
    try {
      setLoading(true);
      const response = await api.get("/employees/me");
      setEmployee(response.data);

      // Set avatar from base64 data
      if (response.data.avatar_base64) {
        const avatarDataUrl = `data:image/png;base64,${response.data.avatar_base64}`;
        setAvatarUrl(avatarDataUrl);
        localStorage.setItem("user_avatar", avatarDataUrl);
      } else {
        setAvatarUrl(null);
        localStorage.removeItem("user_avatar");
      }
    } catch (error) {
      console.error("Error fetching employee data:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Failed to load profile data",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.current?.show({
        severity: "error",
        summary: "File Too Large",
        detail: "Avatar image must be less than 2MB",
        life: 3000,
      });
      event.target.value = "";
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.current?.show({
        severity: "error",
        summary: "Invalid File",
        detail: "Please upload an image file",
        life: 3000,
      });
      event.target.value = "";
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setSelectedImage(previewUrl);
    setSelectedFile(file);
    event.target.value = "";
  };

  const handleAvatarUpload = async () => {
    if (!selectedFile) {
      toast.current?.show({
        severity: "warn",
        summary: "No Image Selected",
        detail: "Please select an image first",
        life: 3000,
      });
      return;
    }

    try {
      setLoading(true);

      // Compress image before upload
      const compressedBlob = await compressImage(selectedFile, 500, 500, 0.7);

      const formData = new FormData();
      formData.append("avatar", compressedBlob, "avatar.jpg");

      const response = await api.post("/employees/upload-avatar", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      // Clean up preview URL
      if (selectedImage && selectedImage.startsWith("blob:")) {
        URL.revokeObjectURL(selectedImage);
      }

      // Clear preview state first
      setSelectedImage(null);
      setSelectedFile(null);

      // Update avatar from response
      const avatarDataUrl = `data:image/png;base64,${response.data.avatar_base64}`;
      setAvatarUrl(avatarDataUrl);
      localStorage.setItem("user_avatar", avatarDataUrl);
      window.dispatchEvent(new Event("storage"));

      // Fetch fresh data to ensure consistency
      await fetchEmployeeData();

      toast.current?.show({
        severity: "success",
        summary: "Avatar Updated",
        detail: "Your profile picture has been updated successfully",
        life: 3000,
      });
    } catch (error) {
      console.error("Error uploading avatar:", error);
      toast.current?.show({
        severity: "error",
        summary: "Upload Failed",
        detail: error.response?.data?.detail || "Failed to upload avatar",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenPasswordDialog = () => {
    setShowPasswordDialog(true);
  };

  const handleClosePasswordDialog = () => {
    setShowPasswordDialog(false);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.current?.show({
        severity: "warn",
        summary: "Validation Error",
        detail: "All password fields are required",
        life: 3000,
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.current?.show({
        severity: "warn",
        summary: "Validation Error",
        detail: "New password and confirm password do not match",
        life: 3000,
      });
      return;
    }

    if (newPassword.length < 6) {
      toast.current?.show({
        severity: "warn",
        summary: "Validation Error",
        detail: "Password must be at least 6 characters long",
        life: 3000,
      });
      return;
    }

    try {
      setLoading(true);
      await api.post("/employees/change-password", {
        current_password: currentPassword,
        new_password: newPassword,
      });

      toast.current?.show({
        severity: "success",
        summary: "Password Changed",
        detail: "Your password has been updated successfully",
        life: 3000,
      });

      handleClosePasswordDialog();
    } catch (error) {
      console.error("Error changing password:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: error.response?.data?.detail || "Failed to change password",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    tokenService.clearTokens();
    navigate("/login");
  };

  return (
    <div className="profile-page">
      <Toast ref={toast} position="top-right" />

      <div className="profile-page-content">
        {/* Avatar Section */}
        <Card className="profile-card avatar-card">
          <div className="avatar-section">
            <div className="avatar-container">
              <Avatar
                image={selectedImage || avatarUrl}
                icon={!selectedImage && !avatarUrl ? "pi pi-user" : undefined}
                shape="circle"
                className="profile-avatar"
                onClick={handleAvatarClick}
              />
              <div className="camera-overlay" onClick={handleAvatarClick}>
                <i className="pi pi-camera"></i>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={handleAvatarSelect}
              />
            </div>
            {employee && (
              <div className="avatar-info">
                <h2>{employee.name}</h2>
                <p className="employee-email">{employee.email}</p>
                <Chip label={employee.role} className="role-badge" />
              </div>
            )}
            {selectedFile && (
              <Button
                label="Upload Picture"
                icon="pi pi-upload"
                className="upload-btn"
                onClick={handleAvatarUpload}
                loading={loading}
              />
            )}
          </div>
        </Card>

        {loading && !employee ? (
          <div className="loading-container">
            <i className="pi pi-spin pi-spinner loading-icon"></i>
            <span>Loading Profile...</span>
          </div>
        ) : employee ? (
          <div className="profile-cards-grid">
            {/* Personal Information */}
            <Card className="profile-card">
              <h3 className="card-title">
                <i className="pi pi-user"></i>
                <span>Personal Information</span>
              </h3>
              <div className="info-list">
                <div className="info-row">
                  <span className="info-label">Employee ID</span>
                  <span className="info-value">USR{employee.emp_id}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Full Name</span>
                  <span className="info-value">{employee.name}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Email</span>
                  <span className="info-value">{employee.email}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Phone</span>
                  <span className="info-value">{employee.phone_number}</span>
                </div>
                {employee.joining_date && (
                  <div className="info-row">
                    <span className="info-label">Joining Date</span>
                    <span className="info-value">{employee.joining_date}</span>
                  </div>
                )}
              </div>
            </Card>

            {/* Security */}
            <Card className="profile-card">
              <h3 className="card-title">
                <i className="pi pi-lock"></i>
                <span>Security</span>
              </h3>
              <div className="security-actions">
                <Button
                  label="Change Password"
                  icon="pi pi-key"
                  className="p-button-outlined"
                  onClick={handleOpenPasswordDialog}
                />
              </div>
            </Card>

            {/* Logout Card */}
            <Card className="profile-card logout-card">
              <div className="logout-section">
                <h3 className="card-title">
                  <i className="pi pi-sign-out"></i>
                  <span>Session</span>
                </h3>
                <p className="logout-description">
                  End your current session and return to the login screen.
                </p>
                <Button
                  label="Logout"
                  icon="pi pi-sign-out"
                  className="p-button-danger logout-btn-full"
                  onClick={handleLogout}
                />
              </div>
            </Card>
          </div>
        ) : null}
      </div>

      {/* Change Password Dialog */}
      <Dialog
        header="Change Password"
        visible={showPasswordDialog}
        style={{ width: "95vw", maxWidth: "500px" }}
        onHide={handleClosePasswordDialog}
        draggable={false}
        resizable={false}
      >
        <div className="password-dialog-content">
          <div className="p-field">
            <label htmlFor="currentPassword">Current Password</label>
            <Password
              id="currentPassword"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
              toggleMask
              feedback={false}
              className="w-full"
              inputClassName="w-full"
            />
          </div>
          <div className="p-field">
            <label htmlFor="newPassword">New Password</label>
            <Password
              id="newPassword"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
              toggleMask
              className="w-full"
              inputClassName="w-full"
            />
          </div>
          <div className="p-field">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <Password
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              toggleMask
              feedback={false}
              className="w-full"
              inputClassName="w-full"
            />
          </div>
          <div className="dialog-button-group">
            <Button
              label="Cancel"
              icon="pi pi-times"
              className="p-button-text"
              onClick={handleClosePasswordDialog}
            />
            <Button
              label="Update Password"
              icon="pi pi-check"
              className="p-button-success"
              onClick={handleChangePassword}
              loading={loading}
            />
          </div>
        </div>
      </Dialog>
    </div>
  );
};
