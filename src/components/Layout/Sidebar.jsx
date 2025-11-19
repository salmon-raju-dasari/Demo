import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { menuItems } from "../../config/menuConfig";
import { Ripple } from "primereact/ripple";
import "./Sidebar.css";

export const Sidebar = ({ visible = true, collapsed = false, onNavigate }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [expandedMenus, setExpandedMenus] = useState({});

  if (!visible) return null;

  const toggleSubmenu = (index) => {
    setExpandedMenus((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const isActive = (path) => {
    if (!path) return false;
    // Only exact match for submenu items
    return location.pathname === path;
  };

  const hasActiveChild = (items) => {
    if (!items) return false;
    return items.some(
      (item) => isActive(item.to) || hasActiveChild(item.items)
    );
  };

  const handleNavigation = (path) => {
    if (path) {
      navigate(path);
      if (onNavigate) {
        onNavigate();
      }
    }
  };

  const renderMenuItem = (item, index, isSubmenu = false) => {
    const hasSubmenu = item.items && item.items.length > 0;
    const isExpanded = expandedMenus[index];
    const active = isActive(item.to);
    const hasActiveChildItem = hasActiveChild(item.items);

    return (
      <div key={index} className="sidebar-menu-item-wrapper">
        <div
          className={`sidebar-menu-item ${
            active || hasActiveChildItem ? "active" : ""
          } ${isSubmenu ? "submenu-item" : ""}`}
          onClick={() => {
            if (hasSubmenu && !collapsed) {
              toggleSubmenu(index);
            } else {
              handleNavigation(item.to);
            }
          }}
          title={collapsed ? item.label : ""}
        >
          <div className="menu-item-content">
            <i className={`${item.icon} menu-icon`}></i>
            {!collapsed && <span className="menu-label">{item.label}</span>}
          </div>
          {hasSubmenu && !collapsed && (
            <i
              className={`pi pi-chevron-${
                isExpanded ? "down" : "right"
              } submenu-icon`}
            ></i>
          )}
          <Ripple />
        </div>
        {hasSubmenu && isExpanded && !collapsed && (
          <div className="submenu-container">
            {item.items.map((subItem, subIndex) =>
              renderMenuItem(subItem, `${index}-${subIndex}`, true)
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`sidebar-container ${collapsed ? "collapsed" : ""}`}>
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <i className="pi pi-shopping-bag"></i>
          <h2>POS System</h2>
        </div>
      </div>
      <div className="sidebar-menu">
        {menuItems.map((item, index) => renderMenuItem(item, index))}
      </div>
    </div>
  );
};
