import React, { useEffect, useState } from "react";
import styles from "./Information.module.css";
import LabeledInput from "../../components/LabeledInput";
import { useBooking } from "../../context/BookingContext";
import infowhite from "../../assets/infowhite.svg";
import infoico from "../../assets/info.svg";
import CircularProgress, {
  circularProgressClasses,
} from "@mui/material/CircularProgress";
import { formatBirthDate } from "../../utility";

const timePeriods = [
  { value: "Daily", label: "Daily" },
  { value: "Weekly", label: "Weekly" },
  { value: "Monthly", label: "Monthly" },
];

export default function Information({
  loading,
  setIsLoading,
  checkOffice,
  workspaces,
  info,
  infoMessage,
}) {
  const { personalDeskUserInfo, handlePersonalDesk, period, setPeriod } =
    useBooking();

  // useEffect(() => {
  //   console.log(
  //     "🚀 ~ Information ~ personalDeskUserInfo:",
  //     personalDeskUserInfo
  //   );
  // }, [personalDeskUserInfo]);

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

  let Info = null;

  switch (info) {
    case "":
      Info = null;
      break;
    case "error":
      Info = (
        <div className={styles.error}>
          <div className={styles.errorIcon}>
            <img src={infowhite} alt="" />
          </div>
          <span>{infoMessage}</span>
        </div>
      );
      break;
    case "info":
      Info = (
        <div className={styles.info}>
          <img src={infoico} alt="" />
          <span>{infoMessage}</span>
        </div>
      );
      break;
    default:
      Info = null;
      break;
  }

  return (
    <div className={styles.formBody}>
      <div className={styles.sectionTittle}>Space Information</div>
      <div className={styles.formRow}>
        <LabeledInput
          label={"Select space"}
          // placeholder={"eg. John"}
          items={workspaces}
          type="select"
          isRequired={true}
          selectValue={personalDeskUserInfo.workspace}
          onChange={(event) =>
            handlePersonalDesk("workspace", event.target.value)
          }
        />
      </div>
      {/* <div className={styles.sectionTittle}>Time Period</div> */}
      <div className={styles.formRow}>
        <LabeledInput
          label={"Time Period"}
          // placeholder={"eg. John"}
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
            console.log(value);
            checkOffice(value);
          }}
        />
      </div>

      {Info}

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
          value={personalDeskUserInfo.lastName}
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
            handlePersonalDesk("birthday", formatBirthDate(value))
          }
        />
        <LabeledInput
          label={"Identification Number"}
          placeholder={"XXXXXXXXX"}
          value={personalDeskUserInfo.idNumber}
          regex={/^[A-Za-z]\d{8}[A-Za-z]$/}
          onChange={(event) =>
            handlePersonalDesk("idNumber", event.target.value)
          }
        />
      </div>
      <div style={{ width: "316px", marginBottom: "25px" }}>
        <LabeledInput
          label={"Email"}
          value={personalDeskUserInfo.email}
          regex={/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/}
          placeholder={"johndoe@gmail.com"}
          onChange={(event) => handlePersonalDesk("email", event.target.value)}
        />
      </div>
      <div className={styles.divider} />
    </div>
  );
}
