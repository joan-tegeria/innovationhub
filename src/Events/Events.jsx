import React, { useState, useEffect } from "react";
import styles from "./Events.module.css";
import { useNavigate } from "react-router-dom";
// import { useAuth } from "../context/Auth";
import CircularProgress from "@mui/material/CircularProgress";
import { circularProgressClasses } from "@mui/material/CircularProgress";
import api from "../util/axiosConfig";
import dayjs from "dayjs";
import { useFormik } from "formik";
import * as Yup from "yup";
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

// Validation schema
const validationSchema = Yup.object({
  fullName: Yup.string()
    .required("Full name is required")
    .min(2, "Full name must be at least 2 characters"),
  companyName: Yup.string()
    .required("Company name is required")
    .min(2, "Company name must be at least 2 characters"),
  email: Yup.string()
    .email("Invalid email address")
    .required("Email is required")
    .matches(
      /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/,
      "Please enter a valid email"
    ),
  phoneNumber: Yup.string()
    .required("Phone number is required")
    .matches(
      /^(?:\+355|0)(?:6|4|5)[0-9]{8}$/,
      "Phone number must be in the format: +3556XXXXXXXX or 06XXXXXXXX"
    ),
  eventName: Yup.string()
    .required("Event name is required")
    .min(3, "Event name must be at least 3 characters"),
  eventType: Yup.string().required("Event type is required"),
  startDate: Yup.date()
    .required("Start date is required")
    .min(dayjs().format("YYYY-MM-DD"), "Start date must be today or later"),
  startTime: Yup.string().required("Start time is required"),
  endDate: Yup.date()
    .required("End date is required")
    .min(
      Yup.ref("startDate"),
      "End date cannot be earlier than the start date"
    ),
  endTime: Yup.string().required("End time is required"),
  eventPurpose: Yup.string().required("Event purpose is required"),
  numberOfGuests: Yup.number()
    .required("Number of guests is required")
    .positive("Number of guests must be positive")
    .integer("Number of guests must be a whole number"),
  notes: Yup.string().required("Event description is required"),
});

