import React, { useState } from "react";
import styles from "./LabeledInput.module.css";
import TextField from "@mui/material/TextField";
import { DatePicker } from "@mui/x-date-pickers";
// import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";

export default function LabeledInput({
  label,
  isRequired = false,
  onChange,
  placeholder,
  type = "text",
  items = [],
  selectValue,
  regex,
  value = "",
  // setValue,
}) {
  const [error, setError] = useState(false);

  const handleChange = (e) => {
    const newValue = e;
    if (typeof onChange === "function") {
      onChange(newValue); 
    } else {
      console.warn("setValue is not a function");
    }
    onChange && onChange(e);

    if (isRequired && newValue.target.value.trim() === "") {
      setError(true);
    } else {
      setError(false);
    }
  };

  const handleBlur = () => {
    if (regex && !regex.test(value)) {
      setError(true);
    } else if (isRequired && value.trim() === "") {
      setError(true);
    } else {
      setError(false);
    }
  };

  let input = (
    <TextField
      value={value}
      onChange={handleChange}
      required={isRequired}
      onBlur={handleBlur}
      placeholder={placeholder || "Placeholder"}
      error={error}
      // helperText={error ? "This field is required" : ""}
    />
  );
  switch (type) {
    case "date":
      input = <DatePicker onChange={onChange} />;
      break;
    case "select":
      input = (
        <FormControl fullWidth>
          <Select value={selectValue} onChange={handleChange} displayEmpty>
            {items.map((item, index) => {
              return (
                <MenuItem key={index} value={item.value}>
                  {item.label}
                </MenuItem>
              );
            })}
          </Select>
        </FormControl>
      );
      break;
  }

  return (
    <div className={styles.container}>
      <span className={styles.label}>{label || "Label"}</span>
      {input}
    </div>
  );
}
