import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { CircularProgress, Chip } from "@mui/material";
import styles from "./BookingPayment.module.css";
import api from "../../util/axiosConfig";
import { useAuth } from "../../context/Auth";
import PaymentModal from "../../components/PaymentModal";

/**
 * BookingPayment Component
 * Handles the booking creation and payment process for workspace rentals
 */
export default function BookingPayment() {
  // Navigation and route params
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { accessToken, tokenType } = useAuth();

  const API_BASE_URL =
    "https://nhpvz8wphf.execute-api.eu-central-1.amazonaws.com/prod";

  // Get the state from navigation
  const {
    userId,
    workspaceId,
    priceId,
    startDate,
    period,
    seatId,
    price,
    userEmail,
    userName,
    endDate,
    workspaceLabel,
  } = location.state || {};

  // Log initial params
  useEffect(() => {
    console.log("BookingPayment initialized with params:", {
      userId,
      workspaceId,
      priceId,
      startDate,
      period,
      seatId,
      price,
      userName,
      endDate,
    });
  }, [
    userId,
    workspaceId,
    priceId,
    startDate,
    period,
    seatId,
    price,
    userName,
    endDate,
  ]);

  // =========== STATE MANAGEMENT ===========
  const [loading, setLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [invoiceId, setInvoiceId] = useState("");

  // Payment modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState(null);

  // Coupon state
  const [couponCode, setCouponCode] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [validCoupon, setValidCoupon] = useState(null);

  // Booking details state
  const [bookingDetails, setBookingDetails] = useState({
    workspace: {
      label: workspaceLabel || "No workspace selected",
    },
    workspaceLabel,
    bookingType: period || "",
    quantity: 1,
    price: {
      single: price || 0,
      current: price || 0,
      total: price || 0,
    },
    period: period || "",
    dates: {
      startDate: startDate || "",
      endDate: endDate || "",
    },
  });

  // =========== UTILITY FUNCTIONS ===========
  /**
   * Format currency in ALL (Albanian Lek)
   */
  const formatCurrency = (value) => {
    return (
      new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "ALL",
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      })
        .format(value)
        .replace("ALL", "")
        .trim() + " ALL"
    );
  };

  // =========== HANDLERS ===========
  /**
   * Close the payment modal and handle post-close actions
   */
  const handleClosePayment = useCallback(() => {
    console.log("Closing payment modal");
    setShowPaymentModal(false);

    // Only show cancelled message if it wasn't a success
    if (paymentStatus !== "success") {
      setTimeout(() => {
        setErrorMessage("Payment was cancelled.");
      }, 100);
    }
  }, [paymentStatus]);

  /**
   * Handle the payment process
   * 1. Create booking
   * 2. Get payment URL
   * 3. Open payment modal
   */
  const handlePayment = async (e) => {
    e.preventDefault();
    setPaymentStatus(null);
    setErrorMessage(null);
    setShowPaymentModal(false); // Reset modal state
    setLoading(true);

    try {
      console.log("Starting payment process...");

      // Prepare booking data
      const bookingData = {
        username: userName,
        user: userId,
        room: workspaceId[0],
        from: startDate,
        to: endDate,
        seat: seatId.toString(),
        referral: "Shared Office Form",
        booked: period,
        discount: validCoupon ? validCoupon : 0,
        type: period === "Multi Pass" ? "Multi Pass" : "Single Pass",
      };

      console.log("Sending booking request with data:", bookingData);

      // Create the booking and get invoice
      const bookingResponse = await api.post(
        `${API_BASE_URL}/shared`,
        bookingData,
        {
          headers: { Authorization: `${tokenType} ${accessToken}` },
        }
      );

      console.log("Booking response received:", bookingResponse.data);

      if (!bookingResponse.data?.invoiceId) {
        throw new Error("Failed to generate invoice for booking");
      }

      // Store invoice ID for later use (when confirming payment)
      setInvoiceId(bookingResponse.data.invoiceId);

      // Get payment URL from response
      const paymentUrl = `${bookingResponse.data.paymentSession}&mode=frameless`;

      if (!paymentUrl) {
        throw new Error("No payment URL received from server");
      }

      console.log("Opening payment modal with URL:", paymentUrl);
      setPaymentUrl(paymentUrl);

      // Small delay before showing modal
      setTimeout(() => {
        setShowPaymentModal(true);
      }, 100);
    } catch (error) {
      console.error("Error during booking/payment:", error);
      setErrorMessage(error.message || "Failed to process booking and payment");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Apply a coupon code to the current booking
   */
  const handleApplyCoupon = async (code) => {
    if (!code) {
      setErrorMessage("Please enter a coupon code");
      return;
    }

    setCouponLoading(true);
    setErrorMessage(null);

    try {
      console.log(`Applying coupon: ${code} for booking ${period}`);

      const response = await api.get(
        `${API_BASE_URL}/coupon?coupon=${code}&id=${priceId}&booking=${period}&quantity=1`,
        {
          headers: { Authorization: `${tokenType} ${accessToken}` },
        }
      );

      console.log("Coupon response:", response.data);

      // Set valid coupon and update booking details
      setValidCoupon(response.data.discount);
      setBookingDetails((prev) => ({
        ...prev,
        price: {
          ...prev.price,
          total: prev.price.total - response.data.discount,
        },
      }));
    } catch (error) {
      console.error("Error applying coupon:", error);
      setValidCoupon(null);
      setErrorMessage(error.response?.data?.message || "Invalid coupon code");
    } finally {
      setCouponLoading(false);
    }
  };

  /**
   * Remove the applied coupon
   */
  const removeCoupon = () => {
    console.log("Removing coupon");
    setValidCoupon(null);
    setCouponCode("");
    setErrorMessage(null);

    if (bookingDetails) {
      setBookingDetails((prev) => ({
        ...prev,
        price: {
          ...prev.price,
          total: prev.price.current,
        },
      }));
    }
  };

  // =========== EFFECTS ===========
  /**
   * Handle payment messages from the iframe
   */
  useEffect(() => {
    const messageHandler = (event) => {
      console.log("Received postMessage event:", {
        origin: event.origin,
        data: event.data,
      });

      // Verify the origin
      if (!event.origin.includes("raiaccept.com")) {
        console.log("Ignoring message from unknown origin:", event.origin);
        return;
      }

      try {
        const data = event.data;
        if (data?.name !== "orderResult") {
          console.log("Ignoring non-orderResult message");
          return;
        }

        console.log("Processing payment result:", data);

        const {
          status,
          orderIdentification,
          errorMessage: paymentError,
        } = data.payload;

        setPaymentStatus(status);
        setShowPaymentModal(false);

        switch (status) {
          case "success":
            console.log("Payment successful, updating invoice status");
            // Update the invoice status
            api
              .put(
                `${API_BASE_URL}/invoice/${invoiceId}`,
                { status: "Approved", order: orderIdentification },
                {
                  headers: { Authorization: `${tokenType} ${accessToken}` },
                }
              )
              .then(() => {
                console.log("Invoice updated successfully");
                // Navigate to success page
                navigate("/booking-success");
              })
              .catch((error) => {
                console.error("Error updating invoice:", error);
                setErrorMessage(
                  "Payment completed but failed to update booking status"
                );
              });
            break;

          case "failure":
            console.log("Payment failed");
            setErrorMessage("Payment failed. Please try again.");
            break;

          case "cancel":
            console.log("Payment cancelled");
            setErrorMessage("Payment was cancelled.");
            break;

          case "exception":
            console.log("Payment exception:", paymentError);
            setErrorMessage(paymentError || "An unexpected error occurred.");
            break;

          default:
            console.log("Unknown payment status:", status);
            setErrorMessage("Unknown payment status");
        }
      } catch (error) {
        console.error("Error processing payment message:", error);
        setErrorMessage("Error processing payment response");
      }
    };

    // Add message event listener
    window.addEventListener("message", messageHandler);

    // Clean up
    return () => {
      window.removeEventListener("message", messageHandler);
    };
  }, [navigate, invoiceId, API_BASE_URL, tokenType, accessToken]);

  /**
   * Log important state changes
   */
  useEffect(() => {
    console.log("Payment state changed:", {
      showModal: showPaymentModal,
      paymentUrl,
      status: paymentStatus,
      error: errorMessage,
    });
  }, [showPaymentModal, paymentUrl, paymentStatus, errorMessage]);

  // =========== RENDER ===========
  if (loading) {
    return <CircularProgress />;
  }

  return (
    <div className={styles.formBody}>
      {/* Header */}
      <h1 className={styles.mainTitle}>Payment</h1>
      <p className={styles.subtitle}>Complete payment information</p>

      {/* Order Details */}
      <h2 className={styles.sectionTitle}>Order details</h2>
      <div className={styles.orderItem}>
        <div className={styles.itemInfo}>
          <h3>
            {typeof bookingDetails?.workspace?.label === "object"
              ? bookingDetails?.workspace?.label?.label ||
                "No workspace selected"
              : bookingDetails?.workspace?.label || "No workspace selected"}
          </h3>
          {bookingDetails?.bookingType === "Multi Pass" ? (
            <p>
              {bookingDetails?.quantity || 0} x{" "}
              {formatCurrency(bookingDetails?.price?.single || 0)}
            </p>
          ) : (
            <p>{bookingDetails?.period || ""}</p>
          )}
        </div>
        <div className={styles.itemPrice}>
          <p className={styles.currentPrice}>
            {formatCurrency(bookingDetails?.price?.current || 0)}
          </p>
        </div>
      </div>

      {/* Date Information - Only show for Single Pass */}
      {bookingDetails?.bookingType === "Single Pass" &&
        bookingDetails?.dates && (
          <div className={styles.dateInfo}>
            <div className={styles.dateRow}>
              <span>Starting date:</span>
              <span>{bookingDetails?.dates?.startDate || ""}</span>
            </div>
            <div className={styles.dateRow}>
              <span>Ending date:</span>
              <span>{bookingDetails?.dates?.endDate || ""}</span>
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
                  onDelete={removeCoupon}
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
                  onClick={() => handleApplyCoupon(couponCode)}
                  disabled={couponLoading}
                >
                  {couponLoading ? "Applying..." : "Apply"}
                </button>
              </>
            )}
          </div>
        </span>
      </div>

      {/* Discount Info - Only show when coupon is applied */}
      {validCoupon && (
        <div className={styles.discountInfo}>
          <div className={styles.discountRow}>
            <span>Discount code:</span>
            <span>{couponCode}</span>
          </div>
          <div className={styles.discountRow}>
            <span>Discount percentage:</span>
            <span>
              {((validCoupon / bookingDetails?.price?.current) * 100).toFixed(
                0
              )}
              %
            </span>
          </div>
          <div className={styles.subtotalRow}>
            <span>Subtotal:</span>
            <span className={styles.subtotalAmount}>
              -{formatCurrency(validCoupon)}
            </span>
          </div>
        </div>
      )}

      {/* Total Section */}
      <div className={styles.totalSection}>
        <div className={styles.totalRow}>
          <span>TOTAL:</span>
          <span className={styles.totalAmount}>
            {formatCurrency(bookingDetails?.price?.total || 0)}
          </span>
        </div>
      </div>

      {/* Payment Button */}
      <button
        onClick={handlePayment}
        className={styles.paymentButton}
        disabled={paymentStatus === "success"}
      >
        {paymentStatus === "success"
          ? "Payment Completed"
          : "Proceed to Payment"}
      </button>

      {/* Error Messages */}
      {errorMessage && (
        <div className={styles.errorMessage}>{errorMessage}</div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && paymentUrl && (
        <PaymentModal
          paymentUrl={paymentUrl}
          onClose={handleClosePayment}
          onError={(error) => {
            console.error("Iframe loading error:", error);
            setErrorMessage("Failed to load payment window");
            setShowPaymentModal(false);
          }}
          onLoad={() => {
            console.log("Payment iframe loaded successfully");
          }}
        />
      )}
    </div>
  );
}
