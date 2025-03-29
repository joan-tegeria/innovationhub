import React, { useState } from "react";
import styles from "./LabeledInput.module.css";
import TextField from "@mui/material/TextField";
import { DatePicker, TimePicker } from "@mui/x-date-pickers";
import dayjs from "dayjs";
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
  minDate,
  maxDate,
  // setValue,
}) {
  const [error, setError] = useState(false);

  const formattedMinDate = minDate ? dayjs(minDate) : null;
  const formattedMaxDate = maxDate ? dayjs(maxDate) : null;

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
    } else if (
      isRequired &&
      (typeof value === "string" ? value.trim() === "" : !value)
    ) {
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
      type={type === "number" ? "number" : "text"}
      inputProps={type === "number" ? { min: 1 } : {}}
    />
  );
  switch (type) {
    case "date":
      input = (
        <DatePicker
          onChange={(date) => {
            if (date && dayjs(date).isValid()) {
              onChange(dayjs(date));
            } else {
              console.warn("Invalid date selected:", date);
              onChange(null);
            }
          }}
          disableScrollLock={true}
          minDate={formattedMinDate}
          maxDate={formattedMaxDate}
          PopperProps={{
            disablePortal: true,
            modifiers: [
              {
                name: "preventOverflow",
                enabled: true,
                options: {
                  altAxis: true,
                  altBoundary: true,
                  tether: false,
                  rootBoundary: "document",
                  padding: 8,
                },
              },
            ],
          }}
        />
      );
      break;
    case "time":
      input = (
        <TimePicker
          value={value ? dayjs(value, "HH:mm") : null}
          onChange={onChange}
          ampm={false}
          format="HH:mm"
          disableScrollLock={true}
          PopperProps={{
            disablePortal: true,
            modifiers: [
              {
                name: "preventOverflow",
                enabled: true,
                options: {
                  altAxis: true,
                  altBoundary: true,
                  tether: false,
                  rootBoundary: "document",
                  padding: 8,
                },
              },
            ],
          }}
        />
      );
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
