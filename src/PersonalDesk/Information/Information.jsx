import React, { useEffect, useState } from "react";
import styles from "./Information.module.css";
import LabeledInput from "../../components/LabeledInput";
import { useBooking } from "../../context/BookingContext";
import CircularProgress, {
  circularProgressClasses,
} from "@mui/material/CircularProgress";

const timePeriods = [
  { value: "24 Hours", label: "24 Hours" },
  { value: "1 Week", label: "1 Week" },
  { value: "1 Month", label: "1 Month" },
];

export default function Information({ loading, setIsLoading }) {
  const { personalDeskUserInfo, handlePersonalDesk, period, setPeriod } =
    useBooking();

  useEffect(() => {
    console.log(
      "🚀 ~ Information ~ personalDeskUserInfo:",
      personalDeskUserInfo
    );
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
      <div className={styles.sectionTittle}>Time Period</div>
      <div className={styles.formRow}>
        <LabeledInput
          label={"Time Period"}
          placeholder={"eg. John"}
          items={timePeriods}
          type="select"
          isRequired
          selectValue={period}
          onChange={(event) => setPeriod(event.target.value)}
        />
        <LabeledInput
          type="date"
          label={"Select Date"}
          onChange={(value) =>
            handlePersonalDesk("selectDate", formatDate(value))
          }
        />
      </div>
      <div className={styles.divider} />
      <div className={styles.sectionTittle}>Personal Information</div>
      <div className={styles.formRow}>
        <LabeledInput
          label={"First Name"}
          placeholder={"eg. John"}
          onChange={(event) =>
            handlePersonalDesk("firstName", event.target.value)
          }
        />
        <LabeledInput
          label={"Last Name"}
          placeholder={"eg. Doe"}
          onChange={(event) =>
            handlePersonalDesk("lastName", event.target.value)
          }
        />
      </div>
      <div className={styles.formRow}>
        <LabeledInput
          type="date"
          label={"Birthday"}
          onChange={(value) =>
            handlePersonalDesk("birthday", formatDate(value))
          }
        />
        <LabeledInput
          label={"Identification Number"}
          placeholder={"XXXXXXXXX"}
          onChange={(event) =>
            handlePersonalDesk("idNumber", event.target.value)
          }
        />
      </div>
      <div style={{ width: "316px", marginBottom: "25px" }}>
        <LabeledInput
          label={"Email"}
          placeholder={"johndoe@gmail.com"}
          onChange={(event) => handlePersonalDesk("email", event.target.value)}
        />
      </div>
      <div className={styles.divider} />
    </div>
  );
}
