import React, { useEffect, useState } from "react";
import styles from "./Information.module.css";
import LabeledInput from "../../components/LabeledInput";
import { useBooking } from "../../context/BookingContext";

import CircularProgress, {
  circularProgressClasses,
} from "@mui/material/CircularProgress";
import { formatBirthDate } from "../../utility";

const timePeriods = [
  { value: "24 Hours", label: "24 Hours" },
  { value: "1 Week", label: "1 Week" },
  { value: "1 Month", label: "1 Month" },
];

const businessSizes = [
  { value: "1", label: "1-5 Employees" },
  { value: "2", label: "5-10 Employees" },
  { value: "3", label: "10+ Employees" },
];

export default function Information({
  loading,
  // setIsLoading,
  checkOffice,
  workspaces,
}) {
  const { fullOfficeInfo, handleFullOffice, period, setPeriod } = useBooking();
  const [teamSize, setTeamSize] = useState("1");

  // useEffect(() => {
  //   console.log("🚀 ~ fullOfficeInfo:", fullOfficeInfo);
  // }, [fullOfficeInfo]);

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
      <div style={{ width: "316px", marginBottom: "25px" }}>
        <LabeledInput
          label={"Select space"}
          // placeholder={"eg. John"}
          items={workspaces}
          type="select"
          isRequired={true}
          selectValue={fullOfficeInfo.workspace}
          onChange={(event) =>
            handleFullOffice("workspace", event.target.value)
          }
        />
      </div>
      {/* <div className={styles.sectionTittle}>Time Period</div> */}
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
            handleFullOffice("selectDate", value);
            console.log(value);
            checkOffice(value);
          }}
        />
      </div>
      <div className={styles.divider} />
      <div className={styles.sectionTittle}>Business Information</div>
      <div className={styles.formRow}>
        <LabeledInput
          label={"Business Name"}
          isRequired={true}
          value={fullOfficeInfo.businessName}
          placeholder={"eg. John"}
          onChange={(event) =>
            handleFullOffice("businessName", event.target.value)
          }
        />
        <LabeledInput
          label={"NIPT"}
          placeholder={"eg. Doe"}
          value={fullOfficeInfo.nipt}
          onChange={(event) => handleFullOffice("nipt", event.target.value)}
        />
      </div>
      <div className={styles.formRow}>
        <LabeledInput
          label={"Business Size"}
          placeholder={"eg. John"}
          items={businessSizes}
          type="select"
          isRequired={true}
          selectValue={teamSize}
          onChange={(event) => setTeamSize(event.target.value)}
        />
        <LabeledInput
          label={"Phone Number"}
          placeholder={"06XXXXXXX"}
          value={fullOfficeInfo.phoneNumber}
          // regex={/^[A-Za-z]\d{8}[A-Za-z]$/}
          onChange={(event) =>
            handleFullOffice("phoneNumber", event.target.value)
          }
        />
      </div>
      <div style={{ width: "316px", marginBottom: "25px" }}>
        <LabeledInput
          label={"Email"}
          value={fullOfficeInfo.email}
          regex={/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/}
          placeholder={"johndoe@gmail.com"}
          onChange={(event) => handleFullOffice("email", event.target.value)}
        />
      </div>
      <div className={styles.divider} />
      <div className={styles.sectionTittle}>Address</div>
      <div className={styles.formRow}>
        <LabeledInput
          label={"Street"}
          isRequired={true}
          value={fullOfficeInfo.street}
          placeholder={"Muhamet Gjollesha"}
          onChange={(event) => handleFullOffice("street", event.target.value)}
        />
        <LabeledInput
          label={"City"}
          placeholder={"Tirna"}
          value={fullOfficeInfo.city}
          onChange={(event) => handleFullOffice("city", event.target.value)}
        />
      </div>
      <div className={styles.divider} />
    </div>
  );
}
