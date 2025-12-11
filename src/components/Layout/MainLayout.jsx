import { Button } from "primereact/button";
import { Avatar } from "primereact/avatar";
import { Badge } from "primereact/badge";
import { tokenService } from "../../services/token.service";
import { useNavigate } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";
import { Sidebar } from "./Sidebar";
import PaymentModal from "../PaymentModal";
import api from "../../services/api/axios";
import "./MainLayout.css";

export const MainLayout = ({ children }) => {
  const navigate = useNavigate();
  const userRole = tokenService.getUserRole();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [userAvatar, setUserAvatar] = useState(null);
  const [userId, setUserId] = useState(null);
  const [isOwner, setIsOwner] = useState(false);
  const [paymentMessage, setPaymentMessage] = useState("");
  const [previousPaymentStatus, setPreviousPaymentStatus] = useState(null);

  // Function to check payment status only when expiry date is today
  const checkPaymentStatus = useCallback(async () => {
    const currentUserId = localStorage.getItem("user_id");
    const currentUserRole = tokenService.getUserRole();

    if (!currentUserId) return;

    console.log("Checking payment status");

    try {
      const API_BASE_URL =
        import.meta.env.VITE_API_BASE_URL || "http://192.168.1.2:8000/api";
      const response = await fetch(
        `${API_BASE_URL}/payment/status/${currentUserId}`
      );
      const data = await response.json();

      const currentPaymentStatus = data.payment_completed;

      // Handle expired payment
      if (data.expired) {
        console.log("Payment expired - showing modal");
        localStorage.removeItem(`payment_completed_${currentUserId}`);
        localStorage.removeItem(`payment_expires_at_${currentUserId}`);
        setUserId(currentUserId);
        setIsOwner(data.is_owner || currentUserRole === "owner");
        setPaymentMessage(data.message || "");
        setShowPaymentModal(true);
        setPreviousPaymentStatus(false);
        return;
      }

      // Only update if the status has actually changed
      if (
        previousPaymentStatus !== null &&
        previousPaymentStatus !== currentPaymentStatus
      ) {
        console.log(
          `Payment status changed: ${previousPaymentStatus} -> ${currentPaymentStatus}`
        );

        if (currentPaymentStatus) {
          // Payment completed (false -> true)
          localStorage.setItem(`payment_completed_${currentUserId}`, "true");
          setShowPaymentModal(false);
        } else {
          // Payment reverted (true -> false)
          localStorage.removeItem(`payment_completed_${currentUserId}`);
          setUserId(currentUserId);
          setIsOwner(data.is_owner || currentUserRole === "owner");
          setPaymentMessage(data.message || "");
          setShowPaymentModal(true);
        }
      } else if (previousPaymentStatus === null) {
        // Initial check - set modal based on current status
        if (currentPaymentStatus) {
          localStorage.setItem(`payment_completed_${currentUserId}`, "true");
          setShowPaymentModal(false);
        } else {
          console.log("Initial payment check - Payment not completed");
          setUserId(currentUserId);
          setIsOwner(data.is_owner || currentUserRole === "owner");
          setPaymentMessage(data.message || "");
          setShowPaymentModal(true);
        }
      }

      // Update the previous status for next comparison
      setPreviousPaymentStatus(currentPaymentStatus);
    } catch (error) {
      console.error("Error checking payment status:", error);
      const paymentCompleted = localStorage.getItem(
        `payment_completed_${currentUserId}`
      );
      if (!paymentCompleted || paymentCompleted !== "true") {
        console.log("Error case - Setting userId to:", currentUserId);
        setUserId(currentUserId);
        setIsOwner(currentUserRole === "owner");
        setShowPaymentModal(true);
      }
    }
  }, [
    previousPaymentStatus,
    setUserId,
    setIsOwner,
    setPaymentMessage,
    setShowPaymentModal,
    setPreviousPaymentStatus,
  ]); // Check payment status once per day (when expiry date is today)
  useEffect(() => {
    // Check on mount
    checkPaymentStatus();

    // Check once per day at midnight
    const checkAtMidnight = () => {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);

      const timeUntilMidnight = tomorrow - now;

      return setTimeout(() => {
        checkPaymentStatus();
        // Set up daily interval after first midnight check
        const dailyInterval = setInterval(
          checkPaymentStatus,
          24 * 60 * 60 * 1000
        );
        return dailyInterval;
      }, timeUntilMidnight);
    };

    const midnightTimeout = checkAtMidnight();

    // Cleanup on unmount
    return () => {
      clearTimeout(midnightTimeout);
    };
  }, [checkPaymentStatus]);

  // Load avatar from localStorage and fetch from DB
  useEffect(() => {
    const loadAvatar = async () => {
      try {
        // Fetch avatar from database
        const response = await api.get("/employees/me");
        if (response.data.avatar_base64) {
          const avatarDataUrl = `data:image/png;base64,${response.data.avatar_base64}`;
          setUserAvatar(avatarDataUrl);
          localStorage.setItem("user_avatar", avatarDataUrl);
        } else {
          // Fallback to localStorage if no avatar in DB
          const avatar = localStorage.getItem("user_avatar");
          setUserAvatar(avatar);
        }
      } catch (error) {
        console.error("Error loading avatar:", error);
        // Fallback to localStorage on error
        const avatar = localStorage.getItem("user_avatar");
        setUserAvatar(avatar);
      }
    };

    // Load on mount
    loadAvatar();

    // Listen for storage changes (when avatar is uploaded)
    const handleStorageChange = () => {
      loadAvatar();
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      if (mobile) {
        setSidebarCollapsed(true);
      } else {
        setSidebarCollapsed(true);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const closeSidebar = () => {
    setSidebarCollapsed(true);
  };

  const handlePaymentSuccess = () => {
    setShowPaymentModal(false);
  };

  return (
    <div className="main-layout">
      {/* Global Payment Modal */}
      {showPaymentModal && (
        <PaymentModal
          userId={userId}
          isOwner={isOwner}
          message={paymentMessage}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}
      {/* Overlay when sidebar is expanded */}
      {!sidebarCollapsed && (
        <div className="sidebar-overlay" onClick={closeSidebar}></div>
      )}

      <Sidebar
        visible={true}
        collapsed={sidebarCollapsed}
        onNavigate={closeSidebar}
      />

      <div
        className={`main-content-wrapper ${
          sidebarCollapsed ? "sidebar-collapsed" : ""
        }`}
      >
        <div className="topbar">
          <div className="topbar-start">
            <Button
              icon="pi pi-bars"
              className="p-button-rounded p-button-text toggle-btn"
              onClick={toggleSidebar}
              aria-label="Toggle Sidebar"
            />
          </div>

          <div className="topbar-end">
            <Button
              icon="pi pi-bell"
              className="p-button-rounded p-button-text p-button-icon-only notification-btn"
              aria-label="Notifications"
            >
              <Badge value="3" severity="danger" />
            </Button>

            <div className="user-profile" onClick={() => navigate("/profile")}>
              <Avatar
                image={userAvatar}
                icon={!userAvatar ? "pi pi-user" : null}
                shape="circle"
                size="large"
                style={{ backgroundColor: "#667eea", color: "#ffffff" }}
              />
              <span className="user-role">{userRole || "User"}</span>
            </div>
          </div>
        </div>

        <div className="main-content">{children}</div>
      </div>
    </div>
  );
};
