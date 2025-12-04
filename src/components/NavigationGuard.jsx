import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

export default function NavigationGuard({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkPaymentAndBlockNavigation = async () => {
      const currentUserId = localStorage.getItem("user_id");

      if (!currentUserId) {
        setChecking(false);
        return; // Not logged in, allow navigation
      }

      try {
        // Check payment status from backend
        const API_BASE_URL =
          import.meta.env.VITE_API_BASE_URL || "http://192.168.1.2:8000/api";
        const response = await fetch(
          `${API_BASE_URL}/payment/status/${currentUserId}`
        );
        const data = await response.json();

        if (data.payment_completed) {
          // Update localStorage to match backend
          localStorage.setItem(`payment_completed_${currentUserId}`, "true");
          setChecking(false);
          return;
        }

        // Payment not completed - block navigation
        if (
          location.pathname !== "/dashboard" &&
          location.pathname !== "/login" &&
          location.pathname !== "/"
        ) {
          navigate("/dashboard", { replace: true });
        }
      } catch (error) {
        console.error("Error checking payment status:", error);
        // Fallback to localStorage
        const paymentCompleted = localStorage.getItem(
          `payment_completed_${currentUserId}`
        );

        if (
          (!paymentCompleted || paymentCompleted !== "true") &&
          location.pathname !== "/dashboard" &&
          location.pathname !== "/login" &&
          location.pathname !== "/"
        ) {
          navigate("/dashboard", { replace: true });
        }
      } finally {
        setChecking(false);
      }
    };

    checkPaymentAndBlockNavigation();
  }, [location.pathname, navigate]);

  if (checking) {
    return null; // Or a loading spinner
  }

  return children;
}
