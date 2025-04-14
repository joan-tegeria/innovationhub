import React, { useState } from "react";
import { TextField, Button } from "@mui/material";
import styles from "./ContactUs.module.css";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import { useAuth } from "../context/Auth";
import { useFormik } from "formik";
import * as Yup from "yup";

const ContactForm = () => {
  const [open, setOpen] = useState(false);
  const { accessToken, tokenType, tokenLoading } = useAuth();

  // Define validation schema
  const validationSchema = Yup.object({
    name: Yup.string()
      .required("Full name is required")
      .matches(
        /^[A-Za-z]+ [A-Za-z]+(\s[A-Za-z]+)*$/,
        "Please enter your first and last name separated by a space"
      ),
    email: Yup.string()
      .email("Invalid email address")
      .required("Email is required")
      .matches(
        /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/,
        "Please enter a valid email"
      ),
    message: Yup.string().required("Message is required"),
  });

  // Initialize formik
  const formik = useFormik({
    initialValues: {
      name: "",
      email: "",
      message: "",
    },
    validationSchema,
    onSubmit: async (values) => {
      const nameParts = values.name.trim().split(/\s+/);
      const name = nameParts[0];
      const lastName = nameParts.slice(1).join(" ");

      const submitData = {
        ...values,
        name,
        lastName,
        referral: "Contact Us Form",
      };

      try {
        const response = await fetch(
          "https://nhpvz8wphf.execute-api.eu-central-1.amazonaws.com/prod/contact",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `${tokenType} ${accessToken}`,
            },
            body: JSON.stringify(submitData),
          }
        );
        console.log(response);
        formik.resetForm();
        setOpen(true);
      } catch (error) {
        console.error("Error:", error);
        alert("An error occurred. Please try again later.");
      }
    },
  });

  const handleClose = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }

    setOpen(false);
  };

  // Handle email link click for iframe parent window
  const handleEmailClick = (e) => {
    e.preventDefault();
    const emailLink = "mailto:info@hubitat.al";

    // Try to communicate with parent window if in iframe
    if (window.parent !== window) {
      try {
        // Send message to parent window
        window.parent.postMessage({ type: "openEmail", email: emailLink }, "*");
      } catch (error) {
        // Fallback to direct window.open if postMessage fails
        window.open(emailLink, "_blank");
      }
    } else {
      // If not in iframe, open directly
      window.open(emailLink, "_blank");
    }
  };

  const handleTermsRediredct = (e) => {
    e.preventDefault();
    const link = "http://35.176.180.59/terms-of-service/";

    // Try to communicate with parent window if in iframe
    if (window.parent !== window) {
      try {
        // Send message to parent window
        window.parent.postMessage(
          {
            type: "openLInkInside",
            link: "http://35.176.180.59/terms-of-service/",
          },
          "*"
        );
      } catch (error) {
        // Fallback to direct window.open if postMessage fails
        window.open(link);
      }
    } else {
      // If not in iframe, open directly
      window.open(link);
    }
  };

  if (!accessToken) {
    return null;
  }

  return (
    <div className={styles.container}>
      <Snackbar
        open={open}
        autoHideDuration={6000}
        onClose={handleClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={handleClose}
          severity="success"
          variant="filled"
          sx={{ width: "100%" }}
        >
          Your message has been successfully sent! We'll contact you via email.
        </Alert>
      </Snackbar>
      <div className={styles.formTitleContainer}>
        <div className={styles.formSection}>
          <div className={styles.imageContainer}>
            <svg
              width="85"
              height="85"
              viewBox="0 0 85 85"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M46.67 58.7602C46.09 58.7602 45.62 58.2902 45.62 57.7102V52.2702C45.62 51.6902 46.09 51.2202 46.67 51.2202C47.25 51.2202 47.72 51.6902 47.72 52.2702V57.7102C47.72 58.2902 47.25 58.7602 46.67 58.7602Z"
                fill="#6E63AC"
              />
              <path
                d="M36.84 58.5802C36.26 58.5802 35.79 58.1102 35.79 57.5302V52.2702C35.79 51.6902 36.26 51.2202 36.84 51.2202C37.42 51.2202 37.89 51.6902 37.89 52.2702V57.5302C37.89 58.1102 37.42 58.5802 36.84 58.5802Z"
                fill="#6E63AC"
              />
              <path
                d="M50.53 56.48C49.95 56.48 49.48 56.01 49.48 55.43V47.52C49.48 46.94 49.27 46.42 48.88 46.02C48.49 45.63 47.98 45.42 47.43 45.42H45.3L42.67 48.12C42.47 48.32 42.2 48.44 41.92 48.44C41.64 48.44 41.37 48.33 41.17 48.13L38.69 45.61H36.24C36.24 45.61 36.21 45.61 36.19 45.61C35.67 45.58 35.16 45.77 34.76 46.13C34.33 46.52 34.07 47.08 34.03 47.68V55.45C34.03 56.03 33.56 56.5 32.98 56.5C32.4 56.5 31.93 56.03 31.93 55.45V47.66C31.93 47.66 31.93 47.63 31.93 47.61C31.98 46.45 32.5 45.35 33.34 44.58C34.14 43.85 35.18 43.47 36.25 43.52H39.12C39.4 43.52 39.67 43.63 39.87 43.83L41.9 45.9L44.09 43.66C44.29 43.46 44.56 43.34 44.84 43.34H47.36C48.47 43.32 49.54 43.75 50.34 44.55C51.14 45.35 51.58 46.41 51.56 47.55V55.45C51.56 56.03 51.09 56.5 50.51 56.5"
                fill="#6E63AC"
              />
              <path
                d="M41.75 41.9102C39.14 41.9102 37.02 39.7902 37.02 37.1802C37.02 34.5702 39.14 32.4502 41.75 32.4502C44.36 32.4502 46.48 34.5702 46.48 37.1802C46.48 39.7902 44.36 41.9102 41.75 41.9102ZM41.75 34.5402C40.3 34.5402 39.12 35.7202 39.12 37.1702C39.12 38.6202 40.3 39.8002 41.75 39.8002C43.2 39.8002 44.38 38.6202 44.38 37.1702C44.38 35.7202 43.2 34.5402 41.75 34.5402Z"
                fill="#6E63AC"
              />
              <path
                d="M42.02 59.6301C32.3 59.6301 24.39 51.7201 24.39 42.0001C24.39 32.2801 32.3 24.3701 42.02 24.3701C51.74 24.3701 59.65 32.2801 59.65 42.0001C59.65 51.7201 51.74 59.6301 42.02 59.6301ZM42.02 26.4701C33.46 26.4701 26.49 33.4401 26.49 42.0001C26.49 50.5601 33.46 57.5301 42.02 57.5301C50.58 57.5301 57.55 50.5601 57.55 42.0001C57.55 33.4401 50.58 26.4701 42.02 26.4701Z"
                fill="#6E63AC"
              />
              <path
                d="M41.93 73.4899C41.35 73.4899 40.88 73.0199 40.88 72.4399V67.1799C40.88 66.5999 41.35 66.1299 41.93 66.1299C42.51 66.1299 42.98 66.5999 42.98 67.1799V72.4399C42.98 73.0199 42.51 73.4899 41.93 73.4899Z"
                fill="#6E63AC"
              />
              <path
                d="M41.93 84.0199C38.45 84.0199 35.62 81.1899 35.62 77.7099C35.62 74.2299 38.45 71.3999 41.93 71.3999C45.41 71.3999 48.24 74.2299 48.24 77.7099C48.24 81.1899 45.41 84.0199 41.93 84.0199ZM41.93 73.4899C39.61 73.4899 37.72 75.3799 37.72 77.6999C37.72 80.0199 39.61 81.9099 41.93 81.9099C44.25 81.9099 46.14 80.0199 46.14 77.6999C46.14 75.3799 44.25 73.4899 41.93 73.4899Z"
                fill="#6E63AC"
              />
              <path
                d="M41.93 17.88C41.35 17.88 40.88 17.41 40.88 16.83V11.57C40.88 10.99 41.35 10.52 41.93 10.52C42.51 10.52 42.98 10.99 42.98 11.57V16.83C42.98 17.41 42.51 17.88 41.93 17.88Z"
                fill="#6E63AC"
              />
              <path
                d="M41.93 12.62C38.45 12.62 35.62 9.79 35.62 6.31C35.62 2.83 38.45 0 41.93 0C45.41 0 48.24 2.83 48.24 6.31C48.24 9.79 45.41 12.62 41.93 12.62ZM41.93 2.09C39.61 2.09 37.72 3.98 37.72 6.3C37.72 8.62 39.61 10.51 41.93 10.51C44.25 10.51 46.14 8.62 46.14 6.3C46.14 3.98 44.25 2.09 41.93 2.09Z"
                fill="#6E63AC"
              />
              <path
                d="M16.84 44.7201H11.58C11 44.7201 10.53 44.2501 10.53 43.6701C10.53 43.0901 11 42.6201 11.58 42.6201H16.84C17.42 42.6201 17.89 43.0901 17.89 43.6701C17.89 44.2501 17.42 44.7201 16.84 44.7201Z"
                fill="#6E63AC"
              />
              <path
                d="M6.31003 49.9799C2.83003 49.9799 0 47.1499 0 43.6699C0 40.1899 2.83003 37.3599 6.31003 37.3599C9.79003 37.3599 12.62 40.1899 12.62 43.6699C12.62 47.1499 9.79003 49.9799 6.31003 49.9799ZM6.31003 39.4499C3.99003 39.4499 2.10001 41.3399 2.10001 43.6599C2.10001 45.9799 3.99003 47.8699 6.31003 47.8699C8.63003 47.8699 10.52 45.9799 10.52 43.6599C10.52 41.3399 8.63003 39.4499 6.31003 39.4499Z"
                fill="#6E63AC"
              />
              <path
                d="M72.46 44.7201H67.2C66.62 44.7201 66.15 44.2501 66.15 43.6701C66.15 43.0901 66.62 42.6201 67.2 42.6201H72.46C73.04 42.6201 73.51 43.0901 73.51 43.6701C73.51 44.2501 73.04 44.7201 72.46 44.7201Z"
                fill="#6E63AC"
              />
              <path
                d="M77.72 49.9799C74.24 49.9799 71.41 47.1499 71.41 43.6699C71.41 40.1899 74.24 37.3599 77.72 37.3599C81.2 37.3599 84.03 40.1899 84.03 43.6699C84.03 47.1499 81.2 49.9799 77.72 49.9799ZM77.72 39.4499C75.4 39.4499 73.51 41.3399 73.51 43.6599C73.51 45.9799 75.4 47.8699 77.72 47.8699C80.04 47.8699 81.93 45.9799 81.93 43.6599C81.93 41.3399 80.04 39.4499 77.72 39.4499Z"
                fill="#6E63AC"
              />
              <path
                d="M20.54 64.5602C20.27 64.5602 20 64.4602 19.8 64.2502C19.39 63.8402 19.39 63.1702 19.8 62.7702L23.52 59.0502C23.93 58.6402 24.6 58.6402 25 59.0502C25.41 59.4602 25.41 60.1202 25 60.5302L21.28 64.2502C21.08 64.4602 20.81 64.5602 20.54 64.5602Z"
                fill="#6E63AC"
              />
              <path
                d="M16.66 73.4902C15.04 73.4902 13.43 72.8702 12.2 71.6402C9.74001 69.1802 9.74001 65.1702 12.2 62.7102C14.66 60.2502 18.67 60.2502 21.13 62.7102C23.59 65.1702 23.59 69.1802 21.13 71.6402C19.9 72.8702 18.28 73.4902 16.67 73.4902M16.67 62.9702C15.59 62.9702 14.5101 63.3802 13.6901 64.2002C12.0501 65.8402 12.0501 68.5202 13.6901 70.1602C15.3301 71.8002 18.01 71.8002 19.65 70.1602C21.29 68.5202 21.29 65.8402 19.65 64.2002C18.83 63.3802 17.75 62.9702 16.67 62.9702Z"
                fill="#6E63AC"
              />
              <path
                d="M59.89 25.1998C59.62 25.1998 59.35 25.0998 59.15 24.8898C58.74 24.4798 58.74 23.8098 59.15 23.4098L62.87 19.6898C63.28 19.2798 63.95 19.2798 64.35 19.6898C64.76 20.0998 64.76 20.7598 64.35 21.1698L60.63 24.8898C60.43 25.0998 60.16 25.1998 59.89 25.1998Z"
                fill="#6E63AC"
              />
              <path
                d="M67.1901 22.96C65.5701 22.96 63.96 22.34 62.73 21.11C60.27 18.65 60.27 14.64 62.73 12.18C65.19 9.71996 69.2 9.71996 71.66 12.18C74.12 14.64 74.12 18.65 71.66 21.11C70.43 22.34 68.81 22.96 67.2 22.96M64.22 19.63C65.86 21.27 68.5301 21.27 70.1801 19.63C71.8201 17.99 71.8201 15.31 70.1801 13.67C68.5401 12.03 65.86 12.03 64.22 13.67C62.58 15.31 62.58 17.99 64.22 19.63Z"
                fill="#6E63AC"
              />
              <path
                d="M23.01 26.4401C22.74 26.4401 22.47 26.3401 22.27 26.1301L18.55 22.4101C18.14 22.0001 18.14 21.3301 18.55 20.9301C18.96 20.5201 19.63 20.5201 20.03 20.9301L23.75 24.6501C24.16 25.0601 24.16 25.7201 23.75 26.1301C23.55 26.3401 23.28 26.4401 23.01 26.4401Z"
                fill="#6E63AC"
              />
              <path
                d="M15.4401 24.1899C13.8201 24.1899 12.21 23.5699 10.98 22.3399C8.52004 19.8799 8.52004 15.8699 10.98 13.4099C13.44 10.9499 17.45 10.9499 19.91 13.4099C22.37 15.8699 22.37 19.8799 19.91 22.3399C18.68 23.5699 17.06 24.1899 15.45 24.1899M15.45 13.6699C14.37 13.6699 13.29 14.0799 12.47 14.8999C10.83 16.5399 10.83 19.2199 12.47 20.8599C14.11 22.4999 16.7901 22.4999 18.4301 20.8599C20.0701 19.2199 20.0701 16.5399 18.4301 14.8999C17.6101 14.0799 16.53 13.6699 15.45 13.6699Z"
                fill="#6E63AC"
              />
              <path
                d="M62.37 65.7999C62.1 65.7999 61.83 65.6999 61.63 65.4899L57.91 61.7699C57.5 61.3599 57.5 60.6899 57.91 60.2899C58.32 59.8799 58.99 59.8799 59.39 60.2899L63.11 64.0099C63.52 64.4199 63.52 65.0799 63.11 65.4899C62.91 65.6999 62.64 65.7999 62.37 65.7999Z"
                fill="#6E63AC"
              />
              <path
                d="M65.96 74.7202C64.34 74.7202 62.7301 74.1002 61.5001 72.8702C59.0401 70.4102 59.0401 66.4002 61.5001 63.9402C63.9601 61.4802 67.9701 61.4802 70.4301 63.9402C72.8901 66.4002 72.8901 70.4102 70.4301 72.8702C69.2001 74.1002 67.58 74.7202 65.97 74.7202M65.97 64.2002C64.89 64.2002 63.8101 64.6102 62.9901 65.4302C61.3501 67.0702 61.3501 69.7502 62.9901 71.3902C64.6301 73.0302 67.31 73.0302 68.95 71.3902C70.59 69.7502 70.59 67.0702 68.95 65.4302C68.13 64.6102 67.05 64.2002 65.97 64.2002Z"
                fill="#6E63AC"
              />
            </svg>
          </div>
          <h1 className={styles.formTitle}>
            Join Our Habitat <br /> Let's Connect
          </h1>
          <p style={{ fontSize: "14px", lineHeight: "20px" }}>
            We're here to support your journey — whether it's finding the
            perfect workspace, hosting impactful events, or fostering
            connections with like-minded innovators. Reach out to discover how
            we can help you thrive.
          </p>
        </div>
      </div>
      <div className={styles.formBody}>
        <form id="contact-form" onSubmit={formik.handleSubmit}>
          <TextField
            id="name"
            label="Full Name"
            variant="outlined"
            fullWidth
            required
            margin="normal"
            value={formik.values.name}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.name && Boolean(formik.errors.name)}
            helperText={formik.touched.name && formik.errors.name}
            placeholder="First Last"
            sx={{
              "& .MuiInputBase-root": {
                fontFamily: "Termina, sans-serif",
              },
              "& .MuiInputLabel-root": {
                fontFamily: "Termina, sans-serif",
              },
              "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline":
                {
                  borderColor: "black",
                },
              "& .MuiInputLabel-root.Mui-focused": {
                color: "black",
              },
            }}
          />
          <TextField
            id="email"
            type="email"
            label="Email"
            variant="outlined"
            fullWidth
            required
            margin="normal"
            value={formik.values.email}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.email && Boolean(formik.errors.email)}
            helperText={formik.touched.email && formik.errors.email}
            sx={{
              "& .MuiInputBase-root": {
                fontFamily: "Termina, sans-serif",
              },
              "& .MuiInputLabel-root": {
                fontFamily: "Termina, sans-serif",
              },
              "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline":
                {
                  borderColor: "black",
                },
              "& .MuiInputLabel-root.Mui-focused": {
                color: "black",
              },
            }}
          />
          <TextField
            id="message"
            label="Message"
            multiline
            rows={1}
            variant="outlined"
            fullWidth
            required
            margin="normal"
            value={formik.values.message}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.message && Boolean(formik.errors.message)}
            helperText={formik.touched.message && formik.errors.message}
            sx={{
              "& .MuiInputBase-root": {
                fontFamily: "Termina, sans-serif",
              },
              "& .MuiInputLabel-root": {
                fontFamily: "Termina, sans-serif",
              },
              "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline":
                {
                  borderColor: "black",
                },
              "& .MuiInputLabel-root.Mui-focused": {
                color: "black",
              },
            }}
          />
          <p className={styles.terms} style={{ cursor: "pointer" }}>
            By clicking the button below, you agree to our{" "}
            <a onClick={handleTermsRediredct}>Terms of Service</a>.
          </p>
          <Button
            type="submit"
            variant="contained"
            color="white"
            fullWidth
            sx={{
              backgroundColor: "#EB3778",
              color: "white",
              "&:hover": {
                backgroundColor: "#FF5486",
                boxShadow: "none",
              },
              height: "48px",
              textTransform: "none",
              boxShadow: "none",
              fontFamily: "Termina Test",
            }}
          >
            Send message
          </Button>
        </form>
        <p className={styles.email}>
          Or send us an email at{" "}
          <a href="#" onClick={handleEmailClick}>
            info@hubitat.al
          </a>
        </p>
      </div>
    </div>
  );
};

export default ContactForm;
