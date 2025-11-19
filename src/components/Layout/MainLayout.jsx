import { Button } from "primereact/button";
import { Avatar } from "primereact/avatar";
import { Badge } from "primereact/badge";
import { tokenService } from "../../services/token.service";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Sidebar } from "./Sidebar";
import "./MainLayout.css";

export const MainLayout = ({ children }) => {
  const navigate = useNavigate();
  const userRole = tokenService.getUserRole();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);

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

  return (
    <div className="main-layout">
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
