import { Button } from "primereact/button";
import { Avatar } from "primereact/avatar";
import { Badge } from "primereact/badge";
import { tokenService } from "../../services/token.service";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Sidebar } from "./Sidebar";
import PaymentModal from "../PaymentModal";
import "./MainLayout.css";

export const MainLayout = ({ children }) => {
  const navigate = useNavigate();
  const userRole = tokenService.getUserRole();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [userId, setUserId] = useState(null);
  const [isOwner, setIsOwner] = useState(false);
  const [paymentMessage, setPaymentMessage] = useState("");

  // Check payment status on mount
  useEffect(() => {
    const checkPaymentStatus = async () => {
      const currentUserId = localStorage.getItem("user_id");
      if (currentUserId) {
        try {
          const API_BASE_URL =
            import.meta.env.VITE_API_BASE_URL || "http://192.168.1.2:8000/api";
          const response = await fetch(
            `${API_BASE_URL}/payment/status/${currentUserId}`
          );
          const data = await response.json();

          if (data.payment_completed) {
            localStorage.setItem(`payment_completed_${currentUserId}`, "true");
            setShowPaymentModal(false);
          } else {
            console.log("Payment status response:", data);
            console.log("Is owner:", data.is_owner);
            setUserId(currentUserId);
            setIsOwner(data.is_owner);
            setPaymentMessage(data.message || "");
            setShowPaymentModal(true);
          }
        } catch (error) {
          console.error("Error checking payment status:", error);
          const paymentCompleted = localStorage.getItem(
            `payment_completed_${currentUserId}`
          );
          if (!paymentCompleted || paymentCompleted !== "true") {
            setUserId(currentUserId);
            setIsOwner(true);
            setShowPaymentModal(true);
          }
        }
      }
    };

    checkPaymentStatus();
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

  const handleLogout = () => {
    tokenService.clearTokens();
    navigate("/login");
  };

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

            <div className="user-profile">
              <Avatar
                icon="pi pi-user"
                shape="circle"
                size="large"
                style={{ backgroundColor: "#667eea", color: "#ffffff" }}
              />
              <span className="user-role">{userRole || "User"}</span>
            </div>

            <Button
              icon="pi pi-sign-out"
              label="Logout"
              className="p-button-outlined p-button-danger logout-btn"
              onClick={handleLogout}
            />
          </div>
        </div>

        <div className="main-content">{children}</div>
      </div>
    </div>
  );
};
