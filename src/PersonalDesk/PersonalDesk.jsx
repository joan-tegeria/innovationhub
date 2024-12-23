import React, { useEffect, useState } from "react";
import styles from "./PersonalDesk.module.css";
import axios from "axios";
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
import Modal from "./Modal";
import Finished from "./Finished";

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
      color: "#01A9BB", // Active step color
    },
    "&.Mui-completed": {
      color: "#01A9BB", // Completed step color
    },
  },
  "& .MuiStepLabel-label": {
    color: "#BDBDBD", // Default text color
    "&.Mui-active": {
      color: "#000000", // Active step text color
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
  const [workspaces, setWorkspaces] = useState([{ value: "", label: "" }]);
  //Context
  const {
    personalDeskUserInfo,
    setPersonalDeskUserInfo,
    period,
    handlePersonalDesk,
  } = useBooking();

  useEffect(() => {
    console.log(
      "🚀 ~ PersonalDesk ~ personalDeskUserInfo:",
      personalDeskUserInfo
    );
  }, [personalDeskUserInfo]);

  //Handlers
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  useEffect(() => {
    const getAllOffices = async () => {
      try {
        setLoading(true);
        const {
          data: { data: allOffices },
        } = await axios.get(
          "https://8ey3ox6oxi.execute-api.eu-central-1.amazonaws.com/prod/leads/shared"
        );

        console.log("🚀 ~ checkOfficeAvaliablity ~ allOffices:", allOffices);
        const transformed = allOffices.map((item) => ({
          value: item.id,
          label: item.Name,
        }));
        setWorkspaces(transformed);
        setLoading(false);
        handlePersonalDesk("workspace", transformed[0].value);
        console.log("🚀 ~ transformed ~ transformed:", transformed);
      } catch (error) {
        console.log("🚀 ~ getAllOffices ~ error:", error);
      }
    };
    getAllOffices();
  }, []);

  const checkOfficeAvaliablity = async (startDate) => {
    try {
      const fromDate = dayjs(startDate);
      const toDate = calculateEndDate(fromDate, period);
      const endDate = dayjs(personalDeskUserInfo.toDate);

      handlePersonalDesk("selectDate", fromDate.format("D MMMM YYYY"));
      handlePersonalDesk("endDate", endDate.format("D MMMM YYYY"));

      const { data: availabilityData } = await axios.get(
        `https://8ey3ox6oxi.execute-api.eu-central-1.amazonaws.com/prod/leads/shared/${
          personalDeskUserInfo.workspace
        }?from=${formatDate(startDate)}&to=${formatDate(toDate)}`
      );

      setRandomSeat(
        availabilityData.availableSeats[
          Math.floor(Math.random() * availabilityData.availableSeats.length)
        ]
      );
    } catch (error) {
      console.log("🚀 ~ checkOfficeAvaliablity ~ error:", error);
    }
  };

  // const isUserEmpty = Object.values(personalDeskUserInfo).some(
  //   (value) => value === "" || value === null || value === undefined
  // );

  // useEffect(() => {
  //   if (hasError) {
  //     if (isUserEmpty) {
  //       console.log("I am empty");
  //       return;
  //     } else {
  //       console.log("I am not empty");
  //       setHasError(false);
  //     }
  //   }
  // }, [personalDeskUserInfo]);

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

    setLocalData(userData);

    try {
      // Create user
      const response = await axios.post(
        "https://8ey3ox6oxi.execute-api.eu-central-1.amazonaws.com/prod/account",
        userData
      );
      console.log("🚀 ~ createUser ~ response:", response);
      setLoading(false);
      setActiveStep((prevActiveStep) => prevActiveStep + 1);
    } catch (error) {
      console.error("Error creating user:", error);
    } finally {
      setLoading(false);
    }
  };

  const bookOffice = async () => {
    const bookingData = {
      user: userId,
      room: personalDeskUserInfo.workspace,
      phoneNumber: "0682464577",
      from: personalDeskUserInfo.selectDate,
      to: personalDeskUserInfo.endDate,
      seat: randomSeat.toString(),
      referral: "Shared Office Form",
    };

    try {
      const bookingResponse = await axios.post(
        "https://8ey3ox6oxi.execute-api.eu-central-1.amazonaws.com/prod/leads/shared",
        bookingData
      );
      console.log("🚀 ~ bookOffice ~ bookingResponse:", bookingResponse);
    } catch (error) {
      console.log("🚀 ~ bookOffice ~ error:", error);
    }
  };

  const handleNext = () => {
    // setActiveStep((prevActiveStep) => prevActiveStep + 1);
    if (activeStep === 0) {
      createUser();
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
    setActiveStep(0);
  };

  const stepComponents = {
    0: (
      <Information
        loading={loading}
        setIsLoading={setLoading}
        checkOffice={checkOfficeAvaliablity}
        workspaces={workspaces}
      />
    ),
    1: <Payment loading={loading} setIsLoading={setLoading} />,
    2: <Finished />,
  };

  return (
    <>
      {/* <Modal open={open} onClose={handleClose} title={"Error"} isError={true}>
        <div>Hello Wolrd</div>
      </Modal> */}
      <div className={styles.container}>
        <div className={styles.formContainer}>
          <div className={styles.formTitle}>
            <span className={styles.title}>Ready to get started</span>
            <p className={styles.desc}>
              Reserve your ideal space today, designed for productivity and
              tailored to your needs. Enjoy perks like reliable high-speed
              Wi-Fi, fully equipped meeting rooms, and a comfortable,
              professional environment where you can thrive.
            </p>
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
          {!loading && (
            <Footer
              price={price}
              handleNext={handleNext}
              handleBack={handleBack}
              isBackDisabled={activeStep === 0}
              isNextDisabled={activeStep === steps.length - 1}
              isLast={activeStep === 2}
            />
          )}
        </div>
      </div>
    </>
  );
}
