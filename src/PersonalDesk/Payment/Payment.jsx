import React, { useEffect, useState } from "react";
import styles from "./Payment.module.css";
import LabeledInput from "../../components/LabeledInput";
import { useBooking } from "../../context/BookingContext";
import CircularProgress, {
  circularProgressClasses,
} from "@mui/material/CircularProgress";
import { TextField } from "@mui/material";

const timePeriods = [
  { value: "24 Hours", label: "24 Hours" },
  { value: "1 Week", label: "1 Week" },
  { value: "1 Month", label: "1 Month" },
];

export default function Payment({ loading, setIsLoading }) {
  const { personalDeskUserInfo, handlePersonalDesk, period, setPeriod } =
    useBooking();

  useEffect(() => {
    console.log("🚀 ~ Payment ~ personalDeskUserInfo:", personalDeskUserInfo);
  }, [personalDeskUserInfo]);

  const formatDate = (dateObj) => {
    const formattedDate = dateObj.format("YYYY-MM-DDTHH:mm:ssZ");

    return formattedDate;
  };

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
      <div className={styles.sectionTittle}>
        This service has been scheduled for:
      </div>
      <div>
        <p>Daily service (24h)</p>
        <p>23 November 2024 - 30 November 2024</p>
      </div>
      <div className={styles.divider} />
      <div className={styles.sectionTittle}>Payment Information</div>
      <div className={styles.formRow}>
        <LabeledInput
          label={"Card's holder name"}
          placeholder={"Full Name"}
          onChange={(event) =>
            handlePersonalDesk("firstName", event.target.value)
          }
        />
        <LabeledInput
          label={"Card Number"}
          placeholder={"XXXXXXXXXXXXXX"}
          onChange={(event) =>
            handlePersonalDesk("lastName", event.target.value)
          }
        />
      </div>
      <div className={styles.formRow}>
        <LabeledInput
          label={"CSV"}
          placeholder={"XXXX"}
          onChange={(event) =>
            handlePersonalDesk("idNumber", event.target.value)
          }
        />
        <LabeledInput
          label={"Expiring date"}
          placeholder={"mm/yy"}
          onChange={(event) =>
            handlePersonalDesk("idNumber", event.target.value)
          }
        />
      </div>
      <div className={styles.sectionTittle}>Address</div>
      <div className={styles.formRow}>
        <TextField placeholder="Street" style={{ width: "100%" }} />
        <TextField placeholder="City" style={{ width: "100%" }} />
      </div>
      <div className={styles.divider} />
    </div>
  );
}
