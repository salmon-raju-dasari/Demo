import { createContext, useContext, useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const PaymentContext = createContext();

export const usePayment = () => {
  const context = useContext(PaymentContext);
  if (!context) {
    throw new Error("usePayment must be used within PaymentProvider");
  }
  return context;
};

export const PaymentProvider = ({ children }) => {
  const [paymentRequired, setPaymentRequired] = useState(false);
  const [userId, setUserId] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Check payment status on mount and route changes
  useEffect(() => {
    const checkPaymentStatus = () => {
      const currentUser = localStorage.getItem("user_id");
      if (!currentUser) {
        setPaymentRequired(false);
        return;
      }

      const paymentCompleted = localStorage.getItem(
        `payment_completed_${currentUser}`
      );

      if (!paymentCompleted || paymentCompleted !== "true") {
        setPaymentRequired(true);
        setUserId(currentUser);

        // Redirect to dashboard if not already there
        if (location.pathname !== "/dashboard") {
          navigate("/dashboard", { replace: true });
        }
      } else {
        setPaymentRequired(false);
      }
    };

    checkPaymentStatus();
  }, [location.pathname, navigate]);

  const markPaymentComplete = (user_id) => {
    localStorage.setItem(`payment_completed_${user_id}`, "true");
    setPaymentRequired(false);
  };

  const requirePayment = (user_id) => {
    setUserId(user_id);
    setPaymentRequired(true);
  };

  return (
    <PaymentContext.Provider
      value={{
        paymentRequired,
        userId,
        markPaymentComplete,
        requirePayment,
      }}
    >
      {children}
    </PaymentContext.Provider>
  );
};
