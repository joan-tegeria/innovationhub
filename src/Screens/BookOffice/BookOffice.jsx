import React, { useEffect, useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup"; // Import Yup
import styles from "./BookOffice.module.css"; // Import the CSS module
import api from "../../util/axiosConfig";
// import { useAuth } from "../../context/Auth";
import { transformWorkspacesResponse } from "../../util/transformers";
import { useNavigate } from "react-router-dom";
import info from "../../assets/info.svg";
import infowhite from "../../assets/infowhite.svg";
import { address, label } from "framer-motion/client";

import flags from "react-phone-number-input/flags";
import "react-phone-number-input/style.css";

import PhoneInput from "react-phone-number-input";
// Get today's date in YYYY-MM-DD format
const today = new Date().toISOString().split("T")[0];
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
// Define booking periods
const bookingPeriods = [
  { value: "Daily", label: "Daily" },
  { value: "Monthly", label: "Monthly" },
  { value: "Annually", label: "Annually" },
  { value: "Custom", label: "Custom" },
];
const getProductName = (name) => {
  switch (name.toLowerCase()) {
    case "the pod":
      return "3 People ";
    case "the solo":
      return "1 Person";
    case "the duo":
      return "2 People";
    case "the suite":
      return "4 People";
  }
};
// Yup schema with validation for date
const validationSchema = Yup.object({
  bookingPeriod: Yup.string().required("Booking period is required"),
  selectedDate: Yup.date()
    .required("Date is required")
    .min(today, "Date must be today or later"),
  endDate: Yup.date().when("bookingPeriod", {
    is: "Custom",
    then: (schema) =>
      schema
        .required("End date is required for custom booking")
        .min(Yup.ref("selectedDate"), "End date must be after start date"),
    otherwise: (schema) => schema.nullable(),
  }),
  businessName: Yup.string()
    .required("Business name is required")
    .min(5, "Name must be at least 5 characters")
    .matches(
      /^[A-Za-z\s]+$/,
      "Business name must contain only letters and spaces"
    ), // ✅ Fixed: Allow spaces and mixed case
  nipt: Yup.string()
    .required("ID number is required")
    .matches(
      /^[A-Za-z][0-9]{8}[A-Za-z]$/, // ✅ Fixed: Allow both upper and lowercase
      "NIPT must be in format: A12345678B (letter, 8 digits, letter)"
    ),
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
  selectedType: Yup.string().required("Type is required"),
  privacyPolicy: Yup.boolean()
    .oneOf([true], "You must accept the privacy policy to continue.")
    .required("You must accept the privacy policy to continue."),
});

const API_BASE_URL =
  "https://acas4w1lnk.execute-api.eu-central-1.amazonaws.com/prod";

const types = [
  { value: "business", label: "Business" },

  { value: "individual", label: "Individual" },
];

export default function BookOffice() {
  const [workspaces, setWorkspaces] = useState([]);
  const [isAvailable, setIsAvailable] = useState(true);
  const [randomSeat, setRandomSeat] = useState(null);
  const [price, setPrice] = useState(0);
  const [priceId, setPriceId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [infoMessage, setInfoMessage] = useState("");
  const [basePrice, setBasePrice] = useState(price);
  const navigate = useNavigate();
  const [endDate, setEndDate] = useState("");
  const {
    values,
    handleChange,
    handleSubmit,
    errors,
    touched,
    setFieldValue,
    isValid,
    setFieldTouched,
  } = useFormik({
    initialValues: {
      selectedWorkspace: "",
      bookingPeriod: "",
      selectedDate: "",
      businessName: "",
      nipt: "",
      phoneNumber: "",
      email: "",
      street: "",
      endDate: "",
      city: "",
      selectedType: "business",
      privacyPolicy: false,
    },
    validationSchema,
    validateOnChange: true,
    validateOnBlur: true,
    onSubmit: async (values) => {
      setIsSubmitting(true);
      try {
        console.log("I am submitting");
        // Create user
        const userData = {
          name: values.selectedType === "business" ? "" : values.businessName,
          lastName: values.businessName,
          email: values.email,
          company: values.businessName,
          referral: "Private Office Form",
          id: values.selectedType === "business" ? "" : values.nipt,
          nipt: values.selectedType === "individual" ? "" : values.nipt,
          phone: values.phoneNumber,
          city: values.city,
          street: values.street,
        };

        const userResponse = await api.post(`${API_BASE_URL}/leads`, userData);
        console.log("🚀 ~ onSubmit: ~ userResponse:", userResponse.data.data);

        const userId = userResponse.data.data;

        const finalEndDate =
          values.bookingPeriod === "Custom" ? values.endDate : endDate;
        const durationindats = getDaysBetween(
          values.selectedDate,
          finalEndDate
        );

        const bookingData = {
          username: values.businessName + " " + values.nipt,
          user: userId,
          from: values.selectedDate + `T00:00:00+02:00`,
          to: endDate + `T00:00:00+02:00`,
          room: values.selectedWorkspace[0],
          booking: values.bookingPeriod,
          requestedFrom: "Business",
          duration:
            values.bookingPeriod.toLowerCase() === "custom"
              ? durationindats
              : 1,
        };
        console.log("🚀 ~ onSubmit: ~ bookingData:", bookingData);
        await api.post(
          "https://acas4w1lnk.execute-api.eu-central-1.amazonaws.com/prod/private",
          bookingData
        );

        const _selectedWorkspace = workspaces.find((workspace) => {
          if (
            Array.isArray(workspace.value) &&
            Array.isArray(values.selectedWorkspace)
          ) {
            return workspace.value.some((val) =>
              values.selectedWorkspace.includes(val)
            );
          }
          return false;
        });

        console.log("🚀 ~ useEffect ~ selected workspace:", _selectedWorkspace);

        if (_selectedWorkspace) {
          console.log("Selected workspace label:", _selectedWorkspace.label);
        }

        // Navigate to payment page with all necessary information as state
        console.log("Find the user id ", userResponse);
        navigate(`/booking-success`, {
          state: {
            type: "private",
          },
        });
      } catch (error) {
        console.error("Error during user creation:", error);
        console.log(error);
        // You might want to show an error message to the user here
      } finally {
        setIsSubmitting(false);
      }
    },
  });

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

  useEffect(() => {
    console.log("Form validation status:");
    console.log("isValid:", isValid);
    console.log("errors:", errors);
    console.log("isAvailable:", isAvailable);
    console.log("isSubmitting:", isSubmitting);
    console.log("values:", values);
  }, [isValid, errors, isAvailable, isSubmitting, values]);

  useEffect(() => {
    setFieldValue(
      "selectedDate",
      new Date(Date.now() + 86400000).toISOString().split("T")[0]
    );
    setFieldValue("bookingPeriod", "Daily");
    // checkOfficeAvailability(
    //   new Date(Date.now() + 86400000).toISOString().split("T")[0],
    //   "Daily"
    // );
  }, []);

  const handleWorkspaceSelect = (workspaceId) => {
    setFieldValue("selectedWorkspace", workspaceId);
  };

  const handleTypeSelect = (type) => {
    setFieldValue("selectedType", type);
  };

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchDeskNames();
  }, []);

  useEffect(() => {
    if (
      values.selectedDate &&
      values.bookingPeriod &&
      values.selectedWorkspace
    ) {
      checkOfficeAvailability(values.selectedDate, values.bookingPeriod);
    }
  }, [values.selectedDate, values.bookingPeriod, values.selectedWorkspace]);

  const fetchDeskNames = async () => {
    try {
      setIsLoading(true);
      const response = await api.get(`${API_BASE_URL}/private`);
      const transformed = transformWorkspacesResponse(response.data.data || []);
      setWorkspaces(transformed);

      if (transformed.length > 0) {
        setFieldValue("selectedWorkspace", transformed[3].value);
      }
      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
      console.log(error);
    }
  };

  const checkOfficeAvailability = async (startDate, bookingPeriod) => {
    try {
      const fromDate = new Date(startDate);
      let toDate;

      // Calculate end date based on booking period
      switch (bookingPeriod) {
        case "Daily":
          toDate = new Date(fromDate);

          // toDate.setDate(fromDate.getDate());
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

      const formattedFromDate =
        fromDate.toISOString().split("T")[0] + `T00:00:00+02:00`;
      const formattedToDate =
        toDate.toISOString().split("T")[0] + `T00:00:00+02:00`;
      setEndDate(toDate.toISOString().split("T")[0]);
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
        setBasePrice(unitPrice);
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

  return (
    <div className={styles.background}>
      <div className={styles.container}>
        <h1 className={styles.title}>Get a Quote</h1>
        <div className={styles.titleDivider} />
        <form onSubmit={handleSubmit} className={styles.form} autoComplete="on">
          {/* <div className={styles.divider} /> */}
          <h1 className={styles.subHeading}>Space Information</h1>

          <div className={`${styles.formGroup} ${styles.fullWidth}`}>
            <label className={styles.label}>
              Select the office you are interested:
            </label>
            <div className={styles.workspaceButtons}>
              {[...workspaces].reverse().map((workspace) => (
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
                  {getProductName(workspace.label)}
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
              <option value="">Select a booking period</option>
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
                Date
              </label>
              <input
                type="date"
                id="selectedDate"
                name="selectedDate"
                value={values.selectedDate}
                onChange={handleChange}
                className={styles.input}
                autoComplete="off"
                min={
                  new Date(Date.now() + 86400000).toISOString().split("T")[0]
                }
              />
              {errors.selectedDate && touched.selectedDate && (
                <div className={styles.error}>{errors.selectedDate}</div>
              )}
            </div>
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
          </div>
          <div className={styles.divider} />
          <h1 className={styles.subHeading}>Personal Information</h1>
          <div className={`${styles.formGroup} ${styles.fullWidth}`}>
            <div className={styles.workspaceButtons}>
              {types.map((_type) => (
                <button
                  key={_type.value}
                  type="button"
                  className={`${styles.workspaceButton} ${
                    values.selectedType === _type.value
                      ? styles.workspaceButtonActive
                      : ""
                  }`}
                  onClick={() => handleTypeSelect(_type.value)}
                >
                  {_type.label}
                </button>
              ))}
            </div>
            {errors.selectedType && touched.selectedType && (
              <div className={styles.error}>{errors.selectedType}</div>
            )}
          </div>
          <div className={styles.formSection}>
            <div className={styles.formGroup}>
              <label htmlFor="businessName" className={styles.label}>
                {values.selectedType === "business"
                  ? "Business Name"
                  : "Full Name"}
              </label>
              <input
                type="text"
                id="businessName"
                name="businessName"
                value={values.businessName}
                onChange={handleChange}
                className={styles.input}
                placeholder={
                  values.selectedType === "business"
                    ? "Business Name"
                    : "Full Name"
                }
                autoComplete="given-name"
              />
              {errors.businessName && touched.businessName && (
                <div className={styles.error}>{errors.businessName}</div>
              )}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="nipt" className={styles.label}>
                {values.selectedType === "business" ? "NIPT" : "ID Number"}
              </label>
              <input
                type="text"
                id="nipt"
                name="nipt"
                value={values.nipt}
                placeholder="A12345678B"
                onChange={handleChange}
                className={styles.input}
                autoComplete="nipt"
              />
              {errors.nipt && touched.nipt && (
                <div className={styles.error}>{errors.nipt}</div>
              )}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="phoneNumber" className={styles.label}>
                Phone Number
              </label>
              <PhoneInput
                id="phoneNumber"
                name="phoneNumber"
                flags={flags}
                defaultCountry="AL"
                placeholder="Enter phone number"
                value={values.phoneNumber}
                onChange={(value) => setFieldValue("phoneNumber", value)}
                onBlur={() => setFieldTouched("phoneNumber", true)}
              />
              {errors.phoneNumber && touched.phoneNumber && (
                <div className={styles.error}>{errors.phoneNumber}</div>
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
                placeholder=" Email Address"
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
              <label htmlFor="street" className={styles.label}>
                Street
              </label>
              <input
                type="text"
                id="street"
                name="street"
                value={values.street}
                onChange={handleChange}
                className={styles.input}
                placeholder="Street"
                autoComplete="street-name"
              />
              {errors.street && touched.street && (
                <div className={styles.error}>{errors.street}</div>
              )}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="City" className={styles.label}>
                City
              </label>
              <input
                type="text"
                id="city"
                name="city"
                value={values.city}
                placeholder="City"
                onChange={handleChange}
                className={styles.input}
                autoComplete="city"
              />
              {errors.city && touched.city && (
                <div className={styles.error}>{errors.city}</div>
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
            <div className={styles.priceContainer}>
              <span>Estimated cost</span>
              <span className={styles.price}>
                {price ? Number(price).toLocaleString() : 0} ALL
              </span>
            </div>
            <button
              type="submit"
              className={styles.submitButton}
              disabled={isSubmitting || !isAvailable || !isValid}
            >
              {isSubmitting ? "Creating..." : "Send request"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
