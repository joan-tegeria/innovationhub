import React, { useEffect, useState, useCallback } from "react";
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

const STEPS = ["Information", "Payment", "Finished"];
const API_BASE_URL =
  "https://nhpvz8wphf.execute-api.eu-central-1.amazonaws.com/prod";

export default function PersonalDesk() {
  // State management
  const [price, setPrice] = useState(0);
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [localData, setLocalData] = useLocalStorage("localData", {});
  const [randomSeat, setRandomSeat] = useState("");
  const [info, setInfo] = useState("none");
  const [infoMessage, setInfoMessage] = useState("");
  const [workspaces, setWorkspaces] = useState([{ value: "", label: "" }]);
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

  // Context hooks
  const {
    personalDeskUserInfo,
    setPersonalDeskUserInfo,
    period,
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

          // Log the response to see its structure
          console.log("API Response:", response.data);

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
          console.log("Error fetching offices:", error);
          setLoading(false);
        }
      };
      getAllOffices();
    }
  }, [tokenLoading]);

  useEffect(() => {
    const validateForm = () => {
      const commonFields = {
        firstName: personalDeskUserInfo.firstName,
        lastName: personalDeskUserInfo.lastName,
        email: personalDeskUserInfo.email,
        workspace: personalDeskUserInfo.workspace,
        bookingType: personalDeskUserInfo.bookingType,
      };

      // Check if any common field is empty
      const areCommonFieldsValid = Object.values(commonFields).every(
        (field) => field && field !== ""
      );

      // Validate based on booking type
      if (personalDeskUserInfo.bookingType === "Multi Pass") {
        return areCommonFieldsValid && personalDeskUserInfo.passDuration > 0;
      } else {
        // Single Pass validation
        console.log(areCommonFieldsValid);
        console.log(personalDeskUserInfo.selectDate);
        console.log(period);
        console.log(price);
        console.log(isPriceFilled);

        return (
          areCommonFieldsValid &&
          personalDeskUserInfo.selectDate &&
          period &&
          price > 0 &&
          isPriceFilled
        );
      }
    };

    setIsFormValid(validateForm());
  }, [personalDeskUserInfo, period]);

  useEffect(() => {
    getPrice();
    console.log(price);
    console.log(personalDeskUserInfo.workspace);
  }, [personalDeskUserInfo.workspace]);

  // Main functionality callbacks
  const getPrice = useCallback(
    async (periodToUse) => {
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
      console.log(priceResponse.data.data[0].Unit_Price);

      const unitPrice = priceResponse.data.data[0].Unit_Price;
      const calculatedPrice = unitPrice * personalDeskUserInfo.passDuration;

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
          setNotification("none", "");
        }
      } else {
        // For Single Pass, info message is handled by checkOfficeAvaliablity function
        if (!personalDeskUserInfo.selectDate) {
          setNotification("none", "");
        }
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
    } catch (error) {
      console.log("Error checking availability:", error);
      setNotification("error", "Error checking availability");
    }
  };

  const createUser = async () => {
    setLoading(true);

    const userData = {
      name: personalDeskUserInfo.firstName,
      lastName: personalDeskUserInfo.lastName,
      email: personalDeskUserInfo.email,
      birthday: personalDeskUserInfo.birthday,
      id: personalDeskUserInfo.idNumber,
    };

    setLocalData(userData);

    try {
      const {
        data: { data: response },
      } = await api.post(`${API_BASE_URL}/account`, userData, {
        headers: { Authorization: `${tokenType} ${accessToken}` },
      });

      setActiveStep((prevActiveStep) => prevActiveStep + 1);
      setUserId(response.id);
      handlePersonalDesk("userId", response.id);
      setActiveStep(1);
    } catch (error) {
      console.error("Error creating user:", error);
      setErrorMessage("Failed to create user. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const bookOffice = async (userId) => {
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
      console.log("bookingResponse", bookingResponse.data);
      setInvoiceId(bookingResponse.data.invoiceId);
      // window.location.href = bookingResponse.data.paymentSession;
      return bookingResponse;
    } catch (error) {
      console.log("Error booking office:", error);
      setErrorMessage("Failed to book office. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Event handlers
  const handleNext = () => {
    createUser();
  };

  const handleBack = () => {
    setPersonalDeskUserInfo({
      selectDate: "",
      firstName: "",
      lastName: "",
      birthday: "",
      idNumber: "",
      email: "",
      totalToPay: 5000,
    });
    setNotification("none", "");
    setActiveStep(0);
  };

  const handleApplyCoupon = async (code) => {
    if (!code) return;

    setCouponLoading(true);

    try {
      const response = await api.get(
        `${API_BASE_URL}/coupon?coupon=${code}&id=${priceId}&booking=${period}&quantity=1`,
        {
          headers: { Authorization: `${tokenType} ${accessToken}` },
        }
      );

      console.log("Coupon response:", response.data);
      setValidCoupon(response.data.discount);
      setPrice(response.data.value);
      setNotification("info", "Coupon applied successfully!");
    } catch (error) {
      console.error("Error applying coupon:", error);
      setValidCoupon(null);
      setNotification("error", "Invalid coupon code");
    } finally {
      setCouponLoading(false);
    }
  };

  const removeCoupon = () => {
    setValidCoupon(null);
    setCouponCode("");
    setNotification("none", "");
    setPrice(currentPrice);
  };

  const finishPayment = () => {
    console.log("UPDATINGGG ");
    setActiveStep(2);
  };

  // Component rendering based on active step
  const stepComponents = {
    0: (
      <Information
        loading={loading}
        setIsLoading={setLoading}
        checkOffice={checkOfficeAvaliablity}
        workspaces={workspaces}
        info={info}
        infoMessage={infoMessage}
        getPrice={getPrice}
        setIsFormValid={setIsFormValid}
        setIsPriceFilled={setIsPriceFilled}
      />
    ),
    1: (
      <Payment
        loading={loading}
        setIsLoading={setLoading}
        validCoupon={validCoupon}
        selectedWorkspace={selectedWorkspace}
        price={price}
        invoiceId={invoiceId}
        personalDeskUserInfo={personalDeskUserInfo}
        singlePrice={singlePrice}
        currentPrice={currentPrice}
        couponCode={couponCode}
        setCouponCode={setCouponCode}
        couponLoading={couponLoading}
        onApplyCoupon={handleApplyCoupon}
        onRemoveCoupon={removeCoupon}
        finishPayment={finishPayment}
        period={period}
        userId={userId}
        bookOffice={bookOffice}
        onPreviousStep={() => setActiveStep(0)}
        setInvoiceId={(id) => {
          console.log("Setting invoice ID in parent:", id);
          setInvoiceId(id);
        }}
      />
    ),
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
          isNextDisabled={!isFormValid}
          isLast={activeStep === 2}
        />
      )}
    </div>
  );
}
