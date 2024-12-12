import React from "react";
import { Button } from "@mui/material";
import styles from "./Footer.module.css";

export default function Footer({
  price,
  handleNext,
  handleBack,
  isBackDisabled,
  isNextDisabled,
}) {
  return (
    <div className={styles.formFooter}>
      <div className={styles.priceInfo}>
        <span className={styles.totalPay}>Total to pay</span>
        <span className={styles.price}>{price} ALL</span>
      </div>
      <div className={styles.btnRow}>
        <Button
          variant="outlined"
          style={{ width: 150, height: 42 }}
          onClick={handleBack}
          disabled={isBackDisabled}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          sx={{
            backgroundColor: "#4FB2BF",
            "&:hover": {
              backgroundColor: "#4FB2B4",
            },
          }}
          style={{ width: 150, height: 42 }}
          onClick={handleNext}
          disabled={isNextDisabled}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
