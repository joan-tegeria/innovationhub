import React from "react";
import styles from "./LabeledInput.module.css";
import TextField from "@mui/material/TextField";
import { DatePicker } from "@mui/x-date-pickers";
export default function LabeledInput({
  label,
  isRequired = false,
  onChange,
  placeholder,
  type = "text",
}) {
  return (
    <div className={styles.container}>
      <span className={styles.label}>{label || "Label"}</span>
      {type === "date" ? (
        <DatePicker onChange={onChange} />
      ) : (
        <TextField
          onChange={onChange}
          required={isRequired}
          placeholder={placeholder || "Placeholder"}
        />
      )}
    </div>
  );
}
