import React, { useEffect, useState } from "react";
import styles from "./FullOffice.module.css";
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

import Modal from "./Modal";
import Finished from "./Finished";

const steps = ["Information", "Finished"];

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

export default function FullOffice() {
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
  const { fullOfficeInfo, period, handleFullOffice, setFullOfficeInfo } =
    useBooking();

  useEffect(() => {
    console.log("🚀 ~ PersonalDesk ~ fullOfficeInfo:", fullOfficeInfo);
  }, [fullOfficeInfo]);

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
          "https://8ey3ox6oxi.execute-api.eu-central-1.amazonaws.com/prod/leads/office"
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

  const sendBookRequest = async () => {
    setLoading(true);
    const userData = {
      name: fullOfficeInfo.businessName,
      lastName: fullOfficeInfo.businessName,
      email: fullOfficeInfo.email,
      company: fullOfficeInfo.businessName,
      referral: "Private Office Form",
      birthdate: "2003-11-02",
      id: "123456789123",
      // address: fullOfficeInfo.street,
      // state: fullOfficeInfo.street,
      // country: "Albania",
      // code: "3001",
      nipt: fullOfficeInfo.nipt,
      phone: fullOfficeInfo.phoneNumber,
    };

    try {
      const {
        data: { data: response },
      } = await axios.post(
        "https://8ey3ox6oxi.execute-api.eu-central-1.amazonaws.com/prod/leads",
        userData
      );
      console.log("🚀 ~ sendBookRequest ~ response:", response);

      const bookingData = {
        username: fullOfficeInfo.businessName + " " + fullOfficeInfo.nipt,
        user: response.id,
        from: fullOfficeInfo.selectedDate,
        to: fullOfficeInfo.endDate,
        room: fullOfficeInfo.workspace,
        flexible: "no",
        description: "Booking submitted via web form",
      };

      const bookingResponse = await axios.post(
        "https://8ey3ox6oxi.execute-api.eu-central-1.amazonaws.com/prod/leads/office",
        bookingData
      );
      console.log("🚀 ~ sendBookRequest ~ bookingResponse:", bookingResponse);
      setLoading(false);
      setActiveStep((prevActiveStep) => prevActiveStep + 1);
    } catch (error) {
      console.log("🚀 ~ sendBookRequest ~ error:", error);
    }
  };

  const checkOfficeAvaliablity = async (startDate) => {
    try {
      const fromDate = dayjs(startDate);
      const toDate = calculateEndDate(fromDate, period);

      const formattedStartDate = formatDate(startDate).replace(/\+/g, "%2B");
      const formattedEndDate = formatDate(toDate).replace(/\+/g, "%2B");

      handleFullOffice("selectDate", formattedStartDate);
      handleFullOffice("endDate", formattedEndDate);

      const {
        data: { data: response },
      } = await axios.get(
        `https://8ey3ox6oxi.execute-api.eu-central-1.amazonaws.com/prod/leads/office/${fullOfficeInfo.workspace}?from=${formattedStartDate}&to=${formattedEndDate}`
      );
      console.log("🚀 ~ checkOfficeAvaliablity ~ response:", response);
    } catch (error) {
      console.log("🚀 ~ checkOfficeAvaliablity ~ error:", error);
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
        // setIsLoading={setLoading}
        checkOffice={checkOfficeAvaliablity}
        workspaces={workspaces}
      />
    ),

    1: <Finished />,
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
              handleNext={
                activeStep === steps.length - 1 ? resetForm : handleNext
              }
              handleBack={resetForm}
              isBackDisabled={activeStep === 0}
              isNextDisabled={activeStep === steps.length - 1}
              isLast={activeStep === 1}
            />
          )}
        </div>
      </div>
    </>
  );
}