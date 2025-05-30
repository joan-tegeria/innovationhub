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

import styles from "./BookDesk.module.css";
// Get today's date in YYYY-MM-DD format
const today = new Date().toISOString().split("T")[0];

// Define booking periods
const bookingPeriods = [
  { value: "Daily", label: "Daily" },
  { value: "Weekly", label: "Weekly" },
  { value: "Monthly", label: "Monthly" },
  { value: "Annually", label: "Annually" },
];

// Yup schema with validation for date
const validationSchema = Yup.object({
  // selectedWorkspace: Yup.string().required("Workspace is required"),
  bookingPeriod: Yup.string().required("Booking period is required"),
  selectedDate: Yup.date()
    .required("Date is required")
    .min(today, "Date must be today or later"),
  first_name: Yup.string()
    .required("First name is required")
    .min(2, "First name must be at least 2 characters"),
  last_name: Yup.string()
    .required("Last name is required")
    .min(2, "Last name must be at least 2 characters"),
  birthday: Yup.date()
    .required("Birthday is required")
    .max(new Date(), "Birthday cannot be in the future")
    .test(
      "is-at-least-18",
      "You must be at least 18 years old",
      function (value) {
        if (!value) return false;
        // Calculate age
        const today = new Date();
        const birthDate = new Date(value);
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();

        // Adjust age if birthday hasn't occurred yet this year
        if (
          monthDiff < 0 ||
          (monthDiff === 0 && today.getDate() < birthDate.getDate())
        ) {
          age--;
        }

        return age >= 18;
      }
    ),
  idNumber: Yup.string()
    .required("ID number is required")
    .matches(
      /^[A-Z][0-9]{8}[A-Z]$/,
      "ID must be in format: A12345678B (letter, 8 digits, letter)"
    ),
  email: Yup.string()
    .required("Email is required")
    .email("Invalid email address")
    .matches(
      /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
      "Email must have a valid domain (e.g., .com, .net, etc.)"
    ),
});

// Using API_BASE_URL from util/api.js

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
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const [backendErrorMessage, setBackendErrorMessage] = useState(null);
  const [backendErrorStatus, setBackendErrorStatus] = useState(null);
  const [showErrorModal, setShowErrorModal] = useState(false);

  const {
    values,
    handleChange,
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
      first_name: "",
      last_name: "",
      birthday: "",
      idNumber: "",
      email: "",
    },
    validationSchema,
    validateOnChange: true,
    validateOnBlur: true,
    onSubmit: async (values) => {
      setIsSubmitting(true);
      try {
        setBackendErrorMessage(null);
        setBackendErrorStatus(null);

        // Create combined data object for a single API call
        const combinedData = {
          room: values.selectedWorkspace[0],
          from: values.selectedDate,
          to: endDate,
          seat: randomSeat.toString(),
          booked: values.bookingPeriod,
          type:
            values.bookingPeriod === "Multi Pass"
              ? "Multi Pass"
              : "Single Pass",
          name: values.first_name,
          lastName: values.last_name,
          email: values.email,
          birthday: values.birthday || "",
          id: values.idNumber || "",
        };

        // Make a single API call
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
            userName: `${values.first_name} ${values.last_name}`,
            endDate,
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
  }, [type]);

  useEffect(() => {
    if (
      values.selectedDate &&
      values.bookingPeriod &&
      values.selectedWorkspace
    ) {
      checkOfficeAvailability(values.selectedDate, values.bookingPeriod);
    }
  }, [values.selectedDate, values.bookingPeriod, values.selectedWorkspace]);

  const checkOfficeAvailability = async (startDate, bookingPeriod) => {
    try {
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
        default:
          toDate = new Date(fromDate);
          toDate.setDate(fromDate.getDate() + 1);
      }

      const formattedFromDate = fromDate.toISOString().split("T")[0];
      const formattedToDate = toDate.toISOString().split("T")[0];

      if (values.selectedWorkspace[0]) {
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
          setInfoMessage("The access to the space is avaliable");
          setIsAvailable(true);
          setRandomSeat(
            response.data.availableSeats[
              Math.floor(Math.random() * response.data.availableSeats.length)
            ]
          );
        } else {
          setInfoMessage("The access to the space is not avaliable");
          setIsAvailable(false);
          setRandomSeat(null);
        }

        return response.data.availableSeats?.length > 0;
      }
    } catch (error) {
      console.error("Error checking availability:", error);
      return false;
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

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
      </div>
    );
  }

  const handleResetFields = () => {
    setFieldValue("selectedDate", "");
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
                  className={styles.select}
                >
                  {/* <option value="">Select a booking period</option> */}
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
                  className={styles.input}
                  autoComplete="off"
                  min={new Date(Date.now()).toISOString().split("T")[0]}
                />
                {errors.selectedDate && touched.selectedDate && (
                  <div className={styles.error}>{errors.selectedDate}</div>
                )}
              </div>
              {isLoading ? (
                <p>isLoading</p>
              ) : (
                infoMessage !== "" &&
                values.selectedDate && (
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

              <div className={styles.formSection}>
                <div className={styles.formGroup}>
                  <label htmlFor="first_name" className={styles.label}>
                    First Name
                  </label>
                  <input
                    type="text"
                    id="first_name"
                    name="first_name"
                    value={values.first_name}
                    onChange={handleChange}
                    className={styles.input}
                    autoComplete="given-name"
                    placeholder="First Name"
                  />
                  {errors.first_name && touched.first_name && (
                    <div className={styles.error}>{errors.first_name}</div>
                  )}
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="last_name" className={styles.label}>
                    Last Name
                  </label>
                  <input
                    type="text"
                    id="last_name"
                    name="last_name"
                    value={values.last_name}
                    onChange={handleChange}
                    className={styles.input}
                    autoComplete="family-name"
                    placeholder="Last Name"
                  />
                  {errors.last_name && touched.last_name && (
                    <div className={styles.error}>{errors.last_name}</div>
                  )}
                </div>

                <div className={styles.formGroup}>
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
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="idNumber" className={styles.label}>
                    ID Number
                  </label>
                  <input
                    type="text"
                    id="idNumber"
                    name="idNumber"
                    value={values.idNumber}
                    onChange={handleChange}
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
                  disabled={isSubmitting || !isAvailable}
                >
                  {isSubmitting
                    ? "Creating..."
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
