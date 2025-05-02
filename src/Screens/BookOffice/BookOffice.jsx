import React, { useEffect, useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup"; // Import Yup
import styles from "./BookOffice.module.css"; // Import the CSS module
import api from "../../util/axiosConfig";
import { useAuth } from "../../context/Auth";
import { transformWorkspacesResponse } from "../../util/transformers";
import { useNavigate } from "react-router-dom";
import info from "../../assets/info.svg";
import infowhite from "../../assets/infowhite.svg";
import { address, label } from "framer-motion/client";
// Get today's date in YYYY-MM-DD format
const today = new Date().toISOString().split("T")[0];

// Define booking periods
const bookingPeriods = [
  { value: "Daily", label: "Daily" },
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
  businessName: Yup.string()
    .required("Business name is required")
    .min(5, "Name must be at least 5 characters"),
  nipt: Yup.string()
    .required("ID number is required")
    .matches(
      /^[A-Z][0-9]{8}[A-Z]$/,
      "NIPT must be in format: A12345678B (letter, 8 digits, letter)"
    ),
  phoneNumber: Yup.string()
    .required("Phone number is required")
    .matches(
      /^(?:\+355|0)(?:6|4|5)[0-9]{8}$/,
      "Phone number must be in the format: +3556XXXXXXXX or 06XXXXXXXX"
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
});

const API_BASE_URL =
  "https://66eujsebp8.execute-api.eu-central-1.amazonaws.com/prod";

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
  } = useFormik({
    initialValues: {
      selectedWorkspace: "",
      period: "",
      selectedDate: "",
      businessName: "",
      nipt: "",
      phoneNumber: "",
      email: "",
      street: "",
      city: "",
      selectedType: "business",
    },
    validationSchema,
    validateOnChange: false,
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

        const userResponse = await api.post(`${API_BASE_URL}/leads`, userData, {
          headers: { Authorization: `${tokenType} ${accessToken}` },
        });
        console.log("🚀 ~ onSubmit: ~ userResponse:", userResponse.data.data);

        const userId = userResponse.data.data;

        const bookingData = {
          username: values.businessName + " " + values.nipt,
          user: userId,
          from: values.selectedDate + `T00:00:00+02:00`,
          to: endDate + `T00:00:00+02:00`,
          room: values.selectedWorkspace[0],
          booking: values.bookingPeriod,
          requestedFrom: "Business",
        };
        console.log("🚀 ~ onSubmit: ~ bookingData:", bookingData);
        await api.post(
          "https://66eujsebp8.execute-api.eu-central-1.amazonaws.com/prod/private",
          bookingData,
          {
            headers: {
              Authorization: `${tokenType} ${accessToken}`,
            },
          }
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
  const { accessToken, tokenType, tokenLoading } = useAuth();

  useEffect(() => {
    fetchDeskNames();
  }, [tokenLoading]);

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
    if (!tokenLoading) {
      try {
        setIsLoading(true);
        const response = await api.get(`${API_BASE_URL}/private`, {
          headers: { Authorization: `${tokenType} ${accessToken}` },
        });
        const transformed = transformWorkspacesResponse(
          response.data.data || []
        );
        setWorkspaces(transformed);

        if (transformed.length > 0) {
          setFieldValue("selectedWorkspace", transformed[3].value);
        }
        setIsLoading(false);
      } catch (error) {
        setIsLoading(false);
        console.log(error);
      }
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
        `${API_BASE_URL}/prices?product=${selectedWorkspace.label}&period=${bookingPeriod}`,
        { headers: { Authorization: `${tokenType} ${accessToken}` } }
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
              min={new Date(Date.now() + 86400000).toISOString().split("T")[0]}
            />
            {errors.selectedDate && touched.selectedDate && (
              <div className={styles.error}>{errors.selectedDate}</div>
            )}
          </div>
          {/* {infoMessage !== "" && (
            <div
              className={
                isAvailable ? styles.infoContainer : styles.infoContainerErr
              }
            >
              <img src={isAvailable ? info : infowhite} alt="" />
              <span>{infoMessage}</span>
            </div>
          )} */}
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
              <input
                type="tel"
                id="phoneNumber"
                name="phoneNumber"
                value={values.phoneNumber}
                onChange={handleChange}
                className={styles.input}
                placeholder="Phone Number"
                autoComplete="phoneNumber"
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
              disabled={isSubmitting || !isAvailable}
            >
              {isSubmitting ? "Creating..." : "Send request"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
