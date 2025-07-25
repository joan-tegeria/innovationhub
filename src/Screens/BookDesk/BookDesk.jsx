import React, { useEffect, useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup"; // Import Yup
import FormControlLabel from "@mui/material/FormControlLabel";
import { API_BASE_URL } from "../../util/api"; // Import the API base URL
import api from "../../util/axiosConfig";
import { transformWorkspacesResponse } from "../../util/transformers";
import { useNavigate, useParams } from "react-router-dom";
import info from "../../assets/info.svg";
import infowhite from "../../assets/infowhite.svg";
import RestartBookingModal from "../BookModal/RestartBookingModal";

function getDaysBetween(startDate, endDate) {
  // Convert to Date objects if they're strings
  const start = new Date(startDate);
  const end = new Date(endDate);

  // Calculate the time difference in milliseconds
  const timeDiff = end.getTime() - start.getTime();

  // Convert milliseconds to days (1000ms * 60s * 60m * 24h)
  const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

  return daysDiff;
}

import styles from "./BookDesk.module.css";
import { duration } from "@mui/material";
import flags from "react-phone-number-input/flags";
import "react-phone-number-input/style.css";
import PhoneInput from "react-phone-number-input";
// Get today's date in YYYY-MM-DD format
const today = new Date().toISOString().split("T")[0];

// Define booking periods
const bookingPeriods = [
  { value: "Daily", label: "Daily" },
  { value: "Weekly", label: "Weekly" },
  { value: "Monthly", label: "Monthly" },
  { value: "Annually", label: "Annually" },
  { value: "Custom", label: "Custom" },
];

// Yup schema with validation for date
const validationSchema = Yup.object({
  // selectedWorkspace: Yup.string().required("Workspace is required"),
  bookingPeriod: Yup.string().required("Booking period is required"),
  selectedDate: Yup.date()
    .required("Start date is required")
    .min(today, "Start date must be today or later"),
  endDate: Yup.date().when("bookingPeriod", {
    is: "Custom",
    then: (schema) =>
      schema
        .required("End date is required for custom booking")
        .min(Yup.ref("selectedDate"), "End date must be after start date"),
    otherwise: (schema) => schema.nullable(),
  }),
  fullName: Yup.string()
    .required("Full name is required")
    .matches(/^(\w+)\s(\w+.*)$/, "Please enter both first and last names")
    .min(2, "Full name must be at least 2 characters"),
  // birthday: Yup.date()
  //   .required("Birthday is required")
  //   .max(new Date(), "Birthday cannot be in the future")
  //   .test(
  //     "is-at-least-18",
  //     "You must be at least 18 years old",
  //     function (value) {
  //       if (!value) return false;
  //       // Calculate age
  //       const today = new Date();
  //       const birthDate = new Date(value);
  //       let age = today.getFullYear() - birthDate.getFullYear();
  //       const monthDiff = today.getMonth() - birthDate.getMonth();

  //       // Adjust age if birthday hasn't occurred yet this year
  //       if (
  //         monthDiff < 0 ||
  //         (monthDiff === 0 && today.getDate() < birthDate.getDate())
  //       ) {
  //         age--;
  //       }

  //       return age >= 18;
  //     }
  //   ),
  idNumber: Yup.string().when("selectedAccountType", {
    is: "Individual",
    then: (schema) =>
      schema
        .required("ID number is required")
        .matches(
          /^[A-Z][0-9]{8}[A-Z]$/,
          "ID must be in format: A12345678B (letter, 8 digits, letter)"
        ),
    otherwise: (schema) =>
      schema
        .required("NIPT is required")
        .matches(
          /^[A-Za-z][0-9]{8}[A-Za-z]$/,
          "NIPT must be in format: L12345678M"
        ),
  }),
  phoneNumber: Yup.string()
    .required("Phone number is required")
    .matches(
      /^(?:\+355|0)(?:6|4|5)[0-9]{8}$/,
      "The phone number format is incorrect"
    ),
  email: Yup.string()
    .required("Email is required")
    .email("Invalid email address")
    .matches(
      /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
      "Email must have a valid domain (e.g., .com, .net, etc.)"
    ),
  city: Yup.string().required("City is required"),
  street: Yup.string().required("Address is required"),
  privacyPolicy: Yup.boolean()
    .oneOf([true], "You must accept the privacy policy to continue.")
    .required("You must accept the privacy policy to continue."),
});

// Using API_BASE_URL from util/api.js
const accountTypes = [
  {
    value: "Individual",
    label: "Individual",
  },
  {
    value: "Business",
    label: "Business",
  },
];

export default function BookDesk() {
  const [workspaces, setWorkspaces] = useState([]);
  const [isAvailable, setIsAvailable] = useState(true);
  const [randomSeat, setRandomSeat] = useState(null);
  const [price, setPrice] = useState(0);
  const [priceId, setPriceId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [infoMessage, setInfoMessage] = useState("");
  const navigate = useNavigate();
  const { type } = useParams(); // Get the type parameter from URL
  const [endDate, setEndDate] = useState("");
  const [basePrice, setBasePrice] = useState(price);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const [backendErrorMessage, setBackendErrorMessage] = useState(null);
  const [backendErrorStatus, setBackendErrorStatus] = useState(null);
  const [showErrorModal, setShowErrorModal] = useState(false);

  const {
    values,
    handleChange,
    handleBlur,
    handleSubmit,
    errors,
    touched,
    setFieldValue,
    isValid,
  } = useFormik({
    initialValues: {
      selectedWorkspace: "",
      bookingPeriod: "",
      selectedDate: "",
      endDate: "", // Add endDate to initial values
      fullName: "",
      selectedAccountType: "Individual",
      // birthday: "",
      phoneNumber: "",
      idNumber: "",
      email: "",
      city: "",
      street: "",
      privacyPolicy: false,
    },
    validateOnBlur: true,
    validationSchema,
    validateOnChange: true,
    validateOnBlur: true,
    onSubmit: async (values) => {
      setIsSubmitting(true);
      try {
        setBackendErrorMessage(null);
        setBackendErrorStatus(null);

        // Use the correct end date based on booking period
        const finalEndDate =
          values.bookingPeriod === "Custom" ? values.endDate : endDate;
        const durationindats = getDaysBetween(
          values.selectedDate,
          finalEndDate
        );
        // if (values.bookingPeriod === "Custom") {
        //   setPrice((prev) => prev * durationindats);
        // }

        console.log("🚀 ~ onSubmit: ~ durationindats:", durationindats);

        // Create combined data object for a single API call
        const nameParts = values.fullName.split(" ");
        const firstName = nameParts[0];
        const lastName = nameParts.slice(1).join(" ");
        ``;
        const combinedData = {
          room: values.selectedWorkspace[0],
          from: values.selectedDate,
          to: finalEndDate,
          seat: randomSeat.toString(),
          booked: values.bookingPeriod,
          type:
            values.bookingPeriod === "Multi Pass"
              ? "Multi Pass"
              : "Single Pass",
          name: firstName,
          lastName: lastName,
          email: values.email,
          // birthday: values.birthday || "",
          id: values.selectedAccountType === "Business" ? "" : values.idNumber,
          nipt:
            values.selectedAccountType === "Individual" ? "" : values.idNumber,
          phone: values.phoneNumber,
          city: values.city,
          street: values.street,
          duration:
            values.bookingPeriod.toLowerCase() === "custom"
              ? durationindats
              : 1,
        };

        // // Make a single API call
        const bookingResponse = await api.post(
          `${API_BASE_URL}/shared`,
          combinedData
        );

        console.log("Booking response received:", bookingResponse.data);

        // Wait to ensure all state updates have been applied
        const prepareNavigation = async () => {
          // Find selected workspace label
          const selectedWorkspaceLabel =
            workspaces.find((ws) => {
              if (
                Array.isArray(ws.value) &&
                Array.isArray(values.selectedWorkspace)
              ) {
                return ws.value.some((val) =>
                  values.selectedWorkspace.includes(val)
                );
              }
              return false;
            })?.label ||
            workspaces.find(
              (ws) => String(ws.value) === String(values.selectedWorkspace)
            )?.label ||
            "Unknown Workspace";

          // Store all the data we'll need in local variables to avoid state timing issues
          const navigationData = {
            userId: bookingResponse.data?.contact,
            workspaceId: values.selectedWorkspace,
            priceId,
            startDate: values.selectedDate,
            period: values.bookingPeriod,
            seatId: randomSeat,
            price,
            userEmail: values.email,
            userName: values.fullName,
            endDate: finalEndDate,
            workspaceLabel: selectedWorkspaceLabel,
            bookingId: bookingResponse.data?.bookingId,
          };

          console.log("Booking response", bookingResponse);

          console.log("Navigation data", navigationData);

          // Validate all fields have values
          const missingFields = Object.entries(navigationData)
            .filter(
              ([_, value]) =>
                value === undefined ||
                value === null ||
                value === "" ||
                (Array.isArray(value) && value.length === 0)
            )
            .map(([key]) => key);

          if (values.bookingPeriod !== "Annually" && missingFields.length > 0) {
            console.error(
              "Missing required fields for navigation:",
              missingFields
            );
            setBackendErrorMessage(
              `We're sorry for any inconvenience, but in order to proceed, you'll need to restart your booking from the beginning.`
            );
            setBackendErrorStatus("error");
            setShowErrorModal(true);
            return;
          }

          // Create a copy to ensure we don't have reference issues
          const navigationState = JSON.parse(JSON.stringify(navigationData));

          // Add a small delay to ensure all state updates are processed
          // This helps with iOS issues where state updates might not be immediately reflected
          setTimeout(() => {
            if (values.bookingPeriod !== "Annually") {
              navigate(`/booking/payment`, { state: navigationState });
            } else {
              navigate(`/booking-success`, {
                state: {
                  type: "private",
                },
              });
            }
          }, 300);
        };

        // Call the navigation preparation function
        await prepareNavigation();
      } catch (error) {
        console.error("Error during user creation or booking:", error);
        console.log(error);
        // Error handling
        if (error.response && error.response.status === 400) {
          // Set backend error message and status from response
          const backendMessage =
            error.response.data.message || "Unknown backend error";
          const backendStatus = error.response.data.status || "error";

          setBackendErrorMessage(backendMessage);
          setBackendErrorStatus(backendStatus);

          // Show error modal based on backend response
          setShowErrorModal(true);
        } else {
          // Default error handling for other types of errors
          setErrorMessage("Failed to process booking and payment");
        }
      } finally {
        setIsSubmitting(false);
      }
    },
  });
  console.log("🚀 ~ prepareNavigation ~ price:", price);

  useEffect(() => {
    console.log("Values", values);
  }, [values]);

  useEffect(() => {
    // setFieldValue(
    //   "selectedDate",
    //   new Date(Date.now()).toISOString().split("T")[0]
    // );
    setFieldValue("bookingPeriod", "Daily");
    checkOfficeAvailability(
      new Date(Date.now() + 86400000).toISOString().split("T")[0],
      "Daily"
    );
    // setFieldValue(
    //   "birthday",
    //   new Date(new Date().setFullYear(new Date().getFullYear() - 18))
    //     .toISOString()
    //     .split("T")[0]
    // );
  }, []);

  const handleWorkspaceSelect = (workspaceId) => {
    setFieldValue("selectedWorkspace", workspaceId);
  };

  const handleAccountTypeSelect = (accountType) => {
    setFieldValue("selectedAccountType", accountType);
  };

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      console.log(type);
      try {
        setIsLoading(true);
        const response = await api.get(`${API_BASE_URL}/shared`);
        const transformed = transformWorkspacesResponse(
          response.data.data || []
        );
        setWorkspaces(transformed);

        if (type.toLowerCase() === "dedicated") {
          setSelectedIndex(1);
          setFieldValue("selectedWorkspace", transformed[1].value);
        } else if (type.toLowerCase() === "flexible") {
          setSelectedIndex(0);
          setFieldValue("selectedWorkspace", transformed[0].value);
        }
        setIsLoading(false);
      } catch (error) {
        setInfoMessage(
          "This space isn't available on your selected dates. Please choose a different start date."
        );
        setIsAvailable(false);
        setIsLoading(false);
        console.log(error);
      }
    };

    fetchData();
  }, [true]);

  useEffect(() => {
    console.log("🔄 Availability check triggered by:", {
      selectedDate: values.selectedDate,
      bookingPeriod: values.bookingPeriod,
      selectedWorkspace: values.selectedWorkspace,
      endDate: values.endDate,
    });

    if (
      values.selectedDate &&
      values.bookingPeriod &&
      values.selectedWorkspace
    ) {
      // For custom booking period, also check if endDate is available
      if (values.bookingPeriod === "Custom" && !values.endDate) {
        console.log("⏸️ Waiting for endDate in custom booking");
        return; // Don't check availability until both dates are selected
      }
      checkOfficeAvailability(values.selectedDate, values.bookingPeriod);
    }
  }, [
    values.selectedDate,
    values.bookingPeriod,
    values.selectedWorkspace,
    values.endDate,
  ]);

  useEffect(() => {
    endDateCalculator();
  }, [values.selectedDate, values.bookingPeriod]);

  useEffect(() => {
    calculatePrice();
  }, [values.selectedDate, values.bookingPeriod, values.endDate]);

  const calculatePrice = () => {
    const duration = getDaysBetween(values.selectedDate, values.endDate);
    if (
      values.selectedDate &&
      values.endDate &&
      values.bookingPeriod === "Custom" &&
      duration > 1
    ) {
      setPrice(basePrice * duration);
    } else return;
  };

  const endDateCalculator = () => {
    const fromDate = new Date(values.selectedDate);
    if (isNaN(fromDate)) {
      console.warn("Invalid fromDate", values.selectedDate);
      return;
    }

    let endDate = new Date(fromDate); // create a copy

    switch (values.bookingPeriod) {
      case "Daily":
        endDate.setDate(fromDate.getDate() + 1);
        break;
      case "Weekly":
        endDate.setDate(fromDate.getDate() + 6);
        break;
      case "Monthly":
        endDate.setMonth(fromDate.getMonth() + 1);
        break;
      case "Annually":
        endDate.setFullYear(fromDate.getFullYear() + 1);
        break;
      case "Custom":
        if (!values.endDate) return; // Don't overwrite the custom endDate
        return;
      default:
        endDate.setDate(fromDate.getDate() + 1);
    }

    // Only set if endDate is valid
    if (!isNaN(endDate)) {
      setFieldValue("endDate", endDate.toISOString().split("T")[0]);
    } else {
      console.warn("Invalid endDate generated");
    }
  };

  const checkOfficeAvailability = async (startDate, bookingPeriod) => {
    console.log("🔍 Checking availability for:", {
      startDate,
      bookingPeriod,
      workspace: values.selectedWorkspace,
    });
    try {
      setCheckingAvailability(true);
      const fromDate = new Date(startDate);
      let toDate;

      // Calculate end date based on booking period
      switch (bookingPeriod) {
        case "Daily":
          toDate = new Date(fromDate);
          toDate.setDate(fromDate.getDate());
          break;
        case "Weekly":
          toDate = new Date(fromDate);
          toDate.setDate(fromDate.getDate() + 6);
          break;
        case "Monthly":
          toDate = new Date(fromDate);
          toDate.setMonth(fromDate.getMonth() + 1);
          break;
        case "Annually":
          toDate = new Date(fromDate);
          toDate.setFullYear(fromDate.getFullYear() + 1);
          break;
        case "Custom":
          // Use the endDate from form values
          if (!values.endDate) {
            return; // Don't check availability if endDate is not set
          }
          toDate = new Date(values.endDate);
          break;
        default:
          toDate = new Date(fromDate);
          toDate.setDate(fromDate.getDate() + 1);
      }

      const formattedFromDate = fromDate.toISOString().split("T")[0];
      const formattedToDate = toDate.toISOString().split("T")[0];

      if (values.selectedWorkspace && values.selectedWorkspace[0]) {
        setEndDate(toDate.toISOString().split("T")[0]);
        const response = await api.get(
          `${API_BASE_URL}/shared/${
            values.selectedWorkspace[0]
          }?from=${encodeURIComponent(
            formattedFromDate
          )}&to=${encodeURIComponent(formattedToDate)}`
        );

        if (
          response.data.availableSeats &&
          response.data.availableSeats.length > 0
        ) {
          console.log(
            "✅ Space is available, seats:",
            response.data.availableSeats.length
          );
          setInfoMessage("The access to the space is available");
          setIsAvailable(true);
          setRandomSeat(
            response.data.availableSeats[
              Math.floor(Math.random() * response.data.availableSeats.length)
            ]
          );
        } else {
          console.log("❌ Space is not available");
          setInfoMessage("The access to the space is not available");
          setIsAvailable(false);
          setRandomSeat(null);
        }

        return response.data.availableSeats?.length > 0;
      } else {
        // Reset availability state when no workspace is selected
        setInfoMessage("");
        setIsAvailable(true);
        setRandomSeat(null);
        return true;
      }
    } catch (error) {
      console.error("Error checking availability:", error);
      setInfoMessage("Error checking availability. Please try again.");
      setIsAvailable(false);
      setRandomSeat(null);
      return false;
    } finally {
      setCheckingAvailability(false);
    }
  };

  const getPrice = async (bookingPeriod) => {
    try {
      // Find the selected workspace object
      const selectedWorkspace = workspaces.find(
        (workspace) => workspace.value === values.selectedWorkspace
      );

      if (!selectedWorkspace) {
        console.error("Selected workspace not found");
        return;
      }

      const priceResponse = await api.get(
        `${API_BASE_URL}/prices?product=${selectedWorkspace.label}&period=${bookingPeriod}`
      );

      if (priceResponse.data?.data?.length) {
        const unitPrice = priceResponse.data.data[0].Unit_Price;
        setPrice(unitPrice);
        setBasePrice(unitPrice);
        setPriceId(priceResponse.data.data[0].id);
        return unitPrice;
      }

      return null;
    } catch (error) {
      console.error("Error fetching price:", error);
      return null;
    }
  };

  // Add an effect to fetch price when booking period changes
  useEffect(() => {
    if (values.bookingPeriod && values.selectedWorkspace) {
      getPrice(values.bookingPeriod);
    }
  }, [values.bookingPeriod, values.selectedWorkspace]);

  useEffect(() => {
    console.log("Button State:", {
      isSubmitting,
      isAvailable,
      isValid,
      errors,
    });
  }, [isSubmitting, isAvailable, isValid, errors]);

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
      </div>
    );
  }

  const handleResetFields = () => {
    setFieldValue("selectedDate", "");
    setFieldValue("endDate", "");
    setFieldValue("bookingPeriod", "Daily");
    setShowErrorModal(false);
  };

  return (
    <div className={styles.background}>
      <div className={styles.container}>
        <h1 className={styles.title}>Ready to Get Started?</h1>
        {isLoading ? (
          <div className={styles.loadingContainer}>
            <div className={styles.spinner}></div>
          </div>
        ) : (
          <>
            <div className={styles.titleDivider} />
            <form
              onSubmit={handleSubmit}
              className={styles.form}
              autoComplete="on"
            >
              {/* <div className={styles.divider} /> */}
              <h1 className={styles.subHeading}>Space Information</h1>

              <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                <label className={styles.label}>Select desk type:</label>
                <div className={styles.workspaceButtons}>
                  {workspaces.map((workspace) => (
                    <button
                      key={workspace.value}
                      type="button"
                      className={`${styles.workspaceButton} ${
                        values.selectedWorkspace === workspace.value
                          ? styles.workspaceButtonActive
                          : ""
                      }`}
                      onClick={() => handleWorkspaceSelect(workspace.value)}
                    >
                      {workspace.label}
                    </button>
                  ))}
                </div>
                {errors.selectedWorkspace && touched.selectedWorkspace && (
                  <div className={styles.error}>{errors.selectedWorkspace}</div>
                )}
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="bookingPeriod" className={styles.label}>
                  Booking Period
                </label>
                <select
                  id="bookingPeriod"
                  name="bookingPeriod"
                  value={values.bookingPeriod}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={styles.select}
                >
                  {bookingPeriods.map((period) => (
                    <option key={period.value} value={period.value}>
                      {period.label}
                    </option>
                  ))}
                </select>
                {errors.bookingPeriod && touched.bookingPeriod && (
                  <div className={styles.error}>{errors.bookingPeriod}</div>
                )}
              </div>

              <div className={styles.formSection}>
                <div className={styles.formGroup}>
                  <label htmlFor="selectedDate" className={styles.label}>
                    Start Date
                  </label>
                  <input
                    type="date"
                    id="selectedDate"
                    name="selectedDate"
                    value={values.selectedDate}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={styles.input}
                    autoComplete="off"
                    min={new Date(Date.now()).toISOString().split("T")[0]}
                  />
                  {errors.selectedDate && touched.selectedDate && (
                    <div className={styles.error}>{errors.selectedDate}</div>
                  )}
                </div>

                {/* Show end date field only for Custom booking period */}
                {/* {values.bookingPeriod === "Custom" && ( */}
                <div className={styles.formGroup}>
                  <label htmlFor="endDate" className={styles.label}>
                    End Date
                  </label>
                  <input
                    type="date"
                    id="endDate"
                    name="endDate"
                    value={values.endDate}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={styles.input}
                    disabled={values.bookingPeriod !== "Custom"}
                    autoComplete="off"
                    min={
                      values.selectedDate ||
                      new Date(Date.now()).toISOString().split("T")[0]
                    }
                    max={
                      values.selectedDate
                        ? new Date(
                            new Date(values.selectedDate).getTime() +
                              31 * 24 * 60 * 60 * 1000
                          )
                            .toISOString()
                            .split("T")[0]
                        : ""
                    }
                  />
                  {errors.endDate && touched.endDate && (
                    <div className={styles.error}>{errors.endDate}</div>
                  )}
                </div>
                {/* )} */}
              </div>
              {isLoading ? (
                <p>isLoading</p>
              ) : checkingAvailability ? (
                <div className={styles.infoContainer}>
                  <span>Checking availability...</span>
                </div>
              ) : (
                infoMessage !== "" &&
                values.selectedDate &&
                (values.bookingPeriod !== "Custom" || values.endDate) && (
                  <div
                    className={
                      isAvailable
                        ? styles.infoContainer
                        : styles.infoContainerErr
                    }
                  >
                    <img src={isAvailable ? info : infowhite} alt="" />
                    <span>{infoMessage}</span>
                  </div>
                )
              )}
              <div className={styles.divider} />
              <h1 className={styles.subHeading}>Personal Information</h1>

              <div
                className={styles.workspaceButtons}
                style={{ width: "100%" }}
              >
                {accountTypes.map((accountType) => (
                  <button
                    key={accountType.value}
                    type="button"
                    className={`${styles.workspaceButton} ${
                      values.selectedAccountType === accountType.value
                        ? styles.workspaceButtonActive
                        : ""
                    }`}
                    onClick={() => handleAccountTypeSelect(accountType.value)}
                  >
                    {accountType.label}
                  </button>
                ))}
              </div>

              <div className={styles.formSection}>
                <div className={styles.formGroup}>
                  <label htmlFor="fullName" className={styles.label}>
                    {values.selectedAccountType === "Individual"
                      ? "Full Name"
                      : "Business Name"}
                  </label>
                  <input
                    type="text"
                    id="fullName"
                    name="fullName"
                    placeholder="Full Name"
                    value={values.fullName}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={styles.input}
                    autoComplete="name"
                  />
                  {errors.fullName && touched.fullName && (
                    <div className={styles.error}>{errors.fullName}</div>
                  )}
                </div>

                {/* <div className={styles.formGroup}>
                  <label htmlFor="birthday" className={styles.label}>
                    Birthday
                  </label>
                  <input
                    type="date"
                    id="birthday"
                    name="birthday"
                    value={values.birthday || ""}
                    onChange={handleChange}
                    className={styles.input}
                    placeholder="YYYY-MM-DD"
                    autoComplete="bday"
                    max={
                      new Date(
                        new Date().setFullYear(new Date().getFullYear() - 18)
                      )
                        .toISOString()
                        .split("T")[0]
                    }
                  />
                  {errors.birthday && touched.birthday && (
                    <div className={styles.error}>{errors.birthday}</div>
                  )}
                </div> */}

                <div className={styles.formGroup}>
                  <label htmlFor="phoneNumber" className={styles.label}>
                    Phone Number
                  </label>
                  <PhoneInput
                    flags={flags}
                    id="phoneNumber"
                    name="phoneNumber"
                    placeholder="Enter phone number"
                    value={values.phoneNumber}
                    onChange={(value) => setFieldValue("phoneNumber", value)}
                    onBlur={handleBlur}
                    defaultCountry="AL"
                    className={styles.phoneInput}
                  />
                  {errors.phoneNumber && touched.phoneNumber && (
                    <div className={styles.error}>{errors.phoneNumber}</div>
                  )}
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="idNumber" className={styles.label}>
                    {values.selectedAccountType === "Individual"
                      ? "ID Number"
                      : "NIPT"}
                  </label>
                  <input
                    type="text"
                    id="idNumber"
                    name="idNumber"
                    value={values.idNumber}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={styles.input}
                    placeholder="A12345678B"
                    autoComplete="off"
                  />
                  {errors.idNumber && touched.idNumber && (
                    <div className={styles.error}>{errors.idNumber}</div>
                  )}
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="email" className={styles.label}>
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={values.email}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={styles.input}
                    autoComplete="email"
                    placeholder="Email Address"
                  />
                  {errors.email && touched.email && (
                    <div className={styles.error}>{errors.email}</div>
                  )}
                </div>
              </div>

              <div className={styles.divider} />
              <h1 className={styles.subHeading}>Address</h1>

              <div className={styles.formSection}>
                <div className={styles.formGroup}>
                  <label htmlFor="city" className={styles.label}>
                    City
                  </label>
                  <input
                    type="text"
                    id="city"
                    name="city"
                    value={values.city}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={styles.input}
                    placeholder="City"
                    autoComplete="address-level2"
                  />
                  {errors.city && touched.city && (
                    <div className={styles.error}>{errors.city}</div>
                  )}
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="street" className={styles.label}>
                    Street
                  </label>
                  <input
                    type="text"
                    id="street"
                    name="street"
                    value={values.street}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={styles.input}
                    placeholder="Street"
                    autoComplete="street-address"
                  />
                  {errors.street && touched.street && (
                    <div className={styles.error}>{errors.street}</div>
                  )}
                </div>
              </div>
              <div className={styles.formGroup}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "0.5rem",
                  }}
                >
                  <input
                    type="checkbox"
                    id="privacyPolicy"
                    name="privacyPolicy"
                    checked={values.privacyPolicy}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    style={{
                      cursor: "pointer",
                      width: "16px",
                      height: "16px",
                      accentColor: "#eb3778",
                    }}
                  />
                  <label
                    htmlFor="privacyPolicy"
                    style={{ margin: 0, fontSize: "0.9rem" }}
                  >
                    I have read and agree to the{" "}
                    <a
                      href="https://hubitat.al/privacy-policy"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ textDecoration: "underline", color: "#eb3778" }}
                    >
                      Privacy Policy
                    </a>{" "}
                    and understand how my data will be used.
                  </label>
                </div>
                {errors.privacyPolicy && touched.privacyPolicy && (
                  <div className={styles.error}>{errors.privacyPolicy}</div>
                )}
              </div>
              <div className={styles.divider} />
              <div className={styles.footer}>
                {values.bookingPeriod !== "Annually" ? (
                  <div className={styles.priceContainer}>
                    <span>Total to pay</span>
                    <span className={styles.price}>
                      {price ? Number(price).toLocaleString() : 0} ALL
                    </span>
                  </div>
                ) : (
                  <div className={styles.priceContainer}></div>
                )}
                <button
                  type="submit"
                  className={styles.submitButton}
                  disabled={
                    isSubmitting ||
                    !isAvailable ||
                    !isValid ||
                    checkingAvailability
                  }
                >
                  {isSubmitting
                    ? "Creating..."
                    : checkingAvailability
                    ? "Checking..."
                    : values.bookingPeriod !== "Annually"
                    ? "Book Now"
                    : "Get a Quote"}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
      {showErrorModal && (
        <RestartBookingModal
          isOpen={showErrorModal}
          onClose={() => setShowErrorModal(false)}
          message={backendErrorMessage}
          status={backendErrorStatus}
          onReset={handleResetFields}
        />
      )}
    </div>
  );
}
