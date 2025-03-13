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

  //Context
  const { fullOfficeInfo, period, handleFullOffice, setFullOfficeInfo } =
    useBooking();
  const { accessToken, tokenType, tokenLoading } = useAuth();

  useEffect(() => {
    console.log("🚀 ~ PersonalDesk ~ fullOfficeInfo:", fullOfficeInfo);
  }, [fullOfficeInfo]);

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
        handleFullOffice("workspace", transformed[0].value);
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

    setCouponLoading(true);
    try {
      const response = await api.get(
        `https://nhpvz8wphf.execute-api.eu-central-1.amazonaws.com/prod/coupon?coupon=${code}`,
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

  const sendBookRequest = async () => {
    setLoading(true);
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

    try {
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

      const bookingData = {
        username: fullOfficeInfo.businessName + " " + fullOfficeInfo.nipt,
        user: response.id,
        from: fullOfficeInfo.selectDate,
        to: fullOfficeInfo.endDate,
        room: fullOfficeInfo.workspace,
        booking: period,
        requestedFrom: fullOfficeInfo.requestedFrom,
        // discount: validCoupon ? validCoupon : 0,
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
      setInvoiceId(bookingResponse.data.invoiceId);
      setLoading(false);

      // Get the selected workspace label
      const selectedWorkspaceObj = workspaces.find(
        (ws) => ws.value === fullOfficeInfo.workspace
      );
      const workspaceLabel = selectedWorkspaceObj?.label;
      console.log("🚀 ~ sendBookRequest ~ workspaceLabel:", workspaceLabel);
      // Skip payment step for The Suite and The Pod
      if (workspaceLabel === "The Suite" || workspaceLabel === "The Pod") {
        setActiveStep(2); // Go directly to Finished step
      } else {
        setActiveStep((prevActiveStep) => prevActiveStep + 1); // Go to Payment step
      }
    } catch (error) {
      console.log("🚀 ~ sendBookRequest ~ error:", error);
      setErrorMessage("Failed to process booking. Please try again.");
      setLoading(false);
    }
  };

  const checkOfficeAvaliablity = async (startDate) => {
    try {
      const fromDate = dayjs(startDate);
      const toDate = calculateEndDate(fromDate, period);

      const formattedStartDate = formatDate(startDate).replace(/\+/g, "+");
      const formattedEndDate = formatDate(toDate).replace(/\+/g, "+");

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

        if (response === "Available") {
          setInfo("info");
          setInfoMessage("Space is available for " + period);
        }
      }

      console.log("🚀 ~ checkOfficeAvaliablity ~ response:", response);
    } catch (error) {
      console.log("🚀 ~ checkOfficeAvaliablity ~ error:", error);
      setInfo("error");
      setInfoMessage("Error checking availability");
    }
  };

  const handleNext = () => {
    // setActiveStep((prevActiveStep) => prevActiveStep + 1);
    if (activeStep === 0) {
      sendBookRequest();
    } else {
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
        couponCode={couponCode}
        setCouponCode={setCouponCode}
        couponLoading={couponLoading}
        onApplyCoupon={handleApplyCoupon}
        validCoupon={validCoupon}
        onRemoveCoupon={removeCoupon}
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
        finishPayment={finishPayment}
        period={period}
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

        {!loading && activeStep !== 2 && (
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
