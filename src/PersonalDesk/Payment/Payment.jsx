import React, { useEffect, useState, useCallback, useRef } from "react";
import styles from "./Payment.module.css";
import { useBooking } from "../../context/BookingContext";
import CircularProgress, {
  circularProgressClasses,
} from "@mui/material/CircularProgress";
import api from "../../utility/axiosConfig";
import { useAuth } from "../../context/Auth";
import { Chip } from "@mui/material";

export default function Payment({
  loading,
  selectedWorkspace,
  // invoiceId,
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
  userId,
  bookOffice,
}) {
  const { accessToken, tokenType } = useAuth();
  const [paymentWindow, setPaymentWindow] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const iframeContainerRef = useRef(null);
  const [invoiceId, setInvoiceId] = useState(null);

  const updateInvoiceStatus = async (orderIdentification) => {
    console.log(invoiceId);
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

      finishPayment();
      if (response.status !== 200) {
        throw new Error("Failed to update invoice status");
      }
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
      handlePayment(e, bookingResponse);
      setInvoiceId(bookingResponse.data.invoiceId);
    } catch (error) {
      console.error("Error booking office:", error);
    }
  };

  const handlePayment = (e, bookingResponse) => {
    e.preventDefault();
    setPaymentStatus(null);
    setErrorMessage(null);

    const paymentUrl = `${bookingResponse.data.paymentSession}&mode=frameless`;

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
      width: ${window.innerWidth <= 640 ? "360px" : "640px"};
      height: ${window.innerWidth <= 640 ? "780px" : "580px"};
      border: none;
      border-radius: 8px;
      background-color: white;
    `;

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
            updateInvoiceStatus(orderIdentification);
           
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
      }
    },
    [closePaymentWindow]
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
              {personalDeskUserInfo.passDuration} x {singlePrice} ALL
            </p>
          ) : (
            <p>{period}</p>
          )}
        </div>
        <div className={styles.itemPrice}>
          <p className={styles.currentPrice}>{currentPrice} ALL</p>
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
            <span className={styles.subtotalAmount}>-{validCoupon} ALL</span>
          </div>
        </div>
      )}

      <div className={styles.totalSection}>
        <div className={styles.totalRow}>
          <span>TOTAL:</span>
          <span className={styles.totalAmount}>{price} ALL</span>
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
