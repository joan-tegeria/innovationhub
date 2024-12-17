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
}) {
  console.log("🚀 ~ items:", items);
  const [value, setValue] = useState("");
  const [error, setError] = useState(false);

  const handleChange = (e) => {
    const newValue = e.target.value;
    setValue(newValue);
    onChange && onChange(e);

    if (isRequired && newValue.trim() === "") {
      console.log(" i AM NOT BEING FILLED I AM SUPPOSED TO BE ERROR");
      setError(true);
    } else {
      setError(false);
    }
  };

  const handleBlur = () => {
    if (regex && !regex.test(value)) {
      console.log("🚀 ~ handleBlur ~ regex:", regex);
      console.log(" I AM A REGEX ERROR");
      setError(true);
    } else if (isRequired && value.trim() === "") {
      console.log(" i AM NOT BEING FILLED I AM SUPPOSED TO BE ERROR");
      setError(true);
    } else {
      console.log(" I AM NO ERROR");
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
