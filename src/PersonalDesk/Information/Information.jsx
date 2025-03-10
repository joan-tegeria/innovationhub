import React, { useEffect, useState } from "react";
import styles from "./Information.module.css";
import LabeledInput from "../../components/LabeledInput";
import { useBooking } from "../../context/BookingContext";
import { useAuth } from "../../context/Auth";
import infowhite from "../../assets/infowhite.svg";
import infoico from "../../assets/info.svg";
import CircularProgress, {
  circularProgressClasses,
} from "@mui/material/CircularProgress";
import { formatBirthDate } from "../../utility";
import { TextField, Chip } from "@mui/material";
import { label } from "framer-motion/client";
import api from "../../utility/axiosConfig";

const timePeriods = [
  { value: "Daily", label: "Daily" },
  { value: "Weekly", label: "Weekly" },
  { value: "Monthly", label: "Monthly" },
];

const subs = [
  { value: "Single Pass", label: "Single Pass" },
  { value: "Multi Pass", label: "Multi Pass" },
];

export default function Information({
  loading,
  setIsLoading,
  checkOffice,
  workspaces,
  info,
  infoMessage,
  getPrice,
  couponCode,
  setCouponCode,
  couponLoading,
  onApplyCoupon,
  validCoupon,
  onRemoveCoupon,
}) {
  const { personalDeskUserInfo, handlePersonalDesk, period, setPeriod } =
    useBooking();
  const { accessToken, tokenType } = useAuth();

  // Add debounced price update
  useEffect(() => {
    if (
      personalDeskUserInfo.bookingType === "Multi Pass" &&
      personalDeskUserInfo.passDuration > 0
    ) {
      const timer = setTimeout(() => {
        getPrice();
      }, 500); // Wait 500ms after last change before calling getPrice

      return () => clearTimeout(timer);
    }
  }, [personalDeskUserInfo.passDuration, personalDeskUserInfo.bookingType]);

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
    <>
      <div className={styles.formTitle}>
        <span className={styles.title}>Ready to get started</span>
      </div>
      <div className={styles.formBody}>
        <div className={styles.divider} />
        <div className={styles.sectionTittle}>Space Information</div>
        <div className={styles.workspaceButtons}>
          {workspaces.map((workspace) => (
            <button
              key={workspace?.value}
              className={`${styles.workspaceButton} ${
                personalDeskUserInfo.workspace === workspace.value
                  ? styles.selected
                  : ""
              }`}
              onClick={() => {
                console.log(workspace.value);
                handlePersonalDesk("workspace", workspace.value);
              }}
            >
              {workspace.label}
            </button>
          ))}
        </div>

        <div className={styles.formRow}>
          <LabeledInput
            label={"Subscription Time"}
            items={subs}
            type="select"
            isRequired={true}
            selectValue={personalDeskUserInfo.bookingType}
            onChange={(event) => {
              handlePersonalDesk("bookingType", event.target.value);
            }}
          />
        </div>
        {personalDeskUserInfo.bookingType === "Multi Pass" ? (
          <>
            <div className={styles.formRow}>
              <LabeledInput
                label={"Number of passes"}
                type="number"
                isRequired={true}
                value={personalDeskUserInfo.passDuration}
                placeholder={"Days"}
                onChange={(event) => {
                  handlePersonalDesk(
                    "passDuration",
                    Number(event.target.value)
                  );
                }}
              />
            </div>
            {/* <div className={styles.info}>
              <img src={infoico} alt="" />
              <span>Multi-pass allows you to enter and access desk.</span>
            </div> */}
          </>
        ) : (
          <div className={styles.formRow}>
            <LabeledInput
              label={"Time Period"}
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
        )}
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
            onChange={(event) =>
              handlePersonalDesk("email", event.target.value)
            }
          />
        </div>
        <div className={styles.divider} />
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
    </>
  );
}
