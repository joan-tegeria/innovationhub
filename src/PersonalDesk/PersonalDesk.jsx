import React, { useState } from "react";
import styles from "./PersonalDesk.module.css";
import Information from "./Information";
import Footer from "./Footer";
import axios from "axios";
import Stepper from "@mui/material/Stepper";
import Step from "@mui/material/Step";
import StepLabel from "@mui/material/StepLabel";
import StepConnector from "@mui/material/StepConnector";
import { styled } from "@mui/material/styles";
import { useBooking } from "../context/BookingContext";
import Payment from "./Payment";
import Modal from "./Modal";
import dayjs from "dayjs";
import Finished from "./Finished";
const steps = ["Information", "Payment", "Finished"];

// Styled components
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
      color: "#4FB2BF", // Active step color
    },
    "&.Mui-completed": {
      color: "#4FB2BF", // Completed step color
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

const formatDate = (dateObj) => {
  const formattedDate = dateObj.format("YYYY-MM-DDTHH:mm:ssZ");

  return formattedDate;
};

function calculateEndDate(startDate, timePeriodValue) {
  // Ensure startDate is a Day.js object (if it's not already)
  let date = dayjs(startDate);

  switch (timePeriodValue) {
    case "24 Hours":
      date = date.add(24, "hour"); // Add 24 hours
      break;
    case "1 Week":
      date = date.add(1, "week"); // Add 1 week
      break;
    case "1 Month":
      date = date.add(1, "month"); // Add 1 month
      break;
    default:
      console.log("Invalid time period");
      return null;
  }

  // Return the updated date as a Day.js object
  return date;
}

export default function PersonalDesk() {
  const [price, setPrice] = useState(5000);
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const {
    personalDeskUserInfo,
    setPersonalDeskUserInfo,
    period,
    handlePersonalDesk,
  } = useBooking();
  const [open, setOpen] = useState(true);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);
  const checkOfficeAvaliablity = async ({ startDate }) => {
    try {
      const allOffices = await axios.get(
        "https://8ey3ox6oxi.execute-api.eu-central-1.amazonaws.com/prod/leads/shared"
      );
      const allOfficesArray = allOffices.data.data;
      const randomIndex = Math.floor(Math.random() * allOfficesArray.length);

      // Get the ID of the randomly selected office
      const randomOfficeId = allOfficesArray[randomIndex].id;
      handlePersonalDesk("workspace", allOfficesArray[randomIndex]?.Name);
      const fromDate = dayjs(startDate);
      handlePersonalDesk("selectDate", fromDate.format("D MMMM YYYY"));
      const toDate = calculateEndDate(fromDate, period);
      const endDate = dayjs(personalDeskUserInfo.toDate);
      handlePersonalDesk("endDate", endDate.format("D MMMM YYYY"));

      const roomavaliablity = await axios.get(
        `https://8ey3ox6oxi.execute-api.eu-central-1.amazonaws.com/prod/leads/shared/${randomOfficeId}?from=${startDate}&to=${formatDate(
          toDate
        )}`
      );
      console.log(
        "🚀 ~ checkOfficeAvaliablity ~ roomavaliablity:",
        roomavaliablity.data.availableSeats
      );
    } catch (error) {
      console.log("🚀 ~ checkOfficeAvaliablity ~ error:", error);
    }
  };

  const createUser = async () => {
    setLoading(true);
    const userData = {
      name: personalDeskUserInfo.firstName,
      lastName: personalDeskUserInfo.lastName,
      email: personalDeskUserInfo.email,
      company: "No Company/Personal",
      phone: "000",
      birthday: "",
      address: "Tirana",
      state: "Tirana",
      city: "Tirana",
      country: "Albania",
      code: "1001",
    };
    console.log("🚀 ~ createUser ~ userData:", userData);

    try {
      // Create user
      const response = await axios.post(
        "https://8ey3ox6oxi.execute-api.eu-central-1.amazonaws.com/prod/account",
        userData
      );
      console.log("🚀 ~ createUser ~ response:", response);
      setLoading(false);
      setActiveStep((prevActiveStep) => prevActiveStep + 1);
    } catch (err) {
      setLoading(false);
      console.log(err);
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

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Information
            loading={loading}
            setIsLoading={setLoading}
            checkOffice={checkOfficeAvaliablity}
          />
        );
      case 1:
        return <Payment loading={loading} setIsLoading={setLoading} />;
      case 2:
        return <Finished />;
      default:
        return (
          <Information
            loading={loading}
            setIsLoading={setLoading}
            checkOffice={checkOfficeAvaliablity}
          />
        );
    }
  };

  return (
    <>
      <Modal open={open} onClose={handleClose} title={"Error"} isError={true}>
        <div>Hello Wolrd</div>
      </Modal>
      <div className={styles.container}>
        <div className={styles.formContainer}>
          <div className={styles.formTitle}>
            <span className={styles.title}>Book now</span>
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
            {renderStepContent(activeStep)}
          </div>

          {/* Footer */}
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
