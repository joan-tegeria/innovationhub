import React, { useEffect, useState } from "react";
import styles from "./Information.module.css";
import LabeledInput from "../../components/LabeledInput";
import { useBooking } from "../../context/BookingContext";
import { useAuth } from "../../context/Auth";
import infowhite from "../../assets/infowhite.svg";
import infoico from "../../assets/info.svg";
import dayjs from "dayjs";
import CircularProgress, {
  circularProgressClasses,
} from "@mui/material/CircularProgress";
import { formatBirthDate } from "../../util";
import { TextField, Chip } from "@mui/material";
import { label, tr } from "framer-motion/client";
import api from "../../util/axiosConfig";

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
  setIsPriceFilled,
}) {
  const { personalDeskUserInfo, handlePersonalDesk, period, setPeriod } =
    useBooking();
  const { accessToken, tokenType } = useAuth();
  const [selectDate, setSelectDate] = useState(null);

  // Add debounced price update
  useEffect(() => {
    let timer = null;

    if (
      personalDeskUserInfo.bookingType === "Multi Pass" &&
      personalDeskUserInfo.passDuration > 0
    ) {
      timer = setTimeout(() => {
        getPrice(period);
      }, 500); // Wait 500ms after last change before calling getPrice
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [
    personalDeskUserInfo.passDuration,
    personalDeskUserInfo.bookingType,
    getPrice,
    period,
  ]);

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

  const handleWorkspaceSelect = async (workspace) => {
    try {
      console.log("WORKSPACE SELECTED", workspace);
      setIsPriceFilled(false);
      handlePersonalDesk("workspace", workspace);
      await getPrice(period);
      setIsPriceFilled(true);
    } catch (error) {
      console.log("ERROR", error);
    }
  };

  const handleBookingTypeSelect = async (event) => {
    try {
      setIsPriceFilled(false);
      handlePersonalDesk("bookingType", event.target.value);
      await getPrice(period);
      setIsPriceFilled(true);
    } catch (error) {
      console.log("ERROR", error);
    }
  };

  const handlePeriodChange = async (event) => {
    try {
      setIsPriceFilled(false);
      const newPeriod = event.target.value;

      // Only make a single API call based on whether we have a date or not
      if (selectDate && dayjs(selectDate).isValid()) {
        // Set period after we have the new value ready for the API call
        setPeriod(newPeriod);
        console.log("PERIOD CHANGED", newPeriod);

        // This will handle both availability check and price update in one call
        await checkOffice(selectDate, newPeriod);
      } else {
        // Set period after we have the new value ready for the API call
        setPeriod(newPeriod);
        console.log("PERIOD CHANGED", newPeriod);

        // Only get price if no date is selected
        console.log("No valid date selected, only updating price");
        await getPrice(newPeriod);
      }

      setIsPriceFilled(true);
    } catch (error) {
      console.error("Error handling period change:", error);
      setIsPriceFilled(false);
    }
  };

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
                handleWorkspaceSelect(workspace.value);
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
              handleBookingTypeSelect(event);
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
              onChange={(event) => handlePeriodChange(event)}
            />
            <LabeledInput
              type="date"
              label={"Select Date"}
              isRequired={true}
              minDate={new Date()}
              onChange={(value) => {
                setSelectDate(value);
                handlePersonalDesk("selectDate", value);
                console.log(value);
                checkOffice(value, period); // Pass current period here as well
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
            maxDate={
              new Date(new Date().setFullYear(new Date().getFullYear() - 18))
            }
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
      </div>
    </>
  );
}
