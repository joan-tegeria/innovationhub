import React, { useEffect, useState } from "react";
import styles from "./Finished.module.css";
import LabeledInput from "../../components/LabeledInput";
import { useBooking } from "../../context/BookingContext";
import Success from "../../assets/form_success.svg";
import CircularProgress, {
  circularProgressClasses,
} from "@mui/material/CircularProgress";
import { TextField } from "@mui/material";
import dayjs from "dayjs";

export default function Finished({ loading, setIsLoading }) {
  const { personalDeskUserInfo, handlePersonalDesk, period, setPeriod } =
    useBooking();

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
          <div>{personalDeskUserInfo.workspace}</div>
        </div>
        <div className={styles.formRow}>
          <div>Starting date:</div>
          <div>{personalDeskUserInfo.selectDate}</div>
        </div>
        <div className={styles.formRow}>
          <div>Ending date:</div>
          <div>{personalDeskUserInfo.endDate}</div>
        </div>
        <div className={styles.formRow}>
          <div>Total payment:</div>
          <div>{personalDeskUserInfo.totalToPay}</div>
        </div>
      </div>
      <div className={styles.divider} />
    </div>
  );
}
