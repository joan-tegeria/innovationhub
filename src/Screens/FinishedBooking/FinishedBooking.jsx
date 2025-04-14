import React from "react";
import styles from "./Finished.module.css";
import Success from "../../assets/form_success.svg";
import { Button } from "@mui/material";
import { useLocation } from "react-router-dom";

export default function FinishedBooking() {
  const location = useLocation();

  // Get type from location state with a default value
  const { type = "personal" } = location.state || {};

  // Determine title based on type
  const titleText =
    type === "private"
      ? "Your quote request is sent!"
      : "Your payment is made successfully.";

  const handleReturnHome = (e) => {
    e.preventDefault();
    const link = "http://35.176.180.59/";

    // Try to communicate with parent window if in iframe
    if (window.parent !== window) {
      try {
        // Send message to parent window
        window.parent.postMessage(
          { type: "openLInkInside", link: "http://35.176.180.59/" },
          "*"
        );
      } catch (error) {
        // Fallback to direct window.open if postMessage fails
        window.open(link);
      }
    } else {
      // If not in iframe, open directly
      window.open(link);
    }
  };

  return (
    <div className={styles.background}>
      <div className={styles.formBody}>
        <img src={Success} className={styles.successImage} alt="Success" />
        <h2 className={styles.successTitle}>{titleText}</h2>
        <p className={styles.successMessage}>
          Check your email for further details.
        </p>

        <Button
          variant="contained"
          sx={{
            backgroundColor: "#EB3778",

            fontFamily: "Termina Test",
            textTransform: "none",
            marginTop: "25px",
            borderRadius: "4px",
            padding: "10px 20px",
            boxShadow: "none",
            "&:hover": {
              backgroundColor: "#ff5486",
              boxShadow: "none",
            },
          }}
          style={{ width: 220, height: 42 }}
          onClick={handleReturnHome}
        >
          Go to home
        </Button>
      </div>
    </div>
  );
}
