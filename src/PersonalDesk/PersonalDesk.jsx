import React, { useEffect, useState } from "react";
import styles from "./PersonalDesk.module.css";
import api from "../utility/axiosConfig";
import dayjs from "dayjs";
import { useLocalStorage } from "../hooks/useLocalStorage/useLocalStorage";
import { calculateEndDate, formatDate } from "../utility";
import { Alert, duration } from "@mui/material";
import { useBooking } from "../context/BookingContext";
import Information from "./Information";
import Footer from "./Footer";
import Payment from "./Payment";
import Finished from "./Finished";
import { useAuth } from "../context/Auth";
import { use } from "react";

const steps = ["Information", "Payment", "Finished"];

export default function PersonalDesk() {
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
  const {
    personalDeskUserInfo,
    setPersonalDeskUserInfo,
    period,
    handlePersonalDesk,
  } = useBooking();

  const { accessToken, tokenType, tokenLoading } = useAuth();
  const [isFormValid, setIsFormValid] = useState(false);

  function transformData(inputData) {
    // Check if inputData is an array, if not, try to access the correct property
    // or return an empty array
    if (!Array.isArray(inputData)) {
      console.warn("Input data is not an array:", inputData);
      return [];
    }

    const result = {};

    inputData.forEach((item) => {
      // Check if item.Name is defined
      if (!item.Name) {
        console.warn("Item Name is undefined:", item);
        return; // Skip this iteration if Name is undefined
      }

      const nameParts = item.Name.split(" - "); // Split the name to separate the type and the pass type
      const name = nameParts[0]; // Get the desk type (e.g., "Dedicated Desk")

      // Initialize the desk type in the result if it doesn't exist
      if (!result[name]) {
        result[name] = {
          label: name,
          value: [],
        };
      }

      // Assign the ID based on the pass type
      if (nameParts.length > 1 && nameParts[1] === "Multi Pass") {
        // Insert Multi Pass ID at the beginning
        result[name].value.unshift(item.id);
      } else {
        // Push Single Pass ID to the end
        result[name].value.push(item.id);
      }
    });

    // Convert the result object to an array
    return Object.values(result);
  }

  useEffect(() => {
    if (!tokenLoading) {
      const getAllOffices = async () => {
        try {
          setLoading(true);
          const response = await api.get(
            "https://nhpvz8wphf.execute-api.eu-central-1.amazonaws.com/prod/shared",
            { headers: { Authorization: `${tokenType} ${accessToken}` } }
          );

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

  const getPrice = async () => {
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
      `https://nhpvz8wphf.execute-api.eu-central-1.amazonaws.com/prod/prices?product=${_selectedWorkspace.label}&period=${period}`,
      { headers: { Authorization: `${tokenType} ${accessToken}` } }
    );
    console.log(priceResponse.data.data[0].Unit_Price);

    setPrice(
      priceResponse.data.data[0].Unit_Price * personalDeskUserInfo.passDuration
    );
    setCurrentPrice(
      priceResponse.data.data[0].Unit_Price * personalDeskUserInfo.passDuration
    );
    setSinglePrice(priceResponse.data.data[0].Unit_Price);
    setIsPriceFilled(true);
    setPriceId(priceResponse.data.data[0].id);

    // Only set info message if we have the required data
    if (personalDeskUserInfo.bookingType === "Multi Pass") {
      if (personalDeskUserInfo.passDuration > 0) {
        setInfo("info");
        setInfoMessage(
          "Space is available for " +
            personalDeskUserInfo.passDuration +
            " passes"
        );
      } else {
        setInfo("none");
      }
    } else {
      // For Single Pass, info message is handled by checkOfficeAvaliablity function
      if (!personalDeskUserInfo.selectDate) {
        setInfo("none");
      }
    }
  };

  const checkOfficeAvaliablity = async (startDate, periodToUse) => {
    try {
      const fromDate = dayjs(startDate);
      const toDate = calculateEndDate(fromDate, periodToUse || period);
      const endDate = dayjs(toDate);

      handlePersonalDesk("selectDate", fromDate.format("YYYY-MM-DD"));
      handlePersonalDesk("endDate", endDate.format("YYYY-MM-DD"));

      // First check availability
      const { data: availabilityData } = await api.get(
        `https://nhpvz8wphf.execute-api.eu-central-1.amazonaws.com/prod/shared/${
          personalDeskUserInfo.workspace[1]
        }?from=${encodeURIComponent(
          formatDate(startDate)
        )}&to=${encodeURIComponent(formatDate(toDate))}`,
        { type: "Single Pass" },
        { headers: { Authorization: `${tokenType} ${accessToken}` } }
      );

      setRandomSeat(
        availabilityData.availableSeats[
          Math.floor(Math.random() * availabilityData.availableSeats.length)
        ]
      );

      // Get price using the main getPrice function to avoid duplication
      await getPrice();

      setInfo("info");
      setInfoMessage("Space is available for " + (periodToUse || period));
    } catch (error) {
      console.log("Error checking availability:", error);
      setInfo("error");
      setInfoMessage("Error checking availability");
    }
  };

  const createUser = async () => {
    // if (Object.values(personalDeskUserInfo).some((value) => !value)) {
    //   setErrorMessage("Please fill in all required fields.");
    //   return;
    // }

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
      } = await api.post(
        "https://nhpvz8wphf.execute-api.eu-central-1.amazonaws.com/prod/account",
        userData,
        { headers: { Authorization: `${tokenType} ${accessToken}` } }
      );
      setActiveStep((prevActiveStep) => prevActiveStep + 1);
      setUserId(response.id);
      // await bookOffice(response.id);
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
        "https://nhpvz8wphf.execute-api.eu-central-1.amazonaws.com/prod/shared",
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

  const handleNext = () => {
    createUser();
    // if (activeStep === 0) {
    //   createUser();
    // } else if (activeStep === 1) {
    //   bookOffice();
    // } else if (activeStep === 2) {
    //   handleBack();
    // } else {
    //   setActiveStep((prevActiveStep) => prevActiveStep + 1);
    // }
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
    setInfo("none");
    setActiveStep(0);
  };

  const handleApplyCoupon = async (code) => {
    if (!code) return;

    setCouponLoading(true);

    try {
      const response = await api.get(
        `https://nhpvz8wphf.execute-api.eu-central-1.amazonaws.com/prod/coupon?coupon=${code}&id=${priceId}`,
        {
          headers: { Authorization: `${tokenType} ${accessToken}` },
        }
      );
      // Handle successful coupon application here
      console.log("Coupon response:", response.data);
      setValidCoupon(response.data.discount);
      setPrice(response.data.value);

      setInfo("info");
      setInfoMessage("Coupon applied successfully!");
    } catch (error) {
      console.error("Error applying coupon:", error);
      setValidCoupon(null);
      setInfo("error");
      setInfoMessage("Invalid coupon code");
    } finally {
      setCouponLoading(false);
    }
  };

  const removeCoupon = () => {
    setValidCoupon(null);
    setCouponCode("");
    setInfo("none");
    setPrice(currentPrice);
  };

  const finishPayment = () => {
    console.log("UPDATINGGG ");
    setActiveStep(2);
  };

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
