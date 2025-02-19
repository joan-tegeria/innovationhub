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
      style={{
        // flexDirection: "row-reverse",
        justifyContent: isLast ? "center" : "flex-end",
      }}
    >
      <div
        className={styles.btnRow}
        style={{
          display: "flex",
          gap: "1rem",
          width: isLast ? "100%" : "auto",
        }}
      >
        {!isLast && (
          <Button
            variant="outlined"
            style={{ width: 250, height: 50, marginBottom: isLast ? 32 : 0 }}
            onClick={handleBack}
            disabled={isBackDisabled}
          >
            Cancel
          </Button>
        )}

        <Button
          variant="contained"
          sx={{
            backgroundColor: "#EB3778",
            "&:hover": {
              backgroundColor: "#d62e69",
            },
          }}
          style={{
            width: isLast ? "100%" : 250,
            height: 50,
          }}
          onClick={handleNext}
          disabled={isNextDisabled}
        >
          {isLast ? "Start new booking" : "Request a quote"}
        </Button>
      </div>
    </div>
  );
}
