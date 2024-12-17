import React, { useEffect, useState } from "react";
import styles from "./Information.module.css";
import LabeledInput from "../../components/LabeledInput";
import { useBooking } from "../../context/BookingContext";
import CircularProgress, {
  circularProgressClasses,
} from "@mui/material/CircularProgress";
import dayjs from "dayjs";
const timePeriods = [
  { value: "24 Hours", label: "24 Hours" },
  { value: "1 Week", label: "1 Week" },
  { value: "1 Month", label: "1 Month" },
];

export default function Information({ loading, setIsLoading, checkOffice }) {
  const { personalDeskUserInfo, handlePersonalDesk, period, setPeriod } =
    useBooking();
  const [error, setError] = useState(false);
  useEffect(() => {
    console.log(
      "🚀 ~ Information ~ personalDeskUserInfo:",
      personalDeskUserInfo
    );
  }, [personalDeskUserInfo]);

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
          isRequired={true}
          selectValue={period}
          onChange={(event) => setPeriod(event.target.value)}
        />
        <LabeledInput
          type="date"
          label={"Select Date"}
          isRequired={true}
          onChange={(value) => {
            handlePersonalDesk("selectDate", value);
            checkOffice(value);
          }}
        />
      </div>
      <div className={styles.divider} />
      <div className={styles.sectionTittle}>Personal Information</div>
      <div className={styles.formRow}>
        <LabeledInput
          label={"First Name"}
          isRequired={true}
          value={personalDeskUserInfo.firstName}
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
          onChange={(value) => handlePersonalDesk("birthday", value)}
        />
        <LabeledInput
          label={"Identification Number"}
          placeholder={"XXXXXXXXX"}
          regex={/^[A-Za-z]\d{8}[A-Za-z]$/}
          onChange={(event) =>
            handlePersonalDesk("idNumber", event.target.value)
          }
        />
      </div>
      <div style={{ width: "316px", marginBottom: "25px" }}>
        <LabeledInput
          label={"Email"}
          regex={/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/}
          placeholder={"johndoe@gmail.com"}
          onChange={(event) => handlePersonalDesk("email", event.target.value)}
        />
      </div>
      <div className={styles.divider} />
    </div>
  );
}
