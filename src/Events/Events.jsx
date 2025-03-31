import React, { useState, useEffect } from "react";
import styles from "./Events.module.css";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/Auth";
import CircularProgress from "@mui/material/CircularProgress";
import { circularProgressClasses } from "@mui/material/CircularProgress";
import LabeledInput from "../components/LabeledInput";
import api from "../util/axiosConfig";
import dayjs from "dayjs";
import { duration } from "@mui/material";
import Success from "../assets/form_success.svg";

const eventPurposeOptions = [
  { value: "Conference", label: "Conference" },
  { value: "Meeting", label: "Meeting" },
  { value: "Workshop", label: "Workshop" },
  { value: "Social", label: "Social Event" },
];

const eventTypeOptions = [
  { value: "Public", label: "Public" },
  { value: "Private", label: "Private" },
];

// Initial form state for reuse
const initialFormState = {
  fullName: "",
  companyName: "",
  email: "",
  phoneNumber: "",
  eventName: "",
  eventType: "Public",
  startDate: "",
  startTime: "",
  endDate: "",
  endTime: "",
  eventPurpose: "Conference",
  numberOfGuests: "",
  notes: "",
};

export default function Events() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState(initialFormState);
  const [validationError, setValidationError] = useState("");

  const { accessToken, tokenType, tokenLoading } = useAuth();
  const navigate = useNavigate();

  if (tokenLoading) {
    return null;
  }

  const handleChange = (field) => (event) => {
    const value = event?.target?.value ?? event;
    let updatedFormData;

    // Special handling for time values from TimePicker
    if (field === "startTime" || field === "endTime") {
      if (value && typeof value.format === "function") {
        const timeString = value.format("HH:mm");
        updatedFormData = {
          ...formData,
          [field]: timeString,
        };
        setFormData(updatedFormData);

        // Validate dates and times when they change
        if (
          updatedFormData.startDate &&
          updatedFormData.startTime &&
          updatedFormData.endDate &&
          updatedFormData.endTime
        ) {
          validateDateTimes(updatedFormData);
        }
        return;
      }
    }

    updatedFormData = {
      ...formData,
      [field]: value,
    };

    setFormData(updatedFormData);

    // Validate dates and times when they change
    if (
      field === "startDate" ||
      field === "startTime" ||
      field === "endDate" ||
      field === "endTime"
    ) {
      if (
        updatedFormData.startDate &&
        updatedFormData.startTime &&
        updatedFormData.endDate &&
        updatedFormData.endTime
      ) {
        validateDateTimes(updatedFormData);
      }
    }
  };

  // Function to validate date and time inputs
  const validateDateTimes = (data) => {
    setValidationError("");

    // Only validate if we have all date/time fields filled
    if (data.startDate && data.startTime && data.endDate && data.endTime) {
      const now = dayjs();
      const startDateTime = dayjs(`${data.startDate}T${data.startTime}`);
      const endDateTime = dayjs(`${data.endDate}T${data.endTime}`);

      // Check if start date/time is in the past
      if (startDateTime.isBefore(now)) {
        setValidationError(
          "Event cannot be scheduled in the past. Please choose a future date and time."
        );
        return false;
      }

      // Check if end date/time is before start date/time
      if (endDateTime.isBefore(startDateTime)) {
        setValidationError(
          "End date and time cannot be before start date and time."
        );
        return false;
      }
    }

    return true;
  };

  const handleReset = () => {
    setFormData(initialFormState);
    setSuccess(false);
    setValidationError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setValidationError("");

    // Get current date and time for validation
    const now = dayjs();

    // Validate dates and times
    if (
      formData.startDate &&
      formData.startTime &&
      formData.endDate &&
      formData.endTime
    ) {
      if (!validateDateTimes(formData)) {
        return; // Stop submission if validation fails
      }
    }

    setLoading(true);

    let [firstName, ...lastNameParts] = formData.fullName.trim().split(" ");
    const lastName = lastNameParts.join(" ");

    const userData = {
      name: firstName,
      lastName: lastName + " " + formData.companyName,
      email: formData.email,
      phone: formData.phoneNumber,
      company: formData.companyName,
      referral: "Event Form",
    };

    try {
      const { data: userResponse } = await api.post(
        "https://nhpvz8wphf.execute-api.eu-central-1.amazonaws.com/prod/leads",
        userData,
        {
          headers: {
            Authorization: `${tokenType} ${accessToken}`,
          },
        }
      );

      const userId = userResponse.data.id;

      console.log("Start Date:", formData.startDate);
      console.log("Start Time:", formData.startTime);
      console.log("End Date:", formData.endDate);
      console.log("End Time:", formData.endTime);

      // Ensure we have valid date and time values
      if (
        !formData.startDate ||
        !formData.startTime ||
        !formData.endDate ||
        !formData.endTime
      ) {
        throw new Error("Please fill in all date and time fields");
      }

      // Parse dates with explicit timezone
      const startDateTime = dayjs(formData.startDate)
        .hour(parseInt(formData.startTime.split(":")[0]))
        .minute(parseInt(formData.startTime.split(":")[1]))
        .format("YYYY-MM-DDTHH:mm:ss+02:00");

      const endDateTime = dayjs(formData.endDate)
        .hour(parseInt(formData.endTime.split(":")[0]))
        .minute(parseInt(formData.endTime.split(":")[1]))
        .format("YYYY-MM-DDTHH:mm:ss+02:00");

      console.log("Formatted Start DateTime:", startDateTime);
      console.log("Formatted End DateTime:", endDateTime);

      const newEvent = {
        event: formData.eventName,
        user: userId,
        from: startDateTime,
        to: endDateTime,
        purpose: formData.eventPurpose,
        type: formData.eventType,
        noOfGuest: formData.numberOfGuests,
        description: formData.notes,
        duration: "Half-Day",
      };

      await api.post(
        "https://nhpvz8wphf.execute-api.eu-central-1.amazonaws.com/prod/event",
        newEvent,
        {
          headers: {
            Authorization: `${tokenType} ${accessToken}`,
          },
        }
      );

      setSuccess(true);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
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

  if (success) {
    // Format dates for display
    const formattedStartDate = formData.startDate
      ? dayjs(formData.startDate).format("YYYY-MM-DD")
      : "";
    const formattedEndDate = formData.endDate
      ? dayjs(formData.endDate).format("YYYY-MM-DD")
      : "";

    return (
      <div className={styles.formContainer}>
        <div className={styles.formBody}>
          <img src={Success} className={styles.successImage} />
          <div className={styles.sectionTittle}>
            Your request was sent successfully.
          </div>
          <span>Check your email for further details.</span>
          <div className={styles.purchaseInfo}>
            <div className={styles.infoTitle}>
              <span>Event details</span>
            </div>
            <div className={styles.formRow}>
              <div>Event name:</div>
              <div>{formData.eventName}</div>
            </div>
            <div className={styles.formRow}>
              <div>Date:</div>
              <div>
                {formattedStartDate} to {formattedEndDate}
              </div>
            </div>
            <div className={styles.formRow}>
              <div>Time:</div>
              <div>
                {formData.startTime} - {formData.endTime}
              </div>
            </div>
            <div className={styles.formRow}>
              <div>Event purpose:</div>
              <div>{formData.eventPurpose}</div>
            </div>
            <div className={styles.formRow}>
              <div>Number of guests:</div>
              <div>{formData.numberOfGuests}</div>
            </div>
          </div>
          <button
            className={styles.submit}
            style={{ marginTop: "24px" }}
            onClick={handleReset}
          >
            Submit New Request
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.formContainer}>
      <h1>Ready to Get Started?</h1>
      <p className={styles.subtitle}>
        Discover the perfect workspace or event venue for your needs.
      </p>

      {validationError && (
        <div className={styles.validationError}>{validationError}</div>
      )}

      <form id="eventForm" onSubmit={handleSubmit} autoComplete="on">
        {/* Your Information */}
        <div className={styles.section}>
          <h2>Your Information</h2>
          <div className={styles.row}>
            <LabeledInput
              label="Full name"
              placeholder="John Doe"
              value={formData.fullName}
              onChange={handleChange("fullName")}
              isRequired={true}
            />
            <LabeledInput
              label="Company name"
              placeholder="John SHPK"
              value={formData.companyName}
              onChange={handleChange("companyName")}
              isRequired={true}
            />
          </div>
          <div className={styles.row}>
            <LabeledInput
              label="Email"
              type="email"
              placeholder="John@gmail.com"
              value={formData.email}
              onChange={handleChange("email")}
              isRequired={true}
              regex={/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/}
            />
            <LabeledInput
              label="Phone number"
              placeholder="06XXXXXXXX"
              value={formData.phoneNumber}
              onChange={handleChange("phoneNumber")}
              isRequired={true}
            />
          </div>
        </div>

        {/* Event Information */}
        <div className={styles.section}>
          <h2>Event Information</h2>
          <div className={styles.row}>
            <LabeledInput
              label="Start date"
              type="date"
              value={formData.startDate}
              onChange={handleChange("startDate")}
              isRequired={true}
              min={dayjs().format("YYYY-MM-DD")}
            />
            <LabeledInput
              label="Start time"
              type="time"
              value={formData.startTime}
              onChange={handleChange("startTime")}
              placeholder="13:00"
              isRequired={true}
            />
          </div>
          <div className={styles.row}>
            <LabeledInput
              label="End date"
              type="date"
              value={formData.endDate}
              onChange={handleChange("endDate")}
              isRequired={true}
              min={formData.startDate || dayjs().format("YYYY-MM-DD")}
              disabled={!formData.startDate}
            />
            <LabeledInput
              label="End time"
              type="time"
              value={formData.endTime}
              onChange={handleChange("endTime")}
              placeholder="18:00"
              isRequired={true}
              disabled={!formData.startDate || !formData.endDate}
            />
          </div>
          <div className={styles.row}>
            <LabeledInput
              label="Event name"
              placeholder="Tech Conference"
              value={formData.eventName}
              onChange={handleChange("eventName")}
              isRequired={true}
            />
            <LabeledInput
              label="Event purpose"
              type="select"
              items={eventPurposeOptions}
              selectValue={formData.eventPurpose}
              onChange={handleChange("eventPurpose")}
              isRequired={true}
            />
          </div>
          <div className={styles.row}>
            <LabeledInput
              label="Type of event"
              type="select"
              items={eventTypeOptions}
              selectValue={formData.eventType}
              onChange={handleChange("eventType")}
              isRequired={true}
            />
            <LabeledInput
              label="Number of guests"
              placeholder="26"
              value={formData.numberOfGuests}
              onChange={handleChange("numberOfGuests")}
              isRequired={true}
            />
          </div>
          <div className={styles.formGroup}>
            <LabeledInput
              label="Event description and notes"
              type="textarea"
              placeholder="Add notes"
              value={formData.notes}
              onChange={handleChange("notes")}
            />
          </div>
        </div>

        {/* Buttons */}
        <div className={styles.actions}>
          <button type="button" className={styles.cancel} onClick={handleReset}>
            Cancel
          </button>
          <button type="submit" className={styles.submit}>
            Request a quote
          </button>
        </div>
      </form>
    </div>
  );
}
