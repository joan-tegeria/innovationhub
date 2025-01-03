import React, { useState } from "react";
import { TextField, Button } from "@mui/material";
import styles from "./ContactUs.module.css";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";

const ContactForm = () => {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    lastName: "",
    email: "",
    message: "",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const submitData = {
      ...formData,
      referral: "Contact Us Form",
    };

    try {
      const response = await fetch(
        "https://8ey3ox6oxi.execute-api.eu-central-1.amazonaws.com/prod/contact",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(submitData),
        }
      );
      setFormData({ name: "", lastName: "", email: "", message: "" });
      setOpen(true);
    } catch (error) {
      console.error("Error:", error);
      alert("An error occurred. Please try again later.");
    }
  };

  const handleClose = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }

    setOpen(false);
  };

  return (
    <div className={styles.container}>
      <Snackbar open={open} autoHideDuration={6000} onClose={handleClose}>
        <Alert
          onClose={handleClose}
          severity="success"
          variant="filled"
          sx={{ width: "100%" }}
        >
          Message Sent!
        </Alert>
      </Snackbar>
      <div className={styles.formSection}>
        <h1 className={styles.formTitle}>Join Our Habitat – Let's Connect</h1>
        <p>
          No matter your budget or needs, we make it simple to find the ideal
          workspace.
        </p>
        <form id="contact-form" onSubmit={handleSubmit}>
          <TextField
            id="name"
            label="First Name"
            variant="outlined"
            fullWidth
            required
            margin="normal"
            value={formData.name}
            onChange={handleChange}
          />
          <TextField
            id="lastName"
            label="Last Name"
            variant="outlined"
            fullWidth
            required
            margin="normal"
            value={formData.lastName}
            onChange={handleChange}
          />
          <TextField
            id="email"
            type="email"
            label="Email"
            variant="outlined"
            fullWidth
            required
            margin="normal"
            value={formData.email}
            onChange={handleChange}
          />
          <TextField
            id="message"
            label="Message"
            multiline
            rows={4}
            variant="outlined"
            fullWidth
            required
            margin="normal"
            value={formData.message}
            onChange={handleChange}
          />
          <p className={styles.terms}>
            By clicking the button below, you agree to our{" "}
            <a href="#">Terms of Service</a>.
          </p>
          <Button
            type="submit"
            variant="contained"
            color="white"
            fullWidth
            sx={{
              backgroundColor: "#6E63AC",
              color: "white",
              "&:hover": {
                backgroundColor: "#6E63BC",
              },
              height: "48px",
            }}
          >
            Send message
          </Button>
        </form>
        <p className={styles.email}>
          Or send us an email at{" "}
          <a href="mailto:contact@innovationhub.al">contact@innovationhub.al</a>
        </p>
      </div>
      <div className={styles.imageSection}></div>
    </div>
  );
};

export default ContactForm;
