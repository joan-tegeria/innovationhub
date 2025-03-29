import React, { useEffect, useState } from "react";
import styles from "./FullOffice.module.css";
import api from "../utility/axiosConfig";
import dayjs from "dayjs";
import { useLocalStorage } from "../hooks/useLocalStorage/useLocalStorage";
import { calculateEndDate, formatDate, formatBirthDate } from "../utility";
import { Alert } from "@mui/material";
import { useBooking } from "../context/BookingContext";
import { useAuth } from "../context/Auth";
import Information from "./Information";
import Footer from "./Footer/Footer";
import Modal from "./Modal";
import Finished from "./Finished";
import Payment from "./Payment";

const steps = ["Information", "Payment", "Finished"];

export default function FullOffice() {
  //State
  const [price, setPrice] = useState(0);
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [localData, setLocalData] = useLocalStorage("localData", {});
  const [userId, setUserId] = useState("");
  const [randomSeat, setRandomSeat] = useState("");
  const [open, setOpen] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [workspaces, setWorkspaces] = useState([{ value: "", label: "" }]);
  const [isAvailable, setIsAvailable] = useState("");
  const [info, setInfo] = useState("none");
  const [infoMessage, setInfoMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedWorkspace, setSelectedWorkspace] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [validCoupon, setValidCoupon] = useState(null);
  const [invoiceId, setInvoiceId] = useState("");
  const [singlePrice, setSinglePrice] = useState(0);
  const [currentPrice, setCurrentPrice] = useState(0);
  const [payUrl, setPayUrl] = useState("");
  const [isFormValid, setIsFormValid] = useState(false);
  const [priceId, setPriceId] = useState("");
  //Context
  const { fullOfficeInfo, period, handleFullOffice, setFullOfficeInfo } =
    useBooking();
  const { accessToken, tokenType, tokenLoading } = useAuth();

  useEffect(() => {
    console.log("🚀 ~ PersonalDesk ~ fullOfficeInfo:", fullOfficeInfo);
  }, [fullOfficeInfo]);

  // Update price when workspace changes
  useEffect(() => {
    // Skip this effect during initial render with empty workspace
    if (
      fullOfficeInfo.workspace &&
      workspaces.length > 0 &&
      workspaces[0].value !== ""
    ) {
      // If a date is already selected, call checkOffice with the date
      if (fullOfficeInfo.selectDate) {
        // If selectDate appears to be an ISO string from a previous check, we can use it directly
        // Otherwise, we'll just call checkOfficeAvaliablity without a date to get the price
        const isISOString =
          typeof fullOfficeInfo.selectDate === "string" &&
          fullOfficeInfo.selectDate.includes("T");

        if (isISOString) {
          // For formatted dates, we just need to get the price
          checkOfficeAvaliablity();
        } else {
          // For date objects, we need to check availability
          checkOfficeAvaliablity(fullOfficeInfo.selectDate);
        }
      } else {
        // Otherwise just get the price
        checkOfficeAvaliablity();
      }
    }
  }, [fullOfficeInfo.workspace]);

  //Handlers
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  useEffect(() => {
    const getAllOffices = async () => {
      try {
        // setLoading(true);
        const {
          data: { data: allOffices },
        } = await api.get(
          "https://nhpvz8wphf.execute-api.eu-central-1.amazonaws.com/prod/private",
          {
            headers: {
              Authorization: `${tokenType} ${accessToken}`,
            },
          }
        );

        console.log("🚀 ~ checkOfficeAvaliablity ~ allOffices:", allOffices);
        const transformed = allOffices.map((item) => ({
          value: item.id,
          label: item.Name,
        }));
        setWorkspaces(transformed);
        setLoading(false);

        // Select the first workspace and update the context
        if (transformed.length > 0) {
          const initialWorkspace = transformed[0].value;
          handleFullOffice("workspace", initialWorkspace);
          setSelectedWorkspace(transformed[0]);

          // Call checkOfficeAvaliablity with no date to just get the price
          setTimeout(() => {
            checkOfficeAvaliablity();
          }, 100);
        }
      } catch (error) {
        console.log("🚀 ~ getAllOffices ~ error:", error);
      }
    };
    getAllOffices();
  }, []);

  useEffect(() => {
    const validateForm = () => {
      const requiredFields = {
        businessName: fullOfficeInfo.businessName,
        nipt: fullOfficeInfo.nipt,
        email: fullOfficeInfo.email,
        workspace: fullOfficeInfo.workspace,
        phoneNumber: fullOfficeInfo.phoneNumber,
        selectDate: fullOfficeInfo.selectDate,
      };

      return Object.values(requiredFields).every(
        (field) => field && field !== ""
      );
    };

    setIsFormValid(validateForm());
  }, [fullOfficeInfo]);

  const handleApplyCoupon = async (code) => {
    if (!code) return;

    const selectedWorkspaceObj = workspaces.find(
      (ws) => ws.value === fullOfficeInfo.workspace
    );
    const workspaceLabel = selectedWorkspaceObj?.label;
    setSelectedWorkspace(selectedWorkspaceObj || {});

    setCouponLoading(true);
    try {
      const response = await api.get(
        `https://nhpvz8wphf.execute-api.eu-central-1.amazonaws.com/prod/coupon?coupon=${code}&product=${priceId}&booking=${period}&quantity=1`,
        {
          headers: { Authorization: `${tokenType} ${accessToken}` },
        }
      );
      setValidCoupon(response.data.couponData.Coupon_Value);
      setPrice(
        (prev) => prev - (prev * response.data.couponData.Coupon_Value) / 100
      );

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
    setActiveStep(2);
  };

  const proceedToPayment = async () => {
    try {
      setLoading(true);

      // Get the selected workspace label
      const selectedWorkspaceObj = workspaces.find(
        (ws) => ws.value === fullOfficeInfo.workspace
      );
      const workspaceLabel = selectedWorkspaceObj?.label;

      // For The Solo and The Duo workspaces
      if (workspaceLabel === "The Solo" || workspaceLabel === "The Duo") {
        const bookingData = {
          username: fullOfficeInfo.businessName + " " + fullOfficeInfo.nipt,
          user: fullOfficeInfo.userId, // Use the userId from account creation
          from: fullOfficeInfo.selectDate,
          to: fullOfficeInfo.endDate,
          room: fullOfficeInfo.workspace,
          booking: period,
          requestedFrom: fullOfficeInfo.requestedFrom,
          discount: validCoupon ? validCoupon : 0,
        };

        const bookingResponse = await api.post(
          "https://nhpvz8wphf.execute-api.eu-central-1.amazonaws.com/prod/private",
          bookingData,
          {
            headers: {
              Authorization: `${tokenType} ${accessToken}`,
            },
          }
        );

        // Get payment URL from response
        const paymentUrl = bookingResponse.data.paymentSession;
        setInvoiceId(bookingResponse.data.invoice);
        setPayUrl(paymentUrl);
        // Return the payment URL
        return paymentUrl;
      }
      return null;
    } catch (error) {
      console.log("🚀 ~ proceedToPayment ~ error:", error);
      setErrorMessage("Failed to process payment. Please try again.");
      return null;
    } finally {
      setLoading(false);
    }
  };

  const createContact = async () => {
    try {
      setLoading(true);
      const userData = {
        name: fullOfficeInfo.businessName,
        lastName: fullOfficeInfo.businessName,
        email: fullOfficeInfo.email,
        birthday: "2003-11-02", // Default birthdate
        id: fullOfficeInfo.nipt,
      };

      const {
        data: { data: response },
      } = await api.post(
        "https://nhpvz8wphf.execute-api.eu-central-1.amazonaws.com/prod/account",
        userData,
        {
          headers: {
            Authorization: `${tokenType} ${accessToken}`,
          },
        }
      );

      // Store the user ID for later use in proceedToPayment
      setUserId(response.id);
      await handleFullOffice("userId", response.id);

      // Move to the Payment step
      setActiveStep(1);
      setLoading(false);
    } catch (error) {
      console.log("🚀 ~ createContact ~ error:", error);
      setErrorMessage("Failed to create account. Please try again.");
      setLoading(false);
    }
  };

  const sendBookRequest = async (userId) => {
    setLoading(true);
    let _userId = userId;

    // Get the selected workspace label
    const selectedWorkspaceObj = workspaces.find(
      (ws) => ws.value === fullOfficeInfo.workspace
    );
    const workspaceLabel = selectedWorkspaceObj?.label;
    setSelectedWorkspace(selectedWorkspaceObj || {});
    console.log("🚀 ~ sendBookRequest ~ workspaceLabel:", workspaceLabel);
    try {
      // Use different APIs based on workspace type
      if (workspaceLabel === "The Suite" || workspaceLabel === "The Pod") {
        // Use leads API for other workspaces (The Suite and The Pod)
        const userData = {
          name: fullOfficeInfo.businessName,
          lastName: fullOfficeInfo.businessName,
          email: fullOfficeInfo.email,
          company: fullOfficeInfo.businessName,
          referral: "Private Office Form",
          birthdate: "2003-11-02",
          id: fullOfficeInfo.nipt,
          nipt: fullOfficeInfo.nipt,
          phone: fullOfficeInfo.phoneNumber,
        };

        const {
          data: { data: response },
        } = await api.post(
          "https://nhpvz8wphf.execute-api.eu-central-1.amazonaws.com/prod/leads",
          userData,
          {
            headers: {
              Authorization: `${tokenType} ${accessToken}`,
            },
          }
        );

        _userId = response.id;
      }

      const bookingData = {
        username: fullOfficeInfo.businessName + " " + fullOfficeInfo.nipt,
        user: fullOfficeInfo.userId,
        from: fullOfficeInfo.selectDate,
        to: fullOfficeInfo.endDate,
        room: fullOfficeInfo.workspace,
        booking: period,
        requestedFrom: fullOfficeInfo.requestedFrom,
        discount: validCoupon ? validCoupon : 0,
      };

      const bookingResponse = await api.post(
        "https://nhpvz8wphf.execute-api.eu-central-1.amazonaws.com/prod/private",
        bookingData,
        {
          headers: {
            Authorization: `${tokenType} ${accessToken}`,
          },
        }
      );

      setPayUrl(bookingResponse.data.paymentSession);
      setInvoiceId(bookingResponse.data.invoice);
      setLoading(false);

      // Determine the next step based on workspace type
      if (workspaceLabel === "The Suite" || workspaceLabel === "The Pod") {
        setActiveStep(2); // Skip payment and go directly to Finished step
      } else {
        setActiveStep(1); // Go to Payment step for The Solo and The Duo
      }
    } catch (error) {
      console.log("🚀 ~ sendBookRequest ~ error:", error);
      setErrorMessage("Failed to process booking. Please try again.");
      setLoading(false);
    }
  };

  const checkOfficeAvaliablity = async (startDate) => {
    try {
      // If no start date provided, just check for pricing but not availability
      if (!startDate) {
        const selectedWorkspaceObj = workspaces.find(
          (ws) => ws.value === fullOfficeInfo.workspace
        );

        if (selectedWorkspaceObj) {
          setSelectedWorkspace(selectedWorkspaceObj);
          // Fetch price for the selected workspace
          try {
            const priceResponse = await api.get(
              `https://nhpvz8wphf.execute-api.eu-central-1.amazonaws.com/prod/prices?product=${selectedWorkspaceObj.value}&period=${period}`,
              {
                headers: {
                  Authorization: `${tokenType} ${accessToken}`,
                },
              }
            );

            const basePrice = priceResponse.data.data[0].Unit_Price;
            setPrice(basePrice - (basePrice * (validCoupon || 0)) / 100);
            setCurrentPrice(basePrice);
            setSinglePrice(basePrice);

            // Don't update availability status since we're just checking price
          } catch (error) {
            console.log("Error fetching price:", error);
            setInfo("error");
            setInfoMessage("Error retrieving price information");
          }
          return;
        }
      }

      // Normal availability check with date
      const fromDate = dayjs(startDate);
      const toDate = calculateEndDate(fromDate, period);

      // Make sure we're using the correct date format with dayjs
      const formattedStartDate = fromDate
        .format("YYYY-MM-DDTHH:mm:ssZ")
        .replace(/\+/g, "+");
      const formattedEndDate = toDate
        .format("YYYY-MM-DDTHH:mm:ssZ")
        .replace(/\+/g, "+");

      handleFullOffice("selectDate", formattedStartDate);
      handleFullOffice("endDate", formattedEndDate);

      const {
        data: { data: response },
      } = await api.get(
        `https://nhpvz8wphf.execute-api.eu-central-1.amazonaws.com/prod/private/${
          fullOfficeInfo.workspace
        }?from=${encodeURIComponent(
          formattedStartDate
        )}&to=${encodeURIComponent(formattedEndDate)}`,
        {
          headers: {
            Authorization: `${tokenType} ${accessToken}`,
          },
        }
      );
      setIsAvailable(response);

      // Get the selected workspace label
      const selectedWorkspaceObj = workspaces.find(
        (ws) => ws.value === fullOfficeInfo.workspace
      );
      if (selectedWorkspaceObj) {
        setSelectedWorkspace(selectedWorkspaceObj);
        // Fetch price for the selected workspace
        const priceResponse = await api.get(
          `https://nhpvz8wphf.execute-api.eu-central-1.amazonaws.com/prod/prices?product=${selectedWorkspaceObj.label}&period=${period}`,
          {
            headers: {
              Authorization: `${tokenType} ${accessToken}`,
            },
          }
        );

        const basePrice = priceResponse.data.data[0].Unit_Price;
        setPrice(basePrice - (basePrice * (validCoupon || 0)) / 100);
        setCurrentPrice(basePrice);
        setSinglePrice(basePrice);
        console.log("🚀 ~ priceResponse ~ response:", priceResponse.data);
        setPriceId(response.data[0].id);
        localStorage.setItem("priceId", priceResponse.data[0].id);
        if (response === "Available") {
          setInfo("info");
          setInfoMessage("Space is available for " + period);
        }
      }

      console.log(
        "🚀 ~ checkOfficeAvaliablity ~ response:",
        response.data[0].id
      );
    } catch (error) {
      console.log("🚀 ~ checkOfficeAvaliablity ~ error:", error);
      setInfo("error");
      setInfoMessage("Error checking availability");
    }
  };

  const handleNext = () => {
    const selectedWorkspaceObj = workspaces.find(
      (ws) => ws.value === fullOfficeInfo.workspace
    );
    const workspaceLabel = selectedWorkspaceObj?.label;
    setSelectedWorkspace(selectedWorkspaceObj || {});

    if (activeStep === 0) {
      if (workspaceLabel === "The Suite" || workspaceLabel === "The Pod") {
        // For The Suite and The Pod, use leads API and book directly
        sendBookRequest();
      } else if (
        workspaceLabel === "The Solo" ||
        workspaceLabel === "The Duo"
      ) {
        // For The Solo and The Duo, create account first
        createContact();
      }
    } else {
      // For other steps, just move forward
      setActiveStep((prevActiveStep) => prevActiveStep + 1);
    }
  };

  const resetForm = () => {
    const currentOffice = fullOfficeInfo.workspace;
    setFullOfficeInfo({
      selectDate: "",
      endDate: "",
      businessName: "",
      nipt: "",
      businessSize: "",
      email: "",
      street: "",
      city: "",
      workspace: currentOffice,
      phoneNumber: "",
    });
    setActiveStep(0);
  };

  const stepComponents = {
    0: (
      <Information
        loading={loading}
        checkOffice={checkOfficeAvaliablity}
        workspaces={workspaces}
        info={info}
        infoMessage={infoMessage}
      />
    ),
    1: (
      <Payment
        loading={loading}
        setIsLoading={setLoading}
        validCoupon={validCoupon}
        payurl={payUrl}
        selectedWorkspace={selectedWorkspace}
        price={price}
        invoiceId={invoiceId}
        fullOfficeInfo={fullOfficeInfo}
        singlePrice={singlePrice}
        currentPrice={currentPrice}
        couponCode={couponCode}
        setCouponCode={setCouponCode}
        couponLoading={couponLoading}
        onApplyCoupon={handleApplyCoupon}
        onRemoveCoupon={removeCoupon}
        finishPayment={finishPayment}
        proceedToPayment={proceedToPayment}
        period={period}
        priceId={localStorage.getItem("priceId")}
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

  if (!accessToken) {
    return null;
  }

  return (
    <>
      {/* <Modal open={open} onClose={handleClose} title={"Error"} isError={true}>
        <div>Hello Wolrd</div>
      </Modal> */}
      {/* <div className={styles.container}> */}
      <div className={styles.formContainer}>
        <div className={styles.formTitle}>
          <span className={styles.title}>Ready to get started</span>
          <p className={styles.desc}>
            Reserve your ideal space today, designed for productivity and
            tailored to your needs. Enjoy perks like reliable high-speed Wi-Fi,
            fully equipped meeting rooms, and a comfortable, professional
            environment where you can thrive.
          </p>
        </div>

        <div className={styles.stepContent}>
          {stepComponents[activeStep] || stepComponents[0]}
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
            handleNext={
              activeStep === steps.length - 1 ? resetForm : handleNext
            }
            handleBack={resetForm}
            isBackDisabled={activeStep === 0}
            isNextDisabled={!isFormValid || isAvailable !== "Available"}
            isLast={activeStep === 2}
            currentPrice={currentPrice}
            singlePrice={singlePrice}
            validCoupon={validCoupon}
            period={period}
          />
        )}
      </div>
      {/* </div> */}
    </>
  );
}
