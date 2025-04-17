import React from "react";
import styles from "./RestartBoking.module.css";
import CalendarModal from "../../assets/CalendarModal.svg";

export default function RestartBookingModal({
  isOpen,
  onClose,
  message,
  onReset
}) {
  if (!isOpen) return null;

  const handleRestart = () => {
    onClose();
    onReset()
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContainer}>
        <div className={styles.title}>Restart booking</div>
        <div className={styles.titleDivider}></div>
        <img src={CalendarModal} alt="" />
        <div>
          {message ||
            "We're sorry for any inconvenience, but in order to proceed, you'll need to restart your booking from the beginning."}
        </div>
        <div className={styles.titleDivider}></div>
        <button className={styles.button} onClick={handleRestart}>
          Reset
        </button>
      </div>
    </div>
  );
}
