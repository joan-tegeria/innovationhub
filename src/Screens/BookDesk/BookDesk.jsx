import React, { useEffect, useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup"; // Import Yup
import styles from "./BookDesk.module.css"; // Import the CSS module
import api from "../../util/axiosConfig";
import { useAuth } from "../../context/Auth";
import { transformWorkspacesResponse } from "../../util/transformers";
import { useNavigate } from "react-router-dom";
import info from "../../assets/info.svg";
import infowhite from "../../assets/infowhite.svg";
// Get today's date in YYYY-MM-DD format
const today = new Date().toISOString().split("T")[0];

// Define booking periods
const bookingPeriods = [
  { value: "Daily", label: "Daily" },
  { value: "Weekly", label: "Weekly" },
  { value: "Monthly", label: "Monthly" },
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
    .email("Invalid email address")
    .required("Email is required"),
});

const API_BASE_URL =
  "https://nhpvz8wphf.execute-api.eu-central-1.amazonaws.com/prod";

export default function BookDesk() {
  const [workspaces, setWorkspaces] = useState([]);
  const [isAvailable, setIsAvailable] = useState(false);
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
      bookingPeriod: "",
      selectedDate: "",
      first_name: "",
      last_name: "",
      birthday: "",
      idNumber: "",
      email: "",
    },
    validationSchema,
    validateOnChange: false,
    validateOnBlur: true,
    onSubmit: async (values) => {
      setIsSubmitting(true);
      try {
        // Create user
        const userData = {
          name: values.first_name,
          lastName: values.last_name,
          email: values.email,
          birthday: values.birthday || "",
          id: values.idNumber || "",
        };

        const userResponse = await api.post(
          `${API_BASE_URL}/account`,
          userData,
          {
            headers: { Authorization: `${tokenType} ${accessToken}` },
          }
        );

        // if (!userResponse.data?.data?.id) {
        //   throw new Error("Failed to create user account");
        // }

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
        navigate(`/booking/payment`, {
          state: {
            userId: userResponse.data.data,
            workspaceId: values.selectedWorkspace,
            priceId: priceId,
            startDate: values.selectedDate,
            period: values.bookingPeriod,
            seatId: randomSeat,
            price: price,
            userEmail: values.email,
            userName: `${values.first_name} ${values.last_name}`,
            endDate: endDate,
            workspaceLabel: _selectedWorkspace,
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
        const response = await api.get(`${API_BASE_URL}/shared`, {
          headers: { Authorization: `${tokenType} ${accessToken}` },
        });
        const transformed = transformWorkspacesResponse(
          response.data.data || []
        );
        setWorkspaces(transformed);

        if (transformed.length > 0) {
          setFieldValue("selectedWorkspace", transformed[1].value);
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
          toDate.setDate(fromDate.getDate() + 1);
          break;
        case "Weekly":
          toDate = new Date(fromDate);
          toDate.setDate(fromDate.getDate() + 7);
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
      const response = await api.get(
        `${API_BASE_URL}/shared/${
          values.selectedWorkspace[0]
        }?from=${encodeURIComponent(formattedFromDate)}&to=${encodeURIComponent(
          formattedToDate
        )}`,
        {
          headers: { Authorization: `${tokenType} ${accessToken}` },
        }
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
    <div className={styles.container}>
      <h1 className={styles.title}>Ready to Get Started?</h1>
      <form onSubmit={handleSubmit} className={styles.form} autoComplete="on">
        <div className={styles.divider} />
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
        {infoMessage !== "" && (
          <div
            className={
              isAvailable ? styles.infoContainer : styles.infoContainerErr
            }
          >
            <img src={isAvailable ? info : infowhite} alt="" />
            <span>{infoMessage}</span>
          </div>
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
              value={values.birthday}
              onChange={handleChange}
              className={styles.input}
              autoComplete="bday"
              max={
                new Date(new Date().setFullYear(new Date().getFullYear() - 18))
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
            />
            {errors.email && touched.email && (
              <div className={styles.error}>{errors.email}</div>
            )}
          </div>
        </div>
        <div className={styles.divider} />
        <div className={styles.footer}>
          <div className={styles.priceContainer}>
            <span>Total to pay</span>
            <span className={styles.price}>{price} ALL</span>
          </div>
          <button
            type="submit"
            className={styles.submitButton}
            disabled={isSubmitting || !isAvailable}
          >
            {isSubmitting ? "Creating..." : "Book Now"}
          </button>
        </div>
      </form>
    </div>
  );
}