export default function Events() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [customValidationError, setCustomValidationError] = useState("");

  // const { accessToken, tokenType, tokenLoading } = useAuth();
  const navigate = useNavigate();

  const formik = useFormik({
    initialValues: {
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
      eventPurpose: "Select event purpose",
      numberOfGuests: "",
      notes: "",
    },
    validationSchema,
    onSubmit: async (values) => {
      // Custom validation for datetime comparison
      const now = dayjs();
      const startDateTime = dayjs(`${values.startDate}T${values.startTime}`);
      const endDateTime = dayjs(`${values.endDate}T${values.endTime}`);

      // Check if start date/time is in the past
      if (startDateTime.isBefore(now)) {
        setCustomValidationError(
          "Event cannot be scheduled in the past. Please choose a future date and time."
        );
        return;
      }

      // Check if end date/time is before start date/time
      if (endDateTime.isBefore(startDateTime)) {
        setCustomValidationError(
          "End date and time cannot be before start date and time."
        );
        return;
      }

      setCustomValidationError("");
      setLoading(true);

      let [firstName, ...lastNameParts] = values.fullName.trim().split(" ");
      const lastName = lastNameParts.join(" ");

      const userData = {
        name: firstName,
        lastName: lastName + " " + values.companyName,
        email: values.email,
        phone: values.phoneNumber,
        company: values.companyName,
        referral: "Event Form",
      };

      try {
        const { data: userResponse } = await api.post(
          "https://im7v4sdtrl.execute-api.eu-central-1.amazonaws.com/prod/leads",
          userData
        );

        const userId = userResponse.data;

        // Parse dates with explicit timezone
        const startDateTime = dayjs(values.startDate)
          .hour(parseInt(values.startTime.split(":")[0]))
          .minute(parseInt(values.startTime.split(":")[1]))
          .format("YYYY-MM-DDTHH:mm:ss+02:00");

        const endDateTime = dayjs(values.endDate)
          .hour(parseInt(values.endTime.split(":")[0]))
          .minute(parseInt(values.endTime.split(":")[1]))
          .format("YYYY-MM-DDTHH:mm:ss+02:00");

        // Calculate duration in hours
        const startDT = dayjs(values.startDate)
          .hour(parseInt(values.startTime.split(":")[0]))
          .minute(parseInt(values.startTime.split(":")[1]));

        const endDT = dayjs(values.endDate)
          .hour(parseInt(values.endTime.split(":")[0]))
          .minute(parseInt(values.endTime.split(":")[1]));

        const durationHours = endDT.diff(startDT, "hour");
        const eventDuration = durationHours >= 6 ? "Full-Day" : "Half-Day";

        const newEvent = {
          event: values.eventName,
          user: userId,
          from: startDateTime,
          to: endDateTime,
          purpose: values.eventPurpose,
          type: values.eventType,
          noOfGuest: values.numberOfGuests.toString(),
          description: values.notes,
          duration: eventDuration,
        };

        await api.post(
          "https://im7v4sdtrl.execute-api.eu-central-1.amazonaws.com/prod/event",
          newEvent
        );

        // Navigate to booking-success page with type "event" instead of showing success UI
        navigate(`/booking-success`, {
          state: {
            type: "private",
          },
        });
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    },
  });

  const handleReset = () => {
    formik.resetForm();
    setSuccess(false);
    setCustomValidationError("");
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

  return (
    <div className={styles.formContainer}>
      <h1 className={styles.title}>Ready to Get Started?</h1>
      <p className={styles.subtitle}>
        Discover the perfect workspace or event venue for your needs.
      </p>
      <div className={styles.titleDivider} />

      <form id="eventForm" onSubmit={formik.handleSubmit} autoComplete="on">
        {/* Your Information */}
        <div className={styles.section}>
          <h2 style={{ fontSize: "16px", fontWeight: "bold" }}>
            General Information
          </h2>
          <div className={styles.row}>
            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="fullName">
                Full name
              </label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                placeholder="Full name"
                className={styles.input}
                value={formik.values.fullName}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
              />
              {formik.touched.fullName && formik.errors.fullName && (
                <div className={styles.error}>{formik.errors.fullName}</div>
              )}
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="companyName">
                Company name
              </label>
              <input
                id="companyName"
                name="companyName"
                type="text"
                placeholder="Company name"
                className={styles.input}
                value={formik.values.companyName}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
              />
              {formik.touched.companyName && formik.errors.companyName && (
                <div className={styles.error}>{formik.errors.companyName}</div>
              )}
            </div>
          </div>
          <div className={styles.row}>
            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="email">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="Email"
                className={styles.input}
                value={formik.values.email}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
              />
              {formik.touched.email && formik.errors.email && (
                <div className={styles.error}>{formik.errors.email}</div>
              )}
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="phoneNumber">
                Phone number
              </label>
              <input
                id="phoneNumber"
                name="phoneNumber"
                type="text"
                placeholder="Phone number"
                className={styles.input}
                value={formik.values.phoneNumber}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
              />
              {formik.touched.phoneNumber && formik.errors.phoneNumber && (
                <div className={styles.error}>{formik.errors.phoneNumber}</div>
              )}
            </div>
          </div>
        </div>

        {/* Event Information */}
        <div className={styles.titleDivider} />
        <div className={styles.section}>
          <h2 style={{ fontSize: "16px", fontWeight: "bold" }}>
            Event Information
          </h2>
          <div className={styles.row}>
            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="startDate">
                Start date
              </label>
              <input
                id="startDate"
                name="startDate"
                type="date"
                className={styles.input}
                value={formik.values.startDate}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                min={dayjs().format("YYYY-MM-DD")}
              />
              {formik.touched.startDate && formik.errors.startDate && (
                <div className={styles.error}>{formik.errors.startDate}</div>
              )}
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="startTime">
                Start time
              </label>
              <input
                id="startTime"
                name="startTime"
                type="time"
                placeholder="13:00"
                className={styles.input}
                value={formik.values.startTime}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
              />
              {formik.touched.startTime && formik.errors.startTime && (
                <div className={styles.error}>{formik.errors.startTime}</div>
              )}
            </div>
          </div>
          <div className={styles.row}>
            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="endDate">
                End date
              </label>
              <input
                id="endDate"
                name="endDate"
                type="date"
                className={styles.input}
                value={formik.values.endDate}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                min={formik.values.startDate || dayjs().format("YYYY-MM-DD")}
                disabled={!formik.values.startDate}
              />
              {formik.touched.endDate && formik.errors.endDate && (
                <div className={styles.error}>{formik.errors.endDate}</div>
              )}
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="endTime">
                End time
              </label>
              <input
                id="endTime"
                name="endTime"
                type="time"
                placeholder="18:00"
                className={styles.input}
                value={formik.values.endTime}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                disabled={!formik.values.startDate || !formik.values.endDate}
              />
              {formik.touched.endTime && formik.errors.endTime && (
                <div className={styles.error}>{formik.errors.endTime}</div>
              )}
            </div>
          </div>
          <div className={styles.row}>
            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="eventName">
                Event name
              </label>
              <input
                id="eventName"
                name="eventName"
                type="text"
                placeholder="Event name"
                className={styles.input}
                value={formik.values.eventName}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
              />
              {formik.touched.eventName && formik.errors.eventName && (
                <div className={styles.error}>{formik.errors.eventName}</div>
              )}
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="eventPurpose">
                Event purpose
              </label>
              <select
                id="eventPurpose"
                name="eventPurpose"
                className={styles.select}
                value={formik.values.eventPurpose}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
              >
                <option value="">Select event purpose</option>
                {eventPurposeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {formik.touched.eventPurpose && formik.errors.eventPurpose && (
                <div className={styles.error}>{formik.errors.eventPurpose}</div>
              )}
            </div>
          </div>
          <div className={styles.row}>
            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="eventType">
                Type of event
              </label>
              <select
                id="eventType"
                name="eventType"
                className={styles.select}
                value={formik.values.eventType}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
              >
                {eventTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {formik.touched.eventType && formik.errors.eventType && (
                <div className={styles.error}>{formik.errors.eventType}</div>
              )}
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="numberOfGuests">
                Number of guests
              </label>
              <input
                id="numberOfGuests"
                name="numberOfGuests"
                type="number"
                placeholder="26"
                className={styles.input}
                value={formik.values.numberOfGuests}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                min="1"
              />
              {formik.touched.numberOfGuests &&
                formik.errors.numberOfGuests && (
                  <div className={styles.error}>
                    {formik.errors.numberOfGuests}
                  </div>
                )}
            </div>
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="notes">
              Event description and notes
            </label>
            <textarea
              id="notes"
              name="notes"
              placeholder="Add notes"
              className={styles.textarea || styles.input}
              value={formik.values.notes}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
            />
            {formik.touched.notes && formik.errors.notes && (
              <div className={styles.error}>{formik.errors.notes}</div>
            )}
          </div>
        </div>
        <div className={styles.titleDivider} />
        {customValidationError && (
          <div className={styles.validationError}>{customValidationError}</div>
        )}
        {/* Buttons */}
        <div className={styles.actions}>
          <button type="button" className={styles.cancel} onClick={handleReset}>
            Clear
          </button>
          <button type="submit" className={styles.submit}>
            Request a quote
          </button>
        </div>
      </form>
    </div>
  );
}
