import React, { useEffect, useState } from "react";
import styles from "./Information.module.css";
import LabeledInput from "../../components/LabeledInput";
import { useBooking } from "../../context/BookingContext";
import infowhite from "../../assets/infowhite.svg";
import infoico from "../../assets/info.svg";
import { Chip } from "@mui/material";

import CircularProgress, {
  circularProgressClasses,
} from "@mui/material/CircularProgress";
import { formatBirthDate } from "../../utility";

const timePeriods = [
  { value: "Daily", label: "Daily" },
  { value: "Weekly", label: "Weekly" },
  { value: "Monthly", label: "Monthly" },
];

const businessSizes = [
  { value: "1", label: "1-5 Employees" },
  { value: "2", label: "5-10 Employees" },
  { value: "3", label: "10+ Employees" },
];

// const workspaceOptions = [
//   { value: "solo", label: "The Solo" },
//   { value: "duo", label: "The Duo" },
//   { value: "pod", label: "The Pod" },
//   { value: "suite", label: "The Suite" },
// ];

export default function Information({
  loading,
  // setIsLoading,
  checkOffice,
  workspaces,
  info,
  infoMessage,
  couponCode,
  setCouponCode,
  couponLoading,
  onApplyCoupon,
  validCoupon,
  onRemoveCoupon,
}) {
  const { fullOfficeInfo, handleFullOffice, period, setPeriod } = useBooking();
  const [teamSize, setTeamSize] = useState("1");

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
      <div className={styles.workspaceButtons}>
        {workspaces.map((workspace) => (
          <button
            key={workspace.value}
            className={`${styles.workspaceButton} ${
              fullOfficeInfo.workspace === workspace.value
                ? styles.selected
                : ""
            }`}
            onClick={() => handleFullOffice("workspace", workspace.value)}
          >
            {workspace.label}
          </button>
        ))}
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
      <div className={styles.requestTypeButtons}>
        <button
          className={`${styles.requestTypeButton} ${
            fullOfficeInfo.requestedFrom === "Business" ? styles.selected : ""
          }`}
          onClick={() => handleFullOffice("requestedFrom", "Business")}
        >
          Business
        </button>
        <button
          className={`${styles.requestTypeButton} ${
            fullOfficeInfo.requestedFrom === "Individual" ? styles.selected : ""
          }`}
          onClick={() => handleFullOffice("requestedFrom", "Individual")}
        >
          Individual
        </button>
      </div>
      <div className={styles.formRow}>
        <LabeledInput
          label={
            fullOfficeInfo.requestedFrom === "Business"
              ? "Business Name"
              : "Full Name"
          }
          isRequired={true}
          value={fullOfficeInfo.businessName}
          placeholder={"eg. John"}
          onChange={(event) =>
            handleFullOffice("businessName", event.target.value)
          }
        />
        <LabeledInput
          label={
            fullOfficeInfo.requestedFrom === "Business" ? "NIPT" : "Personal ID"
          }
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

      {/* Coupon Section */}
      <span style={{ fontSize: 16, fontWeight: 700 }}>
        Do you have a discround code?
      </span>
      <span style={{ fontSize: 14 }}>
        Apply it at checkout to get a special discount on your order. If not
        <a style={{ textDecoration: "underline", cursor: "pointer" }}>
          {" "}
          click here
        </a>
        <div className={styles.couponInput}>
          {validCoupon ? (
            <div className={styles.couponChip}>
              <Chip
                label={validCoupon.name || couponCode}
                onDelete={onRemoveCoupon}
                color="#eb3778"
                variant="outlined"
                style={{ height: 48, fontSize: 16 }}
              />
            </div>
          ) : (
            <>
              <input
                type="text"
                placeholder="Code"
                style={{ height: 48, width: "100%" }}
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
              />
              <button
                className={styles.couponButton}
                onClick={() => onApplyCoupon(couponCode)}
                disabled={couponLoading}
              >
                {couponLoading ? "Applying..." : "Apply"}
              </button>
            </>
          )}
        </div>
      </span>
      <div className={styles.divider} />
    </div>
  );
}
