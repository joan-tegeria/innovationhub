import React, { useEffect, useState } from "react";
import styles from "./Payment.module.css";
import LabeledInput from "../../components/LabeledInput";
import { useBooking } from "../../context/BookingContext";
import CircularProgress, {
  circularProgressClasses,
} from "@mui/material/CircularProgress";
import { TextField } from "@mui/material";
import Calendar from "../../assets/calendar.svg";

const timePeriods = [
  { value: "Daily", label: "Daily" },
  { value: "Weekly", label: "Weekly" },
  { value: "Monthly", label: "Monthly" },
];

export default function Payment({ loading, setIsLoading }) {
  const { personalDeskUserInfo, handlePersonalDesk, period, setPeriod } =
    useBooking();

  // useEffect(() => {
  //   console.log("🚀 ~ Payment ~ personalDeskUserInfo:", personalDeskUserInfo);
  // }, [personalDeskUserInfo]);

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
      <div className={styles.sectionTittle}>Service Details</div>
      <div className={styles.serviceDetails}>
        <div className={styles.infoCol}>
          <div className={styles.row}>
            <img src={Calendar} alt="calendar icon" />
            <span>Flexible desk</span>
          </div>
          <div className={styles.row}>
            <img src={Calendar} alt="calendar icon" />
            <span>12 - 13 November 2024</span>
          </div>
        </div>
        <div className={styles.period}>
          <span>Daily</span>
        </div>
      </div>
      <div className={styles.divider} />
      <div className={styles.sectionTittle}>Payment Information</div>
      <iframe src="" frameborder="0"></iframe>
      <div className={styles.divider} />
    </div>
  );
}
