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

export default function Finished({ loading, selectedWorkspace, price }) {
  const { personalDeskUserInfo, handlePersonalDesk, period, setPeriod } =
    useBooking();
  //TODO ADD BACK TO HOMEPAGE SCREEN

  if (loading) {
    return (
      <div
        className={styles.formBody}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: 501,
        }}
      >
        <CircularProgress
          variant="indeterminate"
          disableShrink
          sx={(theme) => ({
            color: "#1a90ff",
            animationDuration: "550ms",
            [`& .${circularProgressClasses.circle}`]: {
              strokeLinecap: "round",
            },
            ...theme.applyStyles("dark", {
              color: "#308fe8",
            }),
          })}
          size={40}
          thickness={4}
        />
      </div>
    );
  }

  return (
    <div className={styles.formBody}>
      <img src={Success} className={styles.successImage} />
      <div className={styles.sectionTittle}>
        Your payment is made successfully.
      </div>
      <span>Check your email for further details.</span>
      <div className={styles.purchaseInfo}>
        <div className={styles.infoTitle}>
          <span>Order details</span>
        </div>
        <div className={styles.formRow}>
          <div>Workspace:</div>
          <div>{selectedWorkspace.label}</div>
        </div>
        {personalDeskUserInfo.bookingType === "Single Pass" ? (
          <>
            <div className={styles.formRow}>
              <div>Starting date:</div>
              <div>{personalDeskUserInfo.selectDate}</div>
            </div>
            <div className={styles.formRow}>
              <div>Ending date:</div>
              <div>{personalDeskUserInfo.endDate}</div>
            </div>
          </>
        ) : null}
        <div className={styles.formRow}>
          <div>Total payment:</div>
          <div>{price}</div>
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
  );
}
