import React, { useEffect } from "react";

/**
 * PaymentModal Component
 * Renders a modal with an iframe for payment processing
 *
 * @param {string} paymentUrl - URL to load in the iframe
 * @param {function} onClose - Function to call when the modal is closed
 * @param {function} onError - Function to call when there's an error loading the iframe
 * @param {function} onLoad - Function to call when the iframe is loaded successfully
 */
const PaymentModal = ({ paymentUrl, onClose, onError, onLoad }) => {
  // Log when component mounts
  useEffect(() => {
    console.log("PaymentModal mounted with URL:", paymentUrl);

    // Clean up when component unmounts
    return () => {
      console.log("PaymentModal unmounting");
    };
  }, [paymentUrl]);

  // Modal overlay styles
  const modalStyle = {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    zIndex: 1000,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  };

  // Container to prevent click propagation
  const containerStyle = {
    position: "relative",
    zIndex: 1001,
  };

  // Iframe styles
  const iframeStyle = {
    width: window.innerWidth <= 640 ? "360px" : "640px",
    height: window.innerWidth <= 640 ? "780px" : "580px",
    border: "none",
    borderRadius: "8px",
    backgroundColor: "white",
    overflow: "hidden",
    WebkitOverflowScrolling: "touch",
  };

  /**
   * Handle clicks on the modal background
   */
  const handleBackgroundClick = (event) => {
    // Only close if clicking directly on the background
    if (event.target === event.currentTarget) {
      console.log("Modal background clicked");
      // onClose();
    }
  };

  /**
   * Handle iframe load errors
   */
  const handleIframeError = (error) => {
    console.error("Iframe error:", error);
    onError?.(error);
  };

  /**
   * Handle successful iframe load
   */
  const handleIframeLoad = () => {
    console.log("Iframe loaded successfully");
    onLoad?.();
  };

  return (
    <div style={modalStyle} onClick={handleBackgroundClick}>
      <div style={containerStyle} onClick={(e) => e.stopPropagation()}>
        <iframe
          src={paymentUrl}
          style={iframeStyle}
          onError={handleIframeError}
          onLoad={handleIframeLoad}
          allow="payment *; scripts *"
          sandbox="allow-forms allow-scripts allow-same-origin allow-top-navigation allow-popups allow-popups-to-escape-sandbox allow-modals"
          title="payment-iframe"
        />
      </div>
    </div>
  );
};

export default PaymentModal;
