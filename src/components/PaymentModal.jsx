import { useState, useEffect, useRef } from "react";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { ProgressSpinner } from "primereact/progressspinner";
import axios from "axios";
import { Capacitor } from "@capacitor/core";
import { Checkout } from "capacitor-razorpay";
import "./PaymentModal.css";

export default function PaymentModal({
  userId,
  isOwner,
  message,
  onPaymentSuccess,
}) {
  const [visible, setVisible] = useState(true);
  const [loading, setLoading] = useState(false);
  const [paymentVerifying, setPaymentVerifying] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const scriptLoaded = useRef(false);
  const isCapacitor = Capacitor.isNativePlatform();

  console.log("PaymentModal Props:", { userId, isOwner, message });

  useEffect(() => {
    // Only load Razorpay script for web (not for Capacitor)
    if (!isCapacitor) {
      const loadRazorpayScript = () => {
        return new Promise((resolve) => {
          if (scriptLoaded.current) {
            resolve(true);
            return;
          }

          const script = document.createElement("script");
          script.src = "https://checkout.razorpay.com/v1/checkout.js";
          script.onload = () => {
            scriptLoaded.current = true;
            resolve(true);
          };
          script.onerror = () => resolve(false);
          document.body.appendChild(script);
        });
      };

      loadRazorpayScript();
    }

    // Prevent navigation when payment is pending
    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = "Payment is pending. Are you sure you want to leave?";
      return e.returnValue;
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isCapacitor]);

  const handlePayment = async () => {
    try {
      setLoading(true);
      setErrorMessage(""); // Clear previous errors
      setSuccessMessage(""); // Clear previous success messages

      // Validate userId before making payment
      if (!userId) {
        setErrorMessage("User ID not found. Please log in again.");
        setLoading(false);
        return;
      }

      console.log("Creating payment order for userId:", userId);

      // Create order on backend
      const API_BASE_URL =
        import.meta.env.VITE_API_BASE_URL || "http://192.168.1.2:8000/api";
      const orderResponse = await axios.post(
        `${API_BASE_URL}/payment/create-order`,
        {
          user_id: userId,
          amount: 100, // ₹1 in paise (1 * 100)
        }
      );

      const { order_id, amount, currency } = orderResponse.data;

      if (isCapacitor) {
        // Use Capacitor Razorpay for Android
        await handleCapacitorPayment(order_id, amount, currency);
      } else {
        // Use web Razorpay for browser
        await handleWebPayment(order_id, amount, currency);
      }
    } catch (error) {
      console.error("Payment error:", error);

      // Extract user-friendly error message
      let errorMsg = "Failed to initiate payment. Please try again.";

      if (error.response?.data?.detail) {
        errorMsg = error.response.data.detail;
      } else if (error.message) {
        errorMsg = error.message;
      }

      setErrorMessage(errorMsg);
      setLoading(false);
    }
  };

  const handleWebPayment = async (order_id, amount, currency) => {
    try {
      // Load Razorpay script if not loaded
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        setErrorMessage(
          "Failed to load payment gateway. Please check your internet connection."
        );
        setLoading(false);
        return;
      }

      // Razorpay options for web
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_test_RnbcS8ilA0LUYN",
        amount: amount,
        currency: currency,
        name: "Supermarket Registration Fee",
        description: "One-time registration payment",
        order_id: order_id,
        handler: async function (response) {
          // Payment successful - verify on backend
          await verifyPayment(response);
        },
        modal: {
          ondismiss: function () {
            setErrorMessage(
              "Payment was cancelled. You must complete the payment to continue."
            );
            setLoading(false);
          },
          // Fix for modal going behind status bar in web
          backdrop_close: false,
          escape: false,
        },
        prefill: {
          name: "",
          email: "",
          contact: "",
        },
        theme: {
          color: "#3B82F6",
          backdrop_color: "rgba(0, 0, 0, 0.8)",
        },
        config: {
          display: {
            blocks: {
              banks: {
                name: "Pay via UPI or Cards",
                instruments: [
                  {
                    method: "upi",
                  },
                  {
                    method: "card",
                  },
                  {
                    method: "netbanking",
                  },
                ],
              },
            },
            sequence: ["block.banks"],
            preferences: {
              show_default_blocks: true,
            },
          },
        },
      };

      const razorpay = new window.Razorpay(options);

      // Ensure modal is on top
      razorpay.on("payment.failed", function (response) {
        setErrorMessage(
          response.error.description || "Payment failed. Please try again."
        );
        setLoading(false);
      });

      razorpay.open();
      setLoading(false);
    } catch (error) {
      console.error("Web payment error:", error);
      throw error;
    }
  };

  const handleCapacitorPayment = async (order_id, amount, currency) => {
    try {
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: amount.toString(),
        currency: currency,
        name: "Supermarket Registration Fee",
        description: "One-time registration payment",
        order_id: order_id,
        prefill: {
          name: "",
          email: "",
          contact: "",
        },
        theme: {
          color: "#3B82F6",
        },
      };

      const data = await Checkout.open(options);

      // Payment successful - verify on backend
      await verifyPayment({
        razorpay_order_id: data.response.razorpay_order_id,
        razorpay_payment_id: data.response.razorpay_payment_id,
        razorpay_signature: data.response.razorpay_signature,
      });
      setLoading(false);
    } catch (error) {
      console.error("Capacitor payment error:", error);

      if (error.code === 0) {
        // Payment cancelled by user
        setErrorMessage(
          "Payment was cancelled. You must complete the payment to continue."
        );
      } else if (error.code === 2) {
        // Payment failed
        setErrorMessage(
          error.description || "Payment failed. Please try again."
        );
      }

      setLoading(false);
      throw error;
    }
  };

  const verifyPayment = async (paymentResponse) => {
    try {
      setPaymentVerifying(true);

      const API_BASE_URL =
        import.meta.env.VITE_API_BASE_URL || "http://192.168.1.2:8000/api";
      const verifyResponse = await axios.post(
        `${API_BASE_URL}/payment/verify`,
        {
          razorpay_order_id: paymentResponse.razorpay_order_id,
          razorpay_payment_id: paymentResponse.razorpay_payment_id,
          razorpay_signature: paymentResponse.razorpay_signature,
        }
      );

      if (verifyResponse.data.success) {
        // Mark payment as completed in localStorage
        localStorage.setItem(`payment_completed_${userId}`, "true");

        setSuccessMessage("Your payment has been verified successfully!");

        setTimeout(() => {
          setVisible(false);
          onPaymentSuccess?.();
        }, 2000);
      } else {
        throw new Error("Payment verification failed");
      }
    } catch (error) {
      console.error("Verification error:", error);
      setErrorMessage(
        "Payment verification failed. Please contact support with your payment ID."
      );
    } finally {
      setPaymentVerifying(false);
    }
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (scriptLoaded.current) {
        resolve(true);
        return;
      }

      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => {
        scriptLoaded.current = true;
        resolve(true);
      };
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const getDialogHeader = () => {
    if (successMessage) {
      return (
        <div className="flex align-items-center gap-2 text-green-600">
          <i className="pi pi-check-circle"></i>
          <span>Payment Successful</span>
        </div>
      );
    }
    if (errorMessage) {
      return (
        <div className="flex flex-column gap-2">
          <div className="flex justify-content-between align-items-center">
            <div className="flex align-items-center gap-2 text-red-600">
              <i className="pi pi-exclamation-triangle"></i>
              <span>Payment Error</span>
            </div>
            <Button
              label="Retry"
              icon="pi pi-refresh"
              size="small"
              severity="danger"
              outlined
              onClick={() => {
                setErrorMessage("");
                setLoading(false);
              }}
            />
          </div>
          <div className="text-sm font-normal text-red-500">{errorMessage}</div>
        </div>
      );
    }
    return "Complete Registration Payment";
  };

  return (
    <>
      <Dialog
        header={getDialogHeader()}
        visible={visible}
        closable={false}
        dismissableMask={false}
        closeOnEscape={false}
        className="payment-modal-container"
        blockScroll={true}
      >
        <div className="payment-content-wrapper">
          {paymentVerifying ? (
            <div className="payment-loading-wrapper">
              <ProgressSpinner />
              <p className="payment-loading-text">Verifying your payment...</p>
              <p className="payment-loading-subtext">
                Please wait, do not close this window.
              </p>
            </div>
          ) : (
            <>
              <i
                className={`pi ${
                  isOwner ? "pi-wallet" : "pi-clock"
                } payment-icon ${
                  isOwner ? "text-blue-500" : "text-orange-500"
                }`}
              ></i>

              <div className="payment-text-center">
                <h3 className="payment-title mt-0 mb-2">
                  {isOwner ? "Registration Fee Required" : "Payment Pending"}
                </h3>
                <p className="payment-description text-600 mb-3">
                  {isOwner
                    ? "To complete your registration and access the application, please pay the one-time registration fee."
                    : message ||
                      "Payment is pending. Please contact your business owner to complete the registration payment."}
                </p>
              </div>

              {isOwner && (
                <>
                  <div className="payment-fee-display">
                    <div className="payment-fee-row">
                      <span className="payment-fee-label">
                        Registration Fee
                      </span>
                      <span className="payment-fee-amount">₹1</span>
                    </div>
                    <p className="payment-fee-description">
                      One-time payment for business registration and lifetime
                      access to all features.
                    </p>
                  </div>

                  <div className="payment-button-wrapper">
                    <Button
                      label={
                        loading ? "Processing..." : "Pay Now with Razorpay"
                      }
                      icon="pi pi-credit-card"
                      className="payment-button"
                      loading={loading}
                      onClick={handlePayment}
                      size="large"
                    />
                  </div>

                  <div className="payment-info-box">
                    <p className="payment-security-text">
                      <i className="pi pi-shield text-green-600"></i>
                      Secure payment powered by Razorpay. Your payment details
                      are encrypted and safe.
                    </p>
                  </div>

                  <div className="payment-warning">
                    <p className="payment-warning-text">
                      ⚠️ You must complete this payment to access the
                      application
                    </p>
                  </div>
                </>
              )}

              {!isOwner && (
                <div className="payment-non-owner-box">
                  <div className="payment-non-owner-header">
                    <i className="pi pi-info-circle payment-non-owner-icon"></i>
                    <div>
                      <p className="payment-non-owner-title">
                        Action Required by Owner
                      </p>
                      <p className="payment-non-owner-description">
                        Your business owner needs to complete the one-time
                        registration payment of ₹1.
                      </p>
                    </div>
                  </div>
                  <p className="payment-non-owner-footer">
                    Once the payment is completed, you and all team members will
                    have full access to the application.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </Dialog>
    </>
  );
}
