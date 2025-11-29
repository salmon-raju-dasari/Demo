import React from "react";
import { ProgressSpinner } from "primereact/progressspinner";
import "./LoadingSpinner.css";

/**
 * LoadingSpinner Component
 * Reusable loading spinner with customizable message and overlay
 * Uses PrimeReact ProgressSpinner for consistency
 */
export default function LoadingSpinner({
  isLoading = false,
  message = "Loading...",
  fullScreen = false,
  overlay = true,
  size = "md",
  strokeWidth = "4",
  show = true,
}) {
  if (!show || !isLoading) return null;

  const spinnerContent = (
    <div className={`loading-spinner-container loading-spinner-${size}`}>
      <ProgressSpinner
        style={{
          width: size === "sm" ? "40px" : size === "lg" ? "80px" : "60px",
          height: size === "sm" ? "40px" : size === "lg" ? "80px" : "60px",
        }}
        strokeWidth={strokeWidth}
        animationDuration=".5s"
      />
      {message && <p className="loading-spinner-message">{message}</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="loading-spinner-fullscreen">
        {overlay && <div className="loading-spinner-overlay" />}
        {spinnerContent}
      </div>
    );
  }

  return (
    <div className="loading-spinner-inline">
      {overlay && <div className="loading-spinner-overlay-inline" />}
      {spinnerContent}
    </div>
  );
}

/**
 * LoadingOverlay - Alternative export for overlay-only loading state
 */
export function LoadingOverlay({ isLoading = false, message = "Loading..." }) {
  return (
    <LoadingSpinner
      isLoading={isLoading}
      message={message}
      fullScreen={false}
      overlay={true}
      size="md"
      show={true}
    />
  );
}
