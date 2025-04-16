import React from "react";
import styles from "./Finished.module.css";
import Success from "../../assets/form_success.svg";
import { Button } from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";

export default function FinishedBooking() {
  const location = useLocation();
  const navigate = useNavigate()

  // Get type from location state with a default value
  const { type = "personal" } = location.state || {};

  // Determine title based on type
  const titleText =
    type === "private"
      ? "Your quote request is sent!"
      : "Your payment is made successfully.";

  // const handleReturnHome = (e) => {
  //   e.preventDefault();
  //   const link = "http://35.176.180.59/";

  //   // Try to communicate with parent window if in iframe
  //   if (window.parent !== window) {
  //     try {
  //       // Send message to parent window
  //       window.parent.postMessage(
  //         { type: "openLInkInside", link: "http://35.176.180.59/" },
  //         "*"
  //       );
  //     } catch (error) {
  //       // Fallback to direct window.open if postMessage fails
  //       window.open(link);
  //     }
  //   } else {
  //     // If not in iframe, open directly
  //     window.open(link);
  //   }
  // };


  // const handleReturnHome = (e) => {
  //   e.preventDefault();
    
  //   // Check if we're in an iframe
  //   const isInIframe = window !== window.parent;
    
  //   if (isInIframe) {
  //     try {
  //       // Send message to parent window to navigate back
  //       window.parent.postMessage(
  //         { type: "navigateBack", timestamp: Date.now() }, 
  //         "*" // Consider restricting this to your domain in production
  //       );
        
  //       // Set a timeout to fall back to history.back() if no response from parent
  //       const timeoutId = setTimeout(() => {
  //         console.log("No response from parent, using fallback navigation");
  //         window.history.back();
  //       }, 300); // Short timeout to keep the UX responsive
        
  //       // Listen for confirmation from parent (optional)
  //       const messageListener = (event) => {
  //         if (event.data?.type === "navigateBackConfirmed") {
  //           clearTimeout(timeoutId);
  //           window.removeEventListener("message", messageListener);
  //         }
  //       };
        
  //       window.addEventListener("message", messageListener);
  //     } catch (error) {
  //       console.error("Error communicating with parent window:", error);
  //       window.history.back();
  //     }
  //   } else {
  //     // Try to use the router first if available
  //     if (typeof window.navigateToHome === 'function') {
  //       window.navigateToHome();
  //     } else if (typeof window.location.replace === 'function') {
  //       // If specific home URL is known, use it
  //       window.location.replace('/');
  //     } else {
  //       // Last resort: browser history
  //       window.history.back();
  //     }
  //   }
  // };

  const handleNavigation = (e) => {
    e.preventDefault();
    
    const targetUrl = "http://35.176.180.59/";
    
    // Check if we're in an iframe
    const isInIframe = window !== window.parent;
    
    if (isInIframe) {
      try {
        // Send message to parent window to navigate to the target URL
        window.parent.postMessage(
          { type: "navigateToRoot", path: targetUrl, timestamp: Date.now() }, 
          "*" // Consider restricting this to your domain in production
        );
        
        // Set a timeout to fall back to direct navigation if no response from parent
        const timeoutId = setTimeout(() => {
          console.log("No response from parent, using fallback navigation");
          // Use replace to avoid adding to browser history
          window.location.replace(targetUrl);
        }, 300);
        
        // Listen for confirmation from parent (optional)
        const messageListener = (event) => {
          if (event.data?.type === "navigateConfirmed") {
            clearTimeout(timeoutId);
            window.removeEventListener("message", messageListener);
          }
        };
        
        window.addEventListener("message", messageListener);
      } catch (error) {
        console.error("Error communicating with parent window:", error);
        // Use replace to avoid adding to browser history
        window.location.replace(targetUrl);
      }
    } else {
      // Use replace to avoid adding to browser history
      window.location.replace(targetUrl);
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
          onClick={handleNavigation}
        >
            Start new booking
        </Button>
      </div>
    </div>
  );
}
