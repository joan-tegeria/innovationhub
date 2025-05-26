import { useState, useEffect } from "react";
import styles from "./PhoneInput.module.css";
// Country data with flag emojis, country codes, and dial codes
const countries = [
  { code: "AL", name: "Albania", dialCode: "+355", flag: "🇦🇱" },
  { code: "US", name: "United States", dialCode: "+1", flag: "🇺🇸" },
  { code: "GB", name: "United Kingdom", dialCode: "+44", flag: "🇬🇧" },
  { code: "DE", name: "Germany", dialCode: "+49", flag: "🇩🇪" },
  { code: "FR", name: "France", dialCode: "+33", flag: "🇫🇷" },
  { code: "IT", name: "Italy", dialCode: "+39", flag: "🇮🇹" },
  { code: "ES", name: "Spain", dialCode: "+34", flag: "🇪🇸" },
  { code: "GR", name: "Greece", dialCode: "+30", flag: "🇬🇷" },
  // Add more countries as needed
];

const PhoneInput = ({
  values,
  errors,
  touched,
  handleChange,
  setFieldValue,
}) => {
  // Find Albania by default
  const defaultCountry = countries.find((country) => country.code === "AL");
  const [selectedCountry, setSelectedCountry] = useState(defaultCountry);
  const [phoneNumber, setPhoneNumber] = useState("");

  // When the country changes, update the full phone number
  useEffect(() => {
    updateFullPhoneNumber(phoneNumber);
  }, [selectedCountry]);

  // When component mounts, set the default country code in the form values
  useEffect(() => {
    if (!values.phoneNumber) {
      setFieldValue("phoneNumber", selectedCountry.dialCode + " ");
    } else if (values.phoneNumber && !values.phoneNumber.includes("+")) {
      // If there's a value but no country code, add the default one
      setFieldValue(
        "phoneNumber",
        selectedCountry.dialCode + " " + values.phoneNumber
      );
    } else {
      // Extract the phone number part (without country code)
      const numberParts = values.phoneNumber.split(" ");
      if (numberParts.length > 1) {
        setPhoneNumber(numberParts.slice(1).join(" "));
      }

      // Find and set the selected country based on dial code
      const dialCode = numberParts[0];
      const country = countries.find((c) => c.dialCode === dialCode);
      if (country) {
        setSelectedCountry(country);
      }
    }
  }, []);

  const handleCountryChange = (e) => {
    const countryCode = e.target.value;
    const country = countries.find((c) => c.code === countryCode);
    setSelectedCountry(country);
  };

  const handlePhoneNumberChange = (e) => {
    const value = e.target.value;
    setPhoneNumber(value);
    updateFullPhoneNumber(value);
  };

  const updateFullPhoneNumber = (number) => {
    // Combine country code with phone number
    setFieldValue("phoneNumber", `${selectedCountry.dialCode} ${number}`);
  };

  return (
    <div className={styles.formGroup}>
      <label htmlFor="phoneNumber" className={styles.label}>
        Phone Number
      </label>
      <div style={{ display: "flex", gap: "8px" }}>
        <div style={{ width: "120px" }}>
          <select
            value={selectedCountry.code}
            onChange={handleCountryChange}
            className={styles.select}
            style={{ width: "100%", paddingRight: "8px" }}
          >
            {countries.map((country) => (
              <option key={country.code} value={country.code}>
                {country.flag} {country.dialCode}
              </option>
            ))}
          </select>
        </div>
        <input
          type="tel"
          id="phoneNumber"
          name="phoneNumberInput"
          // value={phoneNumber}
          // onChange={handlePhoneNumberChange}
          className={styles.input}
          placeholder="Phone Number"
          autoComplete="tel"
          style={{ flexGrow: 1 }}
        />
      </div>
      {errors.phoneNumber && touched.phoneNumber && (
        <div className={styles.error}>{errors.phoneNumber}</div>
      )}
    </div>
  );
};

export default PhoneInput;
