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
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <img src={Success} className={styles.successImage} />
        <div className={styles.sectionTittle}>
          Your request is made successfully.
        </div>
        <span>Check your email for further details.</span>

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

      <div className={styles.divider} />
    </div>
  );
}
