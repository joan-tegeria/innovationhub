import React, { useEffect, useState } from "react";
import styles from "./PersonalDesk.module.css";
import axios from "axios";
import dayjs from "dayjs";
import { useLocalStorage } from "../hooks/useLocalStorage/useLocalStorage";

import { calculateEndDate, formatDate, formatBirthDate } from "../utility";

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
import Modal from "./Modal";
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
    color: "#E0E0E0", // Default color for the step icons
    "&.Mui-active": {
      color: "#886DDE", // Active step color
    },
    "&.Mui-completed": {
      color: "#886DDE", // Completed step color
    },
  },
  "& .MuiStepLabel-label": {
    color: "#BDBDBD", // Default text color
    "&.Mui-active": {
      color: "#886DDE", // Active step text color
      fontWeight: 600,
    },

    textAlign: "center", // Center the labels
  },
}));

export default function PersonalDesk() {
  //State
  const [price, setPrice] = useState(5000);
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [localData, setLocalData] = useLocalStorage("localData", {});
  const [userId, setUserId] = useState("");
  const [randomSeat, setRandomSeat] = useState("");
  const [open, setOpen] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isAvaliable, setIsAvaliable] = useState(false);
  const [info, setInfo] = useState("none");
  const [infoMessage, setInfoMessage] = useState("");
  const [workspaces, setWorkspaces] = useState([{ value: "", label: "" }]);
  //Context
  const {
    personalDeskUserInfo,
    setPersonalDeskUserInfo,
    period,
    handlePersonalDesk,
  } = useBooking();

  const { accessToken, tokenType, tokenLoading, error } = useAuth();
  console.log("🚀 ~ PersonalDesk ~ accessToken:", accessToken);

  useEffect(() => {
    console.log(
      "🚀 ~ PersonalDesk ~ personalDeskUserInfo:",
      personalDeskUserInfo
    );
  }, [personalDeskUserInfo]);

  useEffect(() => {
    if (!tokenLoading) {
      const getAllOffices = async () => {
        try {
          setLoading(true);
          const {
            data: { data: allOffices },
          } = await axios.get(
            "https://nhpvz8wphf.execute-api.eu-central-1.amazonaws.com/prod/shared",
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
          handlePersonalDesk("workspace", transformed[0].value);
        } catch (error) {
          console.log("🚀 ~ getAllOffices ~ error:", error);
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

      const { data: availabilityData } = await axios.get(
        `https://nhpvz8wphf.execute-api.eu-central-1.amazonaws.com/prod/shared/${
          personalDeskUserInfo.workspace
        }?from=${formatDate(startDate)}&to=${formatDate(toDate)}`,
        {
          headers: {
            Authorization: `${tokenType} ${accessToken}`,
          },
        }
      );

      setRandomSeat(
        availabilityData.availableSeats[
          Math.floor(Math.random() * availabilityData.availableSeats.length)
        ]
      );
      setInfo("info");
      setInfoMessage("Space is avaliable for " + period);
    } catch (error) {
      console.log("🚀 ~ checkOfficeAvaliablity ~ error:", error);
    }
  };

  const createUser = async () => {
    if (Object.values(personalDeskUserInfo).some((value) => !value)) {
      setHasError(true);
      return;
    }

    setLoading(true);
    const userData = {
      name: personalDeskUserInfo.firstName,
      lastName: personalDeskUserInfo.lastName,
      email: personalDeskUserInfo.email,
      birthday: personalDeskUserInfo.birthday,
      // check: "ERROR",
      id: personalDeskUserInfo.idNumber,
    };
    console.log("🚀 ~ createUser ~ userData:", userData);

    setLocalData(userData);

    try {
      // Create user
      const {
        data: { data: response },
      } = await axios.post(
        "https://nhpvz8wphf.execute-api.eu-central-1.amazonaws.com/prod/account",
        userData,
        {
          headers: {
            Authorization: `${tokenType} ${accessToken}`,
          },
        }
      );
      console.log("🚀 ~ createUser ~ response:", response);
      setLoading(false);
      setUserId(response.id);
      setActiveStep((prevActiveStep) => prevActiveStep + 1);
    } catch (error) {
      console.error("Error creating user:", error);
    } finally {
      setLoading(false);
    }
  };

  const bookOffice = async () => {
    const bookingData = {
      username:
        personalDeskUserInfo.firstName + " " + personalDeskUserInfo.lastName,
      user: userId,
      room: personalDeskUserInfo.workspace,
      // phoneNumber: "0682464577",
      from: personalDeskUserInfo.selectDate,
      to: personalDeskUserInfo.endDate,
      seat: randomSeat.toString(),
      referral: "Shared Office Form",
      booked: period,
    };
    console.log("🚀 ~ bookOffice ~ bookingData:", bookingData);

    try {
      const bookingResponse = await axios.post(
        "https://nhpvz8wphf.execute-api.eu-central-1.amazonaws.com/prod/shared",
        bookingData,
        {
          headers: {
            Authorization: `${tokenType} ${accessToken}`,
          },
        }
      );
      console.log("🚀 ~ bookOffice ~ bookingResponse:", bookingResponse);
      setActiveStep((prevActiveStep) => prevActiveStep + 1);
    } catch (error) {
      console.log("🚀 ~ bookOffice ~ error:", error);
    }
  };

  const handleNext = () => {
    // setActiveStep((prevActiveStep) => prevActiveStep + 1);
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
    1: <Payment loading={loading} setIsLoading={setLoading} />,
    2: <Finished />,
  };

  return (
    <>
      {/* <div className={styles.container}> */}
      <div className={styles.formContainer}>
        <div className={styles.formBody}>
          <div className={styles.formTitle}>
            <span className={styles.title}>Ready to get started</span>
          </div>

          {/* Stepper */}
          <div className={styles.stepper}>
            <Stepper
              activeStep={activeStep}
              nonLinear // Ensures the labels are horizontally aligned
              connector={<CustomStepConnector />}
            >
              {steps.map((label, index) => (
                <Step key={label}>
                  <CustomStepLabel>{label}</CustomStepLabel>
                </Step>
              ))}
            </Stepper>
          </div>

          {/* Render step content */}
          <div className={styles.stepContent}>
            {stepComponents[activeStep] || stepComponents[0]}
          </div>
        </div>
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
      {/* </div> */}
    </>
  );
}
