import React, { useEffect, useState, useCallback, useRef } from "react";
import styles from "./Payment.module.css";
import { useBooking } from "../../context/BookingContext";
import CircularProgress, {
  circularProgressClasses,
} from "@mui/material/CircularProgress";
import api from "../../util/axiosConfig";
import { useAuth } from "../../context/Auth";
import { Chip } from "@mui/material";

export default function Payment({
  loading,
  payurl,
  selectedWorkspace,
  invoiceId,
  personalDeskUserInfo,
  validCoupon,
  price,
  singlePrice,
  currentPrice,
  couponCode,
  setCouponCode,
  couponLoading,
  onApplyCoupon,
  onRemoveCoupon,
  finishPayment,
  period,
  proceedToPayment,
  priceId,
}) {
  const { accessToken, tokenType } = useAuth();
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState("");
  const [isIframeLoaded, setIsIframeLoaded] = useState(false);
  const iframeRef = useRef(null);

  // Format price as currency
  const formatCurrency = (value) => {
    // Format the number using the 'ALL' currency code
    const formattedValue = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "ALL",
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(value);

    // Remove the 'ALL' part and add it manually at the end
    return formattedValue.replace("ALL", "").trim() + " ALL";
  };

  const updateInvoiceStatus = async (orderIdentification) => {
    console.log("Updating invoice status for ID:", invoiceId);
    try {
      const response = await api.put(
        `https://nhpvz8wphf.execute-api.eu-central-1.amazonaws.com/prod/invoice/${invoiceId}`,
        { status: "Approved", order: orderIdentification },
        {
          headers: {
            Authorization: `${tokenType} ${accessToken}`,
          },
        }
      );

      if (response.status !== 200) {
        throw new Error("Failed to update invoice status");
      }

      finishPayment();
    } catch (error) {
      console.error("Error updating invoice status:", error);
    }
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    setPaymentStatus(null);
    setErrorMessage(null);
    setIsIframeLoaded(false);

    try {
      // Call proceedToPayment and get the result directly
      const directPayUrl = await proceedToPayment();

      // Log both URLs for debugging
      console.log("🚀 ~ handlePayment ~ payurl prop:", payurl);
      console.log("🚀 ~ handlePayment ~ direct payurl:", directPayUrl);

      // Use the direct payment URL if available, otherwise fall back to the prop
      const effectivePayUrl = directPayUrl || payurl;

      if (!effectivePayUrl) {
        setErrorMessage("Payment URL is not available. Please try again.");
        return;
      }

      console.log("Final payment URL being used:", effectivePayUrl);

      // Set the payment URL and show the modal
      setPaymentUrl(`${effectivePayUrl}&mode=frameless`);
      setShowPaymentModal(true);
    } catch (error) {
      console.error("Error initializing payment:", error);
      setErrorMessage("Failed to initialize payment form. Please try again.");
    }
  };

  const handleCloseModal = () => {
    setShowPaymentModal(false);
    setPaymentUrl("");
    setIsIframeLoaded(false);
    setErrorMessage("Payment was cancelled.");
  };

  const messageHandler = useCallback(
    (event) => {
      console.log("Message received:", event.origin, event.data);

      // Check if the message is coming from the expected payment domain
      if (
        !event.origin.includes("payment.raiaccept.com") &&
        !event.origin.includes("raiaccept.com") &&
        !event.origin.includes("payment")
      ) {
        console.log("Ignoring message from unexpected origin:", event.origin);
        return;
      }

      try {
        const data = event.data;
        console.log("Processing payment message data:", data);

        // Different payment providers might use different message formats
        if (
          data?.name !== "orderResult" &&
          !data?.status &&
          !data?.paymentStatus
        ) {
          console.log("Message doesn't contain expected payment result format");
          return;
        }

        // Extract payment status information - handle different possible formats
        const status =
          data?.payload?.status || data?.status || data?.paymentStatus;
        const orderIdentification =
          data?.payload?.orderIdentification ||
          data?.orderIdentification ||
          data?.orderId;
        const paymentError =
          data?.payload?.errorMessage || data?.errorMessage || data?.message;

        console.log(
          "Payment status:",
          status,
          "Order ID:",
          orderIdentification
        );
        setPaymentStatus(status);

        // Close the payment modal
        setShowPaymentModal(false);
        setPaymentUrl("");

        switch (status) {
          case "success":
          case "completed":
          case "approved":
            updateInvoiceStatus(orderIdentification);
            break;
          case "failure":
          case "failed":
            setErrorMessage(
              paymentError || "Payment failed. Please try again."
            );
            break;
          case "cancel":
          case "cancelled":
            setErrorMessage("Payment was cancelled.");
            break;
          case "exception":
          case "error":
            setErrorMessage(paymentError || "An unexpected error occurred.");
            break;
          default:
            console.warn("Unknown payment status:", status);
            setErrorMessage(
              "Payment status unknown. Please check your account for confirmation."
            );
            break;
        }
      } catch (error) {
        console.error("Error processing payment message:", error);
        setErrorMessage(
          "Failed to process payment response. Please check your account for the payment status."
        );
      }
    },
    [updateInvoiceStatus]
  );

  const testBrowserSecurity = useCallback(() => {
    try {
      console.log("Running browser security diagnostics...");

      // Test 1: Check if iframe creation is allowed
      const testIframe = document.createElement("iframe");
      testIframe.style.display = "none";
      document.body.appendChild(testIframe);
      document.body.removeChild(testIframe);
      console.log("✅ Basic iframe creation test passed");

      // Test 2: Check if third-party cookies are enabled
      const cookieEnabled = navigator.cookieEnabled;
      console.log(
        `${cookieEnabled ? "✅" : "❌"} Cookies enabled: ${cookieEnabled}`
      );

      // Test 3: Check for Content-Security-Policy header
      const cspMeta = document.querySelector(
        'meta[http-equiv="Content-Security-Policy"]'
      );
      if (cspMeta) {
        console.log("⚠️ CSP found:", cspMeta.content);
        console.log("This might affect iframe loading");
      } else {
        console.log("✅ No CSP meta tag found");
      }

      return true;
    } catch (error) {
      console.error("Browser security diagnostic failed:", error);
      return false;
    }
  }, []);

  useEffect(() => {
    // Run browser security test once on component mount
    testBrowserSecurity();

    const currentUrl = window.location.href;

    if (currentUrl.includes("success") || currentUrl.includes("completed")) {
      setPaymentStatus("success");
    } else if (
      currentUrl.includes("failure") ||
      currentUrl.includes("failed")
    ) {
      setPaymentStatus("failure");
      setErrorMessage("Payment failed. Please try again.");
    } else if (
      currentUrl.includes("cancel") ||
      currentUrl.includes("cancelled")
    ) {
      setPaymentStatus("cancel");
      setErrorMessage("Payment was cancelled.");
    }

    localStorage.removeItem("paymentReturnUrl");
  }, []);

  useEffect(() => {
    window.addEventListener("message", messageHandler);
    return () => {
      window.removeEventListener("message", messageHandler);
    };
  }, [messageHandler]);

  // Payment Modal Component
  const PaymentModal = () => {
    if (!showPaymentModal) return null;

    return (
      <div className={styles.iframeOverlay}>
        <div
          className={styles.iframeWrapper}
          onClick={(e) => e.stopPropagation()}
          style={{
            width: window.innerWidth <= 640 ? "360px" : "640px",
            height: window.innerWidth <= 640 ? "780px" : "580px",
          }}
        >
          {!isIframeLoaded && (
            <div className={styles.loadingIndicator}>
              Loading payment form...
            </div>
          )}

          <iframe
            ref={iframeRef}
            src={paymentUrl}
            className={styles.iframeContent}
            style={{ opacity: isIframeLoaded ? 1 : 0 }}
            onLoad={() => {
              console.log("Payment iframe loaded successfully");
              setIsIframeLoaded(true);
            }}
            onError={(e) => {
              console.error("Failed to load payment iframe:", e);
              setErrorMessage("Failed to load payment form. Please try again.");
            }}
            allowFullScreen
            allow="payment"
            sandbox="allow-forms allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-top-navigation"
          />

          <button className={styles.closeButton} onClick={handleCloseModal}>
            &times;
          </button>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <CircularProgress
          variant="indeterminate"
          disableShrink
          sx={{
            color: "#1a90ff",
            animationDuration: "550ms",
            [`& .${circularProgressClasses.circle}`]: {
              strokeLinecap: "round",
            },
          }}
          size={40}
          thickness={4}
        />
      </div>
    );
  }

  return (
    <div className={styles.formBody}>
      <h1 className={styles.mainTitle}>Payment</h1>
      <p className={styles.subtitle}>Complete payment information</p>

      {/* Display error message if any */}
      {errorMessage && (
        <div
          className={styles.errorMessage || ""}
          style={{
            color: "red",
            padding: "10px",
            marginBottom: "15px",
            backgroundColor: "rgba(255,0,0,0.1)",
            borderRadius: "4px",
          }}
        >
          {errorMessage}
        </div>
      )}

      <h2 className={styles.sectionTitle}>Order details</h2>
      <div className={styles.orderItem}>
        <div className={styles.itemInfo}>
          <h3>{selectedWorkspace?.label || "Private Office"}</h3>
          <p>{period}</p>
        </div>
        <div className={styles.itemPrice}>
          <p className={styles.currentPrice}>{formatCurrency(currentPrice)}</p>
        </div>
      </div>
      {personalDeskUserInfo &&
        personalDeskUserInfo.selectDate &&
        personalDeskUserInfo.endDate && (
          <div className={styles.dateInfo}>
            <div className={styles.dateRow}>
              <span>Starting date:</span>
              <span>{personalDeskUserInfo.selectDate}</span>
            </div>
            <div className={styles.dateRow}>
              <span>Ending date:</span>
              <span>{personalDeskUserInfo.endDate}</span>
            </div>
          </div>
        )}

      {/* Coupon Section */}
      <div className={styles.couponSection}>
        <h2 className={styles.sectionTitle}>Do you have a discount code?</h2>
        <span style={{ fontSize: 14 }}>
          Apply it at checkout to get a special discount on your order.
          <div className={styles.couponInputContainer}>
            {validCoupon ? (
              <div className={styles.couponChip}>
                <Chip
                  label={couponCode}
                  onDelete={onRemoveCoupon}
                  color="primary"
                  variant="outlined"
                  style={{ height: 48, fontSize: 16 }}
                />
              </div>
            ) : (
              <>
                <input
                  type="text"
                  placeholder="Code"
                  className={styles.couponInputField}
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                />
                <button
                  className={styles.couponButton}
                  onClick={() => onApplyCoupon(couponCode)}
                  disabled={couponLoading}
                >
                  {couponLoading ? "Applying..." : "Apply"}
                </button>
              </>
            )}
          </div>
        </span>
      </div>

      {validCoupon && (
        <div className={styles.discountInfo}>
          <div className={styles.discountRow}>
            <span>Discount code:</span>
            <span>{couponCode}</span>
          </div>
          <div className={styles.discountRow}>
            <span>Discount percentage:</span>
            <span>{validCoupon}%</span>
          </div>
          <div className={styles.subtotalRow}>
            <span>Subtotal:</span>
            <span className={styles.subtotalAmount}>
              -{formatCurrency((currentPrice * validCoupon) / 100)}
            </span>
          </div>
        </div>
      )}

      <div className={styles.totalSection}>
        <div className={styles.totalRow}>
          <span>TOTAL:</span>
          <span className={styles.totalAmount}>{formatCurrency(price)}</span>
        </div>
      </div>

      <button
        onClick={handlePayment}
        className={styles.paymentButton}
        disabled={paymentStatus === "success"}
      >
        {paymentStatus === "success"
          ? "Payment Completed"
          : "Proceed to Payment"}
      </button>

      {/* Render the payment modal when needed */}
      <PaymentModal />
    </div>
  );
}
