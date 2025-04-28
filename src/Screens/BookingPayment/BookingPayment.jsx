import React, { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { CircularProgress, Chip } from "@mui/material";
import styles from "./BookingPayment.module.css";
import api from "../../util/axiosConfig";
import { useAuth } from "../../context/Auth";
import PaymentModal from "../../components/PaymentModal";
import Danger from "../../assets/Danger.svg";
import RestartBookingModal from "../BookModal/RestartBookingModal.jsx";

/**
 * BookingPayment Component
 * Handles the booking creation and payment process for workspace rentals
 */
export default function BookingPayment() {
  // Navigation and route params
  // const { bookingId } = useParams();
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
    bookingId,
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
      workspaceLabel,
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
    workspaceLabel,
  ]);

  // =========== STATE MANAGEMENT ===========
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [invoiceId, setInvoiceId] = useState("");
  const [paymentFailed, setPaymentFailed] = useState(false);
  const [saleOrderId, setSaleOrderId] = useState("");
  const [bookResponse, setBookResponse] = useState("");

  // Payment modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState(null);
  const [bookingInitiated, setBookingInitiated] = useState(false);
  const modalTimeoutRef = useRef(null);

  // Coupon state
  const [couponCode, setCouponCode] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [validCoupon, setValidCoupon] = useState(null);

  useEffect(() => {
    setTimeout(() => {
      setIsButtonDisabled(true);
    }, 600000);
  }, []);

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

    // Clear the timeout when modal is closed manually
    if (modalTimeoutRef.current) {
      clearTimeout(modalTimeoutRef.current);
      modalTimeoutRef.current = null;
    }

    // Only show cancelled message if it wasn't a success and no specific error is already set
    if (paymentStatus !== "success" && !errorMessage) {
      setTimeout(() => {
        setErrorMessage("Your payment has been canceled.");
        setPaymentFailed(true);
      }, 100);
    }
  }, [paymentStatus, errorMessage]);

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
    setPaymentFailed(false);
    setShowPaymentModal(false);

    // Clear any existing timeout
    if (modalTimeoutRef.current) {
      clearTimeout(modalTimeoutRef.current);
      modalTimeoutRef.current = null;
    }

    // If we already have a payment URL, just show the modal without calling the API again
    if (bookingInitiated && paymentUrl) {
      console.log("Reopening payment modal with existing payment URL");
      setShowPaymentModal(true);

      // Set a new timeout for 10 minutes
      modalTimeoutRef.current = setTimeout(() => {
        console.log(
          "Modal timeout reached - closing payment modal due to inactivity"
        );
        setErrorMessage("Payment modal closed due to inactivity");
        handleClosePayment();
      }, 10 * 60 * 1000); // 10 minutes in milliseconds

      return;
    }

    setLoading(true);

    try {
      console.log("Starting payment process...");

      // Prepare booking data
      const bookingData = {
        bookingId: bookingId,
        contact: userId,
        discount: validCoupon ? validCoupon : 0,
      };

      console.log("Sending booking request with data:", bookingData);

      // Create the booking and get invoice
      const bookingResponse = await api.post(
        `${API_BASE_URL}/generatePayment`,
        bookingData,
        {
          headers: { Authorization: `${tokenType} ${accessToken}` },
        }
      );

      console.log("Booking response received:", bookingResponse.data);

      // Get payment URL from response
      const paymentUrl = `${bookingResponse.data.paymentSession}&mode=frameless`;

      if (!paymentUrl) {
        throw new Error("No payment URL received from server");
      }

      console.log("Opening payment modal with URL:", paymentUrl);
      setPaymentUrl(paymentUrl);
      setBookingInitiated(true);

      // Small delay before showing modal
      setTimeout(() => {
        setShowPaymentModal(true);

        // Set timeout for 10 minutes to close the modal if no action is taken
        modalTimeoutRef.current = setTimeout(() => {
          console.log(
            "Modal timeout reached - closing payment modal due to inactivity"
          );
          setErrorMessage("Payment modal closed due to inactivity");
          handleClosePayment();
        }, 10 * 60 * 1000); // 10 minutes in milliseconds
      }, 100);
    } catch (error) {
      setBookingInitiated(true);
      console.error("Error during booking/payment:", error);
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

      // Reset the timeout on any message received from the payment iframe
      if (modalTimeoutRef.current) {
        clearTimeout(modalTimeoutRef.current);
        modalTimeoutRef.current = null;
      }

      // Verify the origin
      if (!event.origin.includes("raiaccept.com")) {
        console.log("Ignoring message from unknown origin:", event.origin);
        return;
      }

      try {
        const data = event.data;
        if (data?.name !== "orderResult") {
          console.log("Ignoring non-orderResult message");

          // Set a new timeout after receiving a non-orderResult message
          if (showPaymentModal) {
            modalTimeoutRef.current = setTimeout(() => {
              console.log(
                "Modal timeout reached - closing payment modal due to inactivity"
              );
              setErrorMessage("Payment modal closed due to inactivity");
              handleClosePayment();
            }, 10 * 60 * 1000); // 10 minutes in milliseconds
          }

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
            navigate(`/booking-success`, {
              state: {
                type: "personal",
              },
            });
            break;

          case "failure":
            // console.log("Payment failed");
            // setErrorMessage("Payment failed. Please try again.");
            // setPaymentFailed(true);
            // break;
            api
              .put(
                `${API_BASE_URL}/invoice/${invoiceId}`,
                {
                  status: "Cancelled",
                  order: orderIdentification,
                  saleOrder: saleOrderId,
                  booking: bookResponse,
                },
                {
                  headers: { Authorization: `${tokenType} ${accessToken}` },
                }
              )
              .then(() => {
                console.log("Invoice updated as Refused");
                setErrorMessage("Payment failed. Please try again.");
                setPaymentFailed(true);
              })
              .catch((error) => {
                console.error("Error updating invoice to Refused:", error);
                setBookingInitiated(true);
                setErrorMessage(
                  "Payment failed and could not update invoice status"
                );
              });
            break;

          case "cancel":
            // console.log("Payment cancelled");
            // setErrorMessage("Your payment has been canceled.");
            // setPaymentFailed(true);
            // break;
            api
              .put(
                `${API_BASE_URL}/invoice/${invoiceId}`,
                {
                  status: "Cancelled",
                  order: orderIdentification,
                  saleOrder: saleOrderId,
                  booking: bookResponse,
                },
                {
                  headers: { Authorization: `${tokenType} ${accessToken}` },
                }
              )
              .then(() => {
                console.log("Invoice updated as Cancelled (cancelled)");
                setErrorMessage("Your payment has been canceled.");
                setPaymentFailed(true);
              })
              .catch((error) => {
                console.error("Error updating invoice to Cancelled:", error);
                setBookingInitiated(true);
                setErrorMessage(
                  "Payment was cancelled but failed to update invoice status"
                );
              });
            break;

          case "exception":
            console.log("Payment exception:", paymentError);
            setErrorMessage(paymentError || "An unexpected error occurred.");
            setPaymentFailed(true);
            break;

          default:
            console.log("Unknown payment status:", status);
            setErrorMessage("Unknown payment status");
        }
      } catch (error) {
        console.error("Error processing payment message:", error);
        setBookingInitiated(true);
        setErrorMessage(
          error.response?.data?.message || "An Error occurred please try again"
        );
      }
    };

    // Add message event listener
    window.addEventListener("message", messageHandler);

    // Clean up
    return () => {
      window.removeEventListener("message", messageHandler);
    };
  }, [
    navigate,
    invoiceId,
    API_BASE_URL,
    tokenType,
    accessToken,
    handleClosePayment,
    showPaymentModal,
  ]);

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

  // Cleanup timeout on component unmount
  useEffect(() => {
    return () => {
      if (modalTimeoutRef.current) {
        clearTimeout(modalTimeoutRef.current);
        modalTimeoutRef.current = null;
      }
    };
  }, []);

  // =========== RENDER ===========
  // if (loading) {
  //   return <CircularProgress />;
  // }

  return (
    <div className={styles.background}>
      <div className={styles.formBody}>
        {/* Header */}
        <h1 className={styles.mainTitle}>Payment</h1>
        <p className={styles.subtitle}>Complete payment information</p>
        <div className={styles.subTitleDivider} />
        {loading ? (
          <div className={styles.loadingContainer}>
            <div className={styles.spinner}></div>
          </div>
        ) : (
          <>
            {/* Order Details */}
            <h2 className={styles.sectionTitle}>Order details</h2>
            <div className={styles.orderItem}>
              <div className={styles.itemInfo}>
                <h3>
                  {typeof bookingDetails?.workspace?.label === "object"
                    ? bookingDetails?.workspace?.label?.label ||
                      "No workspace selected"
                    : bookingDetails?.workspace?.label ||
                      "No workspace selected"}
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
              <h2 className={styles.sectionTitle}>
                Do you have a discount code?
              </h2>
              <span style={{ fontSize: 14, color: "rgba(34, 34, 34, 1)" }}>
                Apply it at checkout to get a special discount on your order.
                <div className={styles.couponInputContainer}>
                  {validCoupon ? (
                    <div className={styles.couponChip}>
                      <Chip
                        label={couponCode}
                        onDelete={removeCoupon}
                        sx={{
                          height: 48,
                          fontSize: 16,
                          backgroundColor: "white",
                          color: "#eb3778",
                          border: "1px solid #eb3778",
                          "& .MuiChip-deleteIcon": {
                            color: "#eb3778",
                            "&:hover": {
                              color: "#ff5486",
                            },
                          },
                        }}
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
                    {(
                      (validCoupon / bookingDetails?.price?.current) *
                      100
                    ).toFixed(0)}
                    %
                  </span>
                </div>
                <div className={styles.subtotalRow}>
                  <span>Discounted value:</span>
                  <span className={styles.subtotalAmount}>
                    -{formatCurrency(validCoupon)}
                  </span>
                </div>
              </div>
            )}
            {errorMessage && (
              <div className={styles.errorMessage}>
                <img
                  src={Danger}
                  alt=""
                  style={{ height: "20px", width: "20px" }}
                />
                {errorMessage}

                {bookingInitiated &&
                  errorMessage !== "Please enter a coupon code" && (
                    <button
                      onClick={() => {
                        setBookingInitiated(false);
                        setPaymentUrl(null);
                        setInvoiceId("");
                        setErrorMessage(null);
                        setPaymentFailed(false);
                        // Navigate back to the deskBook page
                        navigate("/bookDesk");
                      }}
                      className={styles.resetButton}
                      style={{
                        marginTop: "6px",
                        padding: "10px 22px",
                        backgroundColor: "rgba(255, 255, 255, 1)",
                        border: "1px solid rgba(34, 34, 34, 1)",
                        color: "rgba(34, 34, 34, 1)",
                        borderRadius: "4px",
                        cursor: "pointer",
                        width: "50%",
                        fontSize: "14px",
                        alignSelf: "center",
                      }}
                    >
                      Reset Application
                    </button>
                  )}
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
            {/* Error Messages */}

            {/* Payment Button */}
            <button
              onClick={handlePayment}
              className={styles.paymentButton}
              disabled={
                paymentStatus === "success" || paymentFailed || isButtonDisabled
              }
            >
              {paymentStatus === "success"
                ? "Payment Completed"
                : paymentFailed
                ? "Payment Failed"
                : bookingInitiated && paymentUrl
                ? "Resume Payment"
                : "Proceed to Payment"}
            </button>
            <button
              style={{
                marginTop: "12px",
                height: "50px",
                width: "100%",
                backgroundColor: "rgba(255, 255, 255, 1)",
                border: "1px solid rgba(34, 34, 34, 1)",
                color: "rgba(34, 34, 34, 1)",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "16px",
                fontWeight: "400",
              }}
              onClick={() => navigate("/bookDesk/flexible")}
            >
              Back
            </button>
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
          </>
        )}
      </div>

      {/* {showErrorModal && (
  <RestartBookingModal
    isOpen={showErrorModal}
    onClose={() => setShowErrorModal(false)}
    message={backendErrorMessage}
    status={backendErrorStatus}
  />
)} */}
    </div>
  );
}
