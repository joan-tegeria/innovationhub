import React, { useEffect, useState } from "react";
import styles from "./PersonalDesk.module.css";
import api from "../utility/axiosConfig";
import dayjs from "dayjs";
import { useLocalStorage } from "../hooks/useLocalStorage/useLocalStorage";
import { calculateEndDate, formatDate } from "../utility";
import Stepper from "@mui/material/Stepper";
import Step from "@mui/material/Step";
import StepLabel from "@mui/material/StepLabel";
import StepConnector from "@mui/material/StepConnector";
import { styled } from "@mui/material/styles";
import { Alert } from "@mui/material";
import { useBooking } from "../context/BookingContext";
import Information from "./Information";
import Footer from "./Footer";
import Payment from "./Payment";
import Finished from "./Finished";
import { useAuth } from "../context/Auth";

const steps = ["Information", "Payment", "Finished"];

const CustomStepConnector = styled(StepConnector)(({ theme }) => ({
  "& .MuiStepConnector-line": {
    borderColor: "#BDBDBD",
    borderTopWidth: 2,
  },
}));

const CustomStepLabel = styled(StepLabel)(({ theme }) => ({
  "& .MuiStepIcon-root": {
    color: "#E0E0E0",
    "&.Mui-active": {
      color: "#EB3778",
    },
    "&.Mui-completed": {
      color: "#EB3778",
    },
  },
  "& .MuiStepLabel-label": {
    color: "#BDBDBD",
    "&.Mui-active": {
      color: "#EB3778",
      fontWeight: 600,
    },
    "&.Mui-completed": {
      color: "#EB3778",
    },
    textAlign: "center",
  },
}));

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
  const {
    personalDeskUserInfo,
    setPersonalDeskUserInfo,
    period,
    handlePersonalDesk,
  } = useBooking();
  const [payUrl, setPayUrl] = useState("");
  const { accessToken, tokenType, tokenLoading } = useAuth();
  const [stepperOrientation, setStepperOrientation] = useState(
    window.innerWidth < 768 ? "vertical" : "horizontal"
  );

  useEffect(() => {
    const handleResize = () => {
      setStepperOrientation(
        window.innerWidth < 768 ? "vertical" : "horizontal"
      );
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (!tokenLoading) {
      const getAllOffices = async () => {
        try {
          setLoading(true);
          const {
            data: { data: allOffices },
          } = await api.get(
            "https://nhpvz8wphf.execute-api.eu-central-1.amazonaws.com/prod/shared",
            { headers: { Authorization: `${tokenType} ${accessToken}` } }
          );

          // Check the parent window's endpoint
          const parentEndpoint = window.parent.location.pathname;
          let transformed = allOffices.map((item) => ({
            value: item.id,
            label: item.Name,
          }));

          // Reverse the response if the parent endpoint is 'dedicated-desk'
          if (parentEndpoint.includes("dedicated-desk")) {
            transformed = transformed.reverse();
          }

          setWorkspaces(transformed);
          setLoading(false);
          handlePersonalDesk("workspace", transformed[0].value);
        } catch (error) {
          console.log("Error fetching offices:", error);
        }
      };
      getAllOffices();
    }
  }, [tokenLoading]);

  const checkOfficeAvaliablity = async (startDate) => {
    try {
      const fromDate = dayjs(startDate);
      const toDate = calculateEndDate(fromDate, period);
      const endDate = dayjs(personalDeskUserInfo.toDate);

      handlePersonalDesk("selectDate", fromDate.format("YYYY-MM-DD"));
      handlePersonalDesk("endDate", endDate.format("YYYY-MM-DD"));

      const { data: availabilityData } = await api.get(
        `https://nhpvz8wphf.execute-api.eu-central-1.amazonaws.com/prod/shared/${
          personalDeskUserInfo.workspace
        }?from=${formatDate(startDate)}&to=${formatDate(toDate)}`,
        { headers: { Authorization: `${tokenType} ${accessToken}` } }
      );

      setRandomSeat(
        availabilityData.availableSeats[
          Math.floor(Math.random() * availabilityData.availableSeats.length)
        ]
      );

      const priceResponse = await api.get(
        `https://nhpvz8wphf.execute-api.eu-central-1.amazonaws.com/prod/prices?product=Flexible Desk&period=${period}`,
        { headers: { Authorization: `${tokenType} ${accessToken}` } }
      );

      setPrice(priceResponse.data.data[0].Unit_Price);
      setInfo("info");
      setInfoMessage("Space is available for " + period);
    } catch (error) {
      console.log("Error checking availability:", error);
    }
  };

  const createUser = async () => {
    if (Object.values(personalDeskUserInfo).some((value) => !value)) {
      setErrorMessage("Please fill in all required fields.");
      return;
    }

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
      await bookOffice(response.id);
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
      room: personalDeskUserInfo.workspace,
      from: personalDeskUserInfo.selectDate,
      to: personalDeskUserInfo.endDate,
      seat: randomSeat.toString(),
      referral: "Shared Office Form",
      booked: period,
    };

    try {
      const bookingResponse = await api.post(
        "https://nhpvz8wphf.execute-api.eu-central-1.amazonaws.com/prod/shared",
        bookingData,
        { headers: { Authorization: `${tokenType} ${accessToken}` } }
      );
      setPayUrl(bookingResponse.data.paymentSession);
    } catch (error) {
      console.log("Error booking office:", error);
      setErrorMessage("Failed to book office. Please try again.");
    }
  };

  const handleNext = () => {
    if (activeStep === 0) {
      createUser();
    } else if (activeStep === 1) {
      bookOffice();
    } else if (activeStep === 2) {
      handleBack();
    } else {
      setActiveStep((prevActiveStep) => prevActiveStep + 1);
    }
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

  const stepComponents = {
    0: (
      <Information
        loading={loading}
        setIsLoading={setLoading}
        checkOffice={checkOfficeAvaliablity}
        workspaces={workspaces}
        info={info}
        infoMessage={infoMessage}
      />
    ),
    1: <Payment loading={loading} setIsLoading={setLoading} payurl={payUrl} />,
    2: <Finished />,
  };

  return (
    <div className={styles.formContainer}>
      <div className={styles.formBody}>
        <div className={styles.formTitle}>
          <span className={styles.title}>Ready to get started</span>
        </div>

        <div className={styles.stepper}>
          <Stepper
            activeStep={activeStep}
            nonLinear
            connector={<CustomStepConnector />}
            orientation={stepperOrientation}
            style={{ width: "100%" }}
          >
            {steps.map((label) => (
              <Step key={label}>
                <CustomStepLabel>{label}</CustomStepLabel>
              </Step>
            ))}
          </Stepper>
        </div>

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
      {!loading && (
        <Footer
          price={price}
          handleNext={handleNext}
          handleBack={handleBack}
          isBackDisabled={activeStep === 0}
          isNextDisabled={false}
          isLast={activeStep === 2}
        />
      )}
    </div>
  );
}
