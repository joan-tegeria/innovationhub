import React, { useEffect, useState } from "react";
import styles from "./Finished.module.css";
import LabeledInput from "../../components/LabeledInput";
import { useBooking } from "../../context/BookingContext";
import Success from "../../assets/form_success.svg";
import CircularProgress, {
  circularProgressClasses,
} from "@mui/material/CircularProgress";
import { TextField, Button } from "@mui/material";
import dayjs from "dayjs";
import { useNavigate, useLocation } from "react-router-dom";

export default function FinishedBooking() {
  // const navigate = useNavigate();
  const location = useLocation();
  const { selectedWorkspace, selectDate, endDate, period, price } =
    location.state || {};
  console.log(location.state);
  return (
    <div className={styles.background}>
      <div className={styles.formBody}>
        <img src={Success} className={styles.successImage} />
        <div className={styles.sectionTittle}>
          Your submission is made successfully.
        </div>
        <span>Check your email for further details.</span>
        <div className={styles.purchaseInfo}>
          <div className={styles.infoTitle}>
            <span>Order details</span>
          </div>
          <div className={styles.formRow}>
            <div>Workspace:</div>
            <div>{selectedWorkspace.label || ""}</div>
          </div>
          <div className={styles.formRow}>
            <div>Period:</div>
            <div>{period || ""}</div>
          </div>
          <div className={styles.formRow}>
            <div>Starting date:</div>
            <div>{selectDate || ""}</div>
          </div>
          <div className={styles.formRow}>
            <div>Ending date:</div>
            <div>{endDate || ""}</div>
          </div>
          <div className={styles.formRow}>
            <div>Total payment:</div>
            <div>{price || ""}</div>
          </div>
        </div>
        {/* <div className={styles.divider} /> */}

        <Button
          variant="contained"
          sx={{
            backgroundColor: "#EB3778",
            "&:hover": {
              backgroundColor: "#d62e69",
            },
            fontFamily: "Termina Test",
            textTransform: "none",
            marginTop: "25px",
          }}
          style={{ width: 220, height: 42 }}
          onClick={() => window.parent.open("http://35.176.180.59/", "_self")}
        >
          Back to Home
        </Button>
      </div>
    </div>
  );
}
