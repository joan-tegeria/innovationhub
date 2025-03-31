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
  selectedWorkspace,
  invoiceId,
  personalDeskUserInfo,
  setInvoiceId,
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
  userId,
  bookOffice,
}) {
  const { accessToken, tokenType } = useAuth();
  const [paymentWindow, setPaymentWindow] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const iframeContainerRef = useRef(null);
  // const [invoiceId, setInvoiceId] = useState(null);
  const [idvoice, setIdVoice] = useState("");
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

  // Update localStorage whenever invoiceId changes
  useEffect(() => {
    if (invoiceId) {
      localStorage.setItem("tempInvoiceId", invoiceId);
    } else {
      localStorage.removeItem("tempInvoiceId");
    }
  }, [invoiceId]);

  const updateInvoiceStatus = async (orderIdentification) => {
    console.log("Updating invoice status for ID:", invoiceId);
    try {
      const response = await api.put(
        `https://nhpvz8wphf.execute-api.eu-central-1.amazonaws.com/prod/invoice/${localStorage.getItem(
          "tempInvoiceId"
        )}`,
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

      console.log("Successfully updated invoice status");
      finishPayment();
    } catch (error) {
      console.error("Error updating invoice status:", error);
    }
  };

  const closePaymentWindow = useCallback(() => {
    if (
      iframeContainerRef.current &&
      document.body.contains(iframeContainerRef.current)
    ) {
      document.body.removeChild(iframeContainerRef.current);
      iframeContainerRef.current = null;
      setPaymentWindow(null);
    }
  }, []);

  const _bookOffice = async (e) => {
    try {
      const bookingResponse = await bookOffice(userId);
      console.log("Booking response received:", bookingResponse);

      if (!bookingResponse?.data?.invoiceId) {
        throw new Error("No invoice ID received from booking");
      }

      if (!bookingResponse?.data?.paymentSession) {
        throw new Error("No payment session URL received");
      }

      const newInvoiceId = bookingResponse.data.invoiceId;
      console.log("Setting invoice ID:", newInvoiceId);

      // Set invoice ID in parent component first
      if (typeof setInvoiceId === "function") {
        setInvoiceId(newInvoiceId);
        console.log("Invoice ID set in parent component");
      } else {
        console.error("setInvoiceId is not a function", setInvoiceId);
      }

      // Set local state
      setIdVoice(newInvoiceId);

      // Proceed with payment
      console.log(
        "Initializing payment with session URL:",
        bookingResponse.data.paymentSession
      );
      await handlePayment(e, bookingResponse);
    } catch (error) {
      console.error("Error during booking process:", error);
      setErrorMessage(error.message || "Failed to process booking");
    }
  };

  const handlePayment = async (e, bookingResponse) => {
    e.preventDefault();
    setPaymentStatus(null);
    setErrorMessage(null);

    // Make sure we have a valid payment session URL
    if (!bookingResponse?.data?.paymentSession) {
      console.error("No payment session URL provided");
      setErrorMessage("Failed to initialize payment session");
      return;
    }

    // Remove the &mode=frameless parameter
    const paymentUrl = bookingResponse.data.paymentSession;
    console.log("Opening payment URL:", paymentUrl);

    // Close existing payment window if it exists
    closePaymentWindow();

    const iframeContainer = document.createElement("div");
    iframeContainer.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.5);
      z-index: 1000;
      display: flex;
      justify-content: center;
      align-items: center;
    `;

    const iframe = document.createElement("iframe");
    iframe.src = paymentUrl;
    iframe.style.cssText = `
      width: 90%;
      max-width: 640px;
      height: 90vh;
      max-height: 780px;
      border: none;
      border-radius: 8px;
      background-color: white;
    `;

    // Update sandbox attributes
    iframe.setAttribute(
      "sandbox",
      "allow-forms allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-top-navigation"
    );
    iframe.setAttribute("allow", "payment");

    // Add load event listener to check if iframe loads successfully
    iframe.onload = () => {
      console.log("Payment iframe loaded successfully");
    };

    iframe.onerror = () => {
      console.error("Failed to load payment iframe");
      setErrorMessage("Failed to load payment interface");
      closePaymentWindow();
    };

    iframeContainer.appendChild(iframe);
    document.body.appendChild(iframeContainer);
    iframeContainerRef.current = iframeContainer;

    const handleBackgroundClick = (event) => {
      if (event.target === iframeContainer) {
        closePaymentWindow();
        setErrorMessage("Payment was cancelled.");
      }
    };

    iframeContainer.addEventListener("click", handleBackgroundClick);
    setPaymentWindow(iframeContainer);
  };

  const messageHandler = useCallback(
    (event) => {
      if (!event.origin.includes("payment.raiaccept.com")) return;

      try {
        const data = event.data;
        if (data?.name !== "orderResult") return;

        const {
          status,
          orderIdentification,
          errorMessage: paymentError,
        } = data.payload;
        setPaymentStatus(status);

        closePaymentWindow();

        switch (status) {
          case "success":
            // Get the invoice ID from localStorage or state
            const currentInvoiceId =
              localStorage.getItem("tempInvoiceId") || idvoice;
            if (!currentInvoiceId) {
              console.error("No invoice ID found");
              setErrorMessage("Payment completed but invoice ID is missing");
              return;
            }

            // Update invoice status
            api
              .put(
                `https://nhpvz8wphf.execute-api.eu-central-1.amazonaws.com/prod/invoice/${currentInvoiceId}`,
                { status: "Approved", order: orderIdentification },
                {
                  headers: {
                    Authorization: `${tokenType} ${accessToken}`,
                  },
                }
              )
              .then(() => {
                console.log("Successfully updated invoice status");
                finishPayment();
                localStorage.removeItem("tempInvoiceId"); // Clean up
              })
              .catch((error) => {
                console.error("Error updating invoice status:", error);
                setErrorMessage(
                  "Payment completed but failed to update booking status"
                );
              });
            break;
          case "failure":
            setErrorMessage("Payment failed. Please try again.");
            break;
          case "cancel":
            setErrorMessage("Payment was cancelled.");
            break;
          case "exception":
            setErrorMessage(paymentError || "An unexpected error occurred.");
            break;
        }
      } catch (error) {
        console.error("Error processing payment message:", error);
        setErrorMessage("Error processing payment response");
      }
    },
    [closePaymentWindow, finishPayment, tokenType, accessToken, idvoice]
  );

  useEffect(() => {
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
      closePaymentWindow();
    };
  }, [messageHandler, closePaymentWindow]);

  if (loading) {
    return (
      <div
        className={styles.loadingContainer}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(255, 255, 255, 0.8)",
          zIndex: 9999,
        }}
      >
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
  console.log(personalDeskUserInfo);
  return (
    <div className={styles.formBody}>
      <h1 className={styles.mainTitle}>Payment</h1>
      <p className={styles.subtitle}>Complete payment information</p>

      <h2 className={styles.sectionTitle}>Order details</h2>
      {/* <div className={styles.orderDetails}> */}
      <div className={styles.orderItem}>
        <div className={styles.itemInfo}>
          <h3>{selectedWorkspace.label || "Flexible desk"}</h3>
          {personalDeskUserInfo.bookingType === "Multi Pass" ? (
            <p>
              {personalDeskUserInfo.passDuration} x{" "}
              {formatCurrency(singlePrice)}
            </p>
          ) : (
            <p>{period}</p>
          )}
        </div>
        <div className={styles.itemPrice}>
          <p className={styles.currentPrice}>{formatCurrency(currentPrice)}</p>
          {/* <p className={styles.originalPrice}>2,400 ALL</p> */}
        </div>
      </div>
      {personalDeskUserInfo.bookingType === "Single Pass" && (
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
            <span>{((validCoupon / currentPrice) * 100).toFixed(0)}%</span>
          </div>
          <div className={styles.subtotalRow}>
            <span>Subtotal:</span>
            <span className={styles.subtotalAmount}>
              -{formatCurrency(validCoupon)}
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
        onClick={_bookOffice}
        className={styles.paymentButton}
        disabled={paymentStatus === "success"}
      >
        {paymentStatus === "success"
          ? "Payment Completed"
          : "Proceed to Payment"}
      </button>
      {/* </div> */}
    </div>
  );
}
