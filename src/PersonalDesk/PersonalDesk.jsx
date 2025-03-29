import React, { useEffect, useState, useCallback, useMemo } from "react";
import styles from "./PersonalDesk.module.css";
import api from "../utility/axiosConfig";
import dayjs from "dayjs";
import { useLocalStorage } from "../hooks/useLocalStorage/useLocalStorage";
import { calculateEndDate, formatDate } from "../utility";
import { Alert } from "@mui/material";
import { useBooking } from "../context/BookingContext";
import Information from "./Information";
import Footer from "./Footer";
import Payment from "./Payment";
import Finished from "./Finished";
import { useAuth } from "../context/Auth";

// Constants
const STEPS = ["Information", "Payment", "Finished"];
const API_BASE_URL =
  "https://nhpvz8wphf.execute-api.eu-central-1.amazonaws.com/prod";
const VALIDATION_PATTERNS = {
  EMAIL: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
  ID_NUMBER: /^[A-Za-z]\d{8}[A-Za-z]$/,
};

export default function PersonalDesk() {
  // State management
  const [price, setPrice] = useState(0);
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [localData, setLocalData] = useLocalStorage("localData", {});
  const [randomSeat, setRandomSeat] = useState("");
  const [info, setInfo] = useState("none");
  const [infoMessage, setInfoMessage] = useState("");
  const [workspaces, setWorkspaces] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedWorkspace, setSelectedWorkspace] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [validCoupon, setValidCoupon] = useState(null);
  const [invoiceId, setInvoiceId] = useState("");
  const [singlePrice, setSinglePrice] = useState(0);
  const [currentPrice, setCurrentPrice] = useState(0);
  const [isPriceFilled, setIsPriceFilled] = useState(false);
  const [userId, setUserId] = useState("");
  const [priceId, setPriceId] = useState("");
  const [isFormValid, setIsFormValid] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [isAvaliable, setIsAvaliable] = useState(false);

  // Context hooks
  const {
    personalDeskUserInfo,
    setPersonalDeskUserInfo,
    period,
    setPeriod,
    handlePersonalDesk,
  } = useBooking();
  const { accessToken, tokenType, tokenLoading } = useAuth();

  // Helper functions
  const transformData = (inputData) => {
    if (!Array.isArray(inputData)) {
      console.warn("Input data is not an array:", inputData);
      return [];
    }

    const result = {};

    inputData.forEach((item) => {
      if (!item.Name) {
        console.warn("Item Name is undefined:", item);
        return;
      }

      const nameParts = item.Name.split(" - ");
      const name = nameParts[0];

      if (!result[name]) {
        result[name] = {
          label: name,
          value: [],
        };
      }

      if (nameParts.length > 1 && nameParts[1] === "Multi Pass") {
        result[name].value.unshift(item.id);
      } else {
        result[name].value.push(item.id);
      }
    });

    return Object.values(result);
  };

  const setNotification = (type, message) => {
    setInfo(type);
    setInfoMessage(message);

    // Auto-clear error messages after 5 seconds
    if (type === "error") {
      setTimeout(() => {
        if (infoMessage === message) {
          clearNotification();
        }
      }, 5000);
    }
  };

  const clearNotification = () => {
    setInfo("none");
    setInfoMessage("");
  };

  const resetForm = () => {
    setPersonalDeskUserInfo({
      selectDate: "",
      firstName: "",
      lastName: "",
      birthday: "",
      idNumber: "",
      email: "",
      totalToPay: 5000,
      workspace: "",
      bookingType: "",
      passDuration: 0,
      endDate: "",
    });

    // Reset all related states
    setCouponCode("");
    setValidCoupon(null);
    setPrice(0);
    setCurrentPrice(0);
    setSinglePrice(0);
    setIsPriceFilled(false);
    clearNotification();
    setErrorMessage("");
    setValidationErrors({});
  };

  // DO NOT MODIFY USEEFFECTS AS PER REQUIREMENTS
  useEffect(() => {
    if (!tokenLoading) {
      const getAllOffices = async () => {
        try {
          setLoading(true);
          const response = await api.get(`${API_BASE_URL}/shared`, {
            headers: { Authorization: `${tokenType} ${accessToken}` },
          });

          // Make sure we're accessing the correct data property
          const allOffices = response.data.data || [];

          const transformed = transformData(allOffices);
          setWorkspaces(transformed);

          // Select the first workspace automatically if available
          if (transformed.length > 0) {
            handlePersonalDesk("workspace", transformed[0].value);
          }

          setLoading(false);
        } catch (error) {
          console.error("Error fetching offices:", error);
          setErrorMessage(
            "Failed to fetch available workspaces. Please try again later."
          );
          setLoading(false);
        }
      };
      getAllOffices();
    }
  }, [tokenLoading]);

  // Validate individual form fields
  const validateField = (fieldName, value) => {
    let errors = { ...validationErrors };

    switch (fieldName) {
      case "firstName":
        if (!value || value.trim() === "") {
          errors.firstName = "First name is required";
        } else {
          delete errors.firstName;
        }
        break;

      case "lastName":
        if (!value || value.trim() === "") {
          errors.lastName = "Last name is required";
        } else {
          delete errors.lastName;
        }
        break;

      case "email":
        if (!value || value.trim() === "") {
          errors.email = "Email is required";
        } else if (!VALIDATION_PATTERNS.EMAIL.test(value)) {
          errors.email = "Please enter a valid email address";
        } else {
          delete errors.email;
        }
        break;

      case "idNumber":
        if (value && !VALIDATION_PATTERNS.ID_NUMBER.test(value)) {
          errors.idNumber = "Please enter a valid ID number";
        } else {
          delete errors.idNumber;
        }
        break;

      case "passDuration":
        if (personalDeskUserInfo.bookingType === "Multi Pass") {
          if (!value || value <= 0) {
            errors.passDuration = "Number of passes must be greater than 0";
          } else {
            delete errors.passDuration;
          }
        } else {
          delete errors.passDuration;
        }
        break;

      case "selectDate":
        if (personalDeskUserInfo.bookingType === "Single Pass") {
          if (!value) {
            errors.selectDate = "Date is required";
          } else {
            delete errors.selectDate;
          }
        } else {
          delete errors.selectDate;
        }
        break;

      default:
        break;
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Enhanced form validation
  useEffect(() => {
    const validateForm = () => {
      // Always validate core fields
      const commonFieldsValid = [
        validateField("firstName", personalDeskUserInfo.firstName),
        validateField("lastName", personalDeskUserInfo.lastName),
        validateField("email", personalDeskUserInfo.email),
        validateField("idNumber", personalDeskUserInfo.idNumber),
      ].every(Boolean);

      // Validate booking type specific fields
      if (personalDeskUserInfo.bookingType === "Multi Pass") {
        const multiPassValid = validateField(
          "passDuration",
          personalDeskUserInfo.passDuration
        );
        return (
          commonFieldsValid &&
          multiPassValid &&
          personalDeskUserInfo.workspace &&
          isPriceFilled
        );
      } else {
        // Single Pass validation
        const singlePassValid = validateField(
          "selectDate",
          personalDeskUserInfo.selectDate
        );
        return (
          commonFieldsValid &&
          singlePassValid &&
          personalDeskUserInfo.workspace &&
          period &&
          price > 0 &&
          isPriceFilled
        );
      }
    };

    setIsFormValid(validateForm());
  }, [personalDeskUserInfo, period, price, isPriceFilled]);

  useEffect(() => {
    if (
      personalDeskUserInfo.workspace &&
      personalDeskUserInfo.workspace.length > 0
    ) {
      getPrice();
    }
  }, [personalDeskUserInfo.workspace]);

  // Handle field changes with validation
  const handleFieldChange = (fieldName, value) => {
    handlePersonalDesk(fieldName, value);
    validateField(fieldName, value);

    // Clear related error notifications when field changes
    if (info === "error") {
      clearNotification();
    }
  };

  // Main functionality callbacks
  const getPrice = useCallback(
    async (periodToUse) => {
      if (
        !personalDeskUserInfo.workspace ||
        personalDeskUserInfo.workspace.length === 0
      ) {
        console.error("No workspace selected");
        return;
      }

      try {
        // Find the selected workspace object by matching the ID
        const _selectedWorkspace = workspaces.find((workspace) =>
          workspace.value.includes(personalDeskUserInfo.workspace[0])
        );

        if (!_selectedWorkspace) {
          console.error("Selected workspace not found");
          return;
        }

        setSelectedWorkspace(_selectedWorkspace);

        const priceResponse = await api.get(
          `${API_BASE_URL}/prices?product=${_selectedWorkspace.label}&period=${
            periodToUse || period
          }`,
          { headers: { Authorization: `${tokenType} ${accessToken}` } }
        );

        if (!priceResponse.data?.data?.length) {
          throw new Error("No pricing information available");
        }

        const unitPrice = priceResponse.data.data[0].Unit_Price;
        const calculatedPrice =
          unitPrice * (personalDeskUserInfo.passDuration || 1);

        setPrice(calculatedPrice);
        setCurrentPrice(calculatedPrice);
        setSinglePrice(unitPrice);
        setIsPriceFilled(true);
        setPriceId(priceResponse.data.data[0].id);

        // Only set info message if we have the required data
        if (personalDeskUserInfo.bookingType === "Multi Pass") {
          if (personalDeskUserInfo.passDuration > 0) {
            setNotification(
              "info",
              `Space is available for ${personalDeskUserInfo.passDuration} passes`
            );
          } else {
            clearNotification();
          }
        } else {
          // For Single Pass, info message is handled by checkOfficeAvaliablity function
          if (!personalDeskUserInfo.selectDate) {
            clearNotification();
          }
        }
      } catch (error) {
        console.error("Error fetching price:", error);
        setNotification("error", "Failed to retrieve pricing information");
        setIsPriceFilled(false);
      }
    },
    [
      personalDeskUserInfo.workspace,
      personalDeskUserInfo.bookingType,
      personalDeskUserInfo.passDuration,
      personalDeskUserInfo.selectDate,
      period,
      accessToken,
      tokenType,
      workspaces,
    ]
  );

  const checkOfficeAvaliablity = async (startDate, periodToUse) => {
    clearNotification();

    try {
      // Check if startDate is valid
      if (!startDate) {
        console.log("No start date provided, only updating price");
        await getPrice(periodToUse);
        return;
      }

      const fromDate = dayjs(startDate);

      // Validate that fromDate is a valid date
      if (!fromDate.isValid()) {
        console.log("Invalid start date:", startDate);
        setNotification("error", "Invalid date selected");
        return;
      }

      // Check that date is not in the past
      if (fromDate.isBefore(dayjs(), "day")) {
        setNotification("error", "Cannot select a date in the past");
        return;
      }

      const toDate = calculateEndDate(fromDate, periodToUse || period);
      const endDate = dayjs(toDate);

      handlePersonalDesk("selectDate", fromDate.format("YYYY-MM-DD"));
      handlePersonalDesk("endDate", endDate.format("YYYY-MM-DD"));

      // Format dates for API call
      const formattedFromDate = formatDate(fromDate);
      const formattedToDate = formatDate(toDate);

      // Validate formatted dates
      if (!formattedFromDate || !formattedToDate) {
        console.error("Failed to format dates properly", { fromDate, toDate });
        setNotification("error", "Error with date formatting");
        return;
      }

      // Validate workspace selection
      if (
        !personalDeskUserInfo.workspace ||
        personalDeskUserInfo.workspace.length < 2
      ) {
        setNotification("error", "Please select a valid workspace first");
        return;
      }

      // First check availability
      const { data: availabilityData } = await api.get(
        `${API_BASE_URL}/shared/${
          personalDeskUserInfo.workspace[1]
        }?from=${encodeURIComponent(formattedFromDate)}&to=${encodeURIComponent(
          formattedToDate
        )}`,
        { type: "Single Pass" },
        { headers: { Authorization: `${tokenType} ${accessToken}` } }
      );

      if (
        !availabilityData.availableSeats ||
        availabilityData.availableSeats.length === 0
      ) {
        setNotification("error", "No available seats for the selected dates");
        setIsFormValid(false);
        setLoading(false);
        return;
      }

      setRandomSeat(
        availabilityData.availableSeats[
          Math.floor(Math.random() * availabilityData.availableSeats.length)
        ]
      );

      // Since we have a periodToUse, let's pass it to getPrice to ensure consistent pricing
      if (periodToUse) {
        await getPrice(periodToUse);
      } else {
        // If no periodToUse is provided, just use the current period
        await getPrice(period);
      }

      setNotification(
        "info",
        `Space is available for ${periodToUse || period}`
      );
      setIsAvaliable(true);

      // Validate the date field
      validateField("selectDate", fromDate.format("YYYY-MM-DD"));
    } catch (error) {
      console.error("Error checking availability:", error);
      setNotification(
        "error",
        error.response?.data?.message ||
          "Error checking availability. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const createUser = async () => {
    setLoading(true);
    clearNotification();
    setErrorMessage("");

    // Final validation before form submission
    const requiredFields = {
      firstName: personalDeskUserInfo.firstName,
      lastName: personalDeskUserInfo.lastName,
      email: personalDeskUserInfo.email,
    };

    // Check for empty required fields
    const emptyFields = Object.entries(requiredFields)
      .filter(([_, value]) => !value || value.trim() === "")
      .map(([key]) => key);

    if (emptyFields.length > 0) {
      const fieldNames = emptyFields.map((field) => {
        // Convert camelCase to user-friendly format
        return field
          .replace(/([A-Z])/g, " $1")
          .replace(/^./, (str) => str.toUpperCase());
      });

      setErrorMessage(
        `Please fill out the following required fields: ${fieldNames.join(
          ", "
        )}`
      );
      setLoading(false);
      return;
    }

    // Email validation
    if (!VALIDATION_PATTERNS.EMAIL.test(personalDeskUserInfo.email)) {
      setErrorMessage("Please enter a valid email address");
      setLoading(false);
      return;
    }

    // ID validation if provided
    if (
      personalDeskUserInfo.idNumber &&
      !VALIDATION_PATTERNS.ID_NUMBER.test(personalDeskUserInfo.idNumber)
    ) {
      setErrorMessage("Please enter a valid ID number");
      setLoading(false);
      return;
    }

    const userData = {
      name: personalDeskUserInfo.firstName,
      lastName: personalDeskUserInfo.lastName,
      email: personalDeskUserInfo.email,
      birthday: personalDeskUserInfo.birthday || "",
      id: personalDeskUserInfo.idNumber || "",
    };

    setLocalData(userData);

    try {
      const {
        data: { data: response },
      } = await api.post(`${API_BASE_URL}/account`, userData, {
        headers: { Authorization: `${tokenType} ${accessToken}` },
      });

      setUserId(response.id);
      handlePersonalDesk("userId", response.id);
      setActiveStep(1);
    } catch (error) {
      console.error("Error creating user:", error);
      const errorMsg =
        error.response?.data?.message ||
        "Failed to create user. Please try again.";
      setErrorMessage(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const bookOffice = async (userId) => {
    if (!userId) {
      setErrorMessage("User ID is required for booking");
      return null;
    }

    // Check if we have all required booking data
    if (
      !personalDeskUserInfo.workspace ||
      !personalDeskUserInfo.bookingType ||
      (personalDeskUserInfo.bookingType === "Multi Pass" &&
        !personalDeskUserInfo.passDuration) ||
      (personalDeskUserInfo.bookingType === "Single Pass" &&
        !personalDeskUserInfo.selectDate)
    ) {
      setErrorMessage("Missing required booking information");
      return null;
    }

    // Check if we have a seat available
    if (personalDeskUserInfo.bookingType === "Single Pass" && !randomSeat) {
      setErrorMessage("No seat available for booking");
      return null;
    }

    const bookingData = {
      username: `${personalDeskUserInfo.firstName} ${personalDeskUserInfo.lastName}`,
      user: userId,
      room:
        personalDeskUserInfo.bookingType === "Multi Pass"
          ? personalDeskUserInfo.workspace[0]
          : personalDeskUserInfo.workspace[1],
      from: personalDeskUserInfo.selectDate,
      to: personalDeskUserInfo.endDate,
      seat: randomSeat.toString(),
      referral: "Shared Office Form",
      booked: period,
      discount: validCoupon ? validCoupon : 0,
      type: personalDeskUserInfo.bookingType,
      duration: personalDeskUserInfo.passDuration,
    };

    try {
      setLoading(true);
      const bookingResponse = await api.post(
        `${API_BASE_URL}/shared`,
        bookingData,
        { headers: { Authorization: `${tokenType} ${accessToken}` } }
      );

      if (!bookingResponse.data?.invoiceId) {
        throw new Error("Failed to generate invoice for booking");
      }

      console.log("bookingResponse", bookingResponse.data);
      setInvoiceId(bookingResponse.data.invoiceId);
      return bookingResponse;
    } catch (error) {
      console.error("Error booking office:", error);
      const errorMsg =
        error.response?.data?.message ||
        "Failed to book office. Please try again.";
      setErrorMessage(errorMsg);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Event handlers
  const handleNext = () => {
    if (isFormValid) {
      createUser();
    } else {
      // Show validation summary if form is invalid
      const errorsList = Object.values(validationErrors);
      if (errorsList.length > 0) {
        setErrorMessage(errorsList[0]); // Show the first error
      } else {
        setErrorMessage(
          "Please complete all required fields before continuing"
        );
      }
    }
  };

  const handleBack = () => {
    resetForm();
    setActiveStep(0);
  };

  const handleApplyCoupon = async (code) => {
    if (!code) {
      setNotification("error", "Please enter a coupon code");
      return;
    }

    if (!priceId) {
      setNotification(
        "error",
        "Please select a workspace and time period first"
      );
      return;
    }

    setCouponLoading(true);
    clearNotification();

    try {
      const response = await api.get(
        `${API_BASE_URL}/coupon?coupon=${code}&id=${priceId}&booking=${period}&quantity=1`,
        {
          headers: { Authorization: `${tokenType} ${accessToken}` },
        }
      );

      if (!response.data?.discount) {
        throw new Error("Invalid coupon code");
      }

      setValidCoupon(response.data.discount);
      setPrice(response.data.value);
      setNotification("info", "Coupon applied successfully!");
    } catch (error) {
      console.error("Error applying coupon:", error);
      setValidCoupon(null);
      setNotification(
        "error",
        error.response?.data?.message || "Invalid coupon code"
      );
    } finally {
      setCouponLoading(false);
    }
  };

  const removeCoupon = () => {
    setValidCoupon(null);
    setCouponCode("");
    clearNotification();
    setPrice(currentPrice);
  };

  const finishPayment = () => {
    setActiveStep(2);
  };

  // Memoized props for child components to prevent unnecessary re-renders
  const informationProps = useMemo(
    () => ({
      loading,
      setIsLoading: setLoading,
      checkOffice: checkOfficeAvaliablity,
      workspaces,
      info,
      infoMessage,
      getPrice,
      setIsFormValid,
      setIsPriceFilled,
      onFieldChange: handleFieldChange,
      validationErrors,
    }),
    [
      loading,
      workspaces,
      info,
      infoMessage,
      checkOfficeAvaliablity,
      getPrice,
      validationErrors,
    ]
  );

  const paymentProps = useMemo(
    () => ({
      loading,
      setIsLoading: setLoading,
      validCoupon,
      selectedWorkspace,
      price,
      invoiceId,
      personalDeskUserInfo,
      singlePrice,
      currentPrice,
      couponCode,
      setCouponCode,
      couponLoading,
      onApplyCoupon: handleApplyCoupon,
      onRemoveCoupon: removeCoupon,
      finishPayment,
      period,
      userId,
      bookOffice,
      onPreviousStep: () => setActiveStep(0),
      setInvoiceId: (id) => {
        console.log("Setting invoice ID in parent:", id);
        setInvoiceId(id);
      },
    }),
    [
      loading,
      validCoupon,
      selectedWorkspace,
      price,
      invoiceId,
      personalDeskUserInfo,
      singlePrice,
      currentPrice,
      couponCode,
      couponLoading,
      period,
      userId,
    ]
  );

  // Component rendering based on active step
  const stepComponents = {
    0: <Information {...informationProps} />,
    1: <Payment {...paymentProps} />,
    2: (
      <Finished
        loading={loading}
        selectedWorkspace={selectedWorkspace}
        price={price}
      />
    ),
  };

  return (
    <div className={styles.formContainer}>
      <div className={styles.formBody}>
        <div className={styles.stepContent}>
          {stepComponents[activeStep] || stepComponents[0]}
        </div>
      </div>

      {errorMessage && (
        <Alert
          severity="error"
          onClose={() => setErrorMessage("")}
          style={{ marginBottom: 10 }}
        >
          {errorMessage}
        </Alert>
      )}
      {!loading && activeStep === 0 && (
        <Footer
          price={price}
          handleNext={handleNext}
          handleBack={handleBack}
          isBackDisabled={activeStep === 0}
          isNextDisabled={!isFormValid || !isAvaliable}
          isLast={activeStep === 2}
        />
      )}
    </div>
  );
}
