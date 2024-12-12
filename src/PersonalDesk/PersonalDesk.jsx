import React, { useState } from "react";
import styles from "./PersonalDesk.module.css";
import Information from "./Information";
import Footer from "./Footer";

import Stepper from "@mui/material/Stepper";
import Step from "@mui/material/Step";
import StepLabel from "@mui/material/StepLabel";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";

const steps = ["Information", "Payment", "Finished"];

export default function PersonalDesk() {
  const [price, setPrice] = useState(5000);
  const [activeStep, setActiveStep] = useState(0);

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleReset = () => {
    setActiveStep(0);
  };

  return (
    <div className={styles.container}>
      <div className={styles.formContainer}>
        <div className={styles.formTitle}>
          <span className={styles.title}>Book now</span>
          <p className={styles.desc}>
            Reserve your ideal space today, designed for productivity and
            tailored to your needs. Enjoy perks like reliable high-speed Wi-Fi,
            fully equipped meeting rooms, and a comfortable, professional
            environment where you can thrive.
          </p>
        </div>

        {/* Stepper */}
        <div className={styles.stepper}>
          <Stepper activeStep={activeStep} alternativeLabel>
            {steps.map((label, index) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </div>

        {/* Step Content */}
        <div>
          {activeStep === steps.length ? (
            <div>
              <Typography sx={{ mt: 2, mb: 1 }}>
                All steps completed - you're finished!
              </Typography>
              <Button onClick={handleReset} variant="outlined">
                Reset
              </Button>
            </div>
          ) : (
            <div>
              <Typography sx={{ mt: 2, mb: 1 }}>
                Step {activeStep + 1}: {steps[activeStep]}
              </Typography>
              <div>
                <Button
                  disabled={activeStep === 0}
                  onClick={handleBack}
                  sx={{ mt: 1, mr: 1 }}
                >
                  Back
                </Button>
                <Button
                  onClick={handleNext}
                  variant="contained"
                  sx={{ mt: 1, mr: 1 }}
                >
                  {activeStep === steps.length - 1 ? "Finish" : "Next"}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Other Components */}
        <Information />
        <Footer price={price} />
      </div>
    </div>
  );
}
