import React from "react";
import { Button } from "@mui/material";
import styles from "./Footer.module.css";

export default function Footer({
  price,
  handleNext,
  handleBack,
  isBackDisabled,
  isNextDisabled,
  isLast,
}) {
  return (
    <div
      className={styles.formFooter}
      style={{ flexDirection: isLast && "row-reverse" }}
    >
      {!isLast && (
        <div className={styles.priceInfo}>
          <span className={styles.totalPay}>Total to pay</span>
          <span className={styles.price}>{price} ALL</span>
        </div>
      )}
      <div className={styles.btnRow}>
        {/* {!isLast && (
          <Button
            variant="outlined"
            style={{ width: 150, height: 42 }}
            onClick={handleBack}
            disabled={isBackDisabled}
          >
            Cancel
          </Button>
        )} */}
        {!isLast && (
          <Button
            variant="contained"
          sx={{
            backgroundColor: "#EB3778",
            "&:hover": {
              backgroundColor: "#d62e69",
            },
            fontFamily: "Termina Test",
            textTransform: "none",
          }}
          style={{ width: 220, height: 42, flex: 1 }}
          onClick={handleNext}
          disabled={isNextDisabled}
          autoCapitalize={false}
        >
            Continue
          </Button>
        )}
      </div>
    </div>
  );
}
