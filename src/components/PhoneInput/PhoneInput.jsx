import React, { useState, useRef, useEffect } from "react";
import PropTypes from "prop-types";
import "./PhoneInput.css";

const PhoneInput = ({
  value = "",
  onChange,
  placeholder = "Phone number",
  name = "phone",
  id = "phone-input",
  required = false,
  disabled = false,
  className = "",
}) => {
  // Countries with their codes - can be expanded
  const countries = [
    { code: "+44", name: "United Kingdom", flag: "🇬🇧" },
    { code: "+1", name: "United States", flag: "🇺🇸" },
    { code: "+49", name: "Germany", flag: "🇩🇪" },
    { code: "+33", name: "France", flag: "🇫🇷" },
    { code: "+39", name: "Italy", flag: "🇮🇹" },
    { code: "+34", name: "Spain", flag: "🇪🇸" },
    { code: "+7", name: "Russia", flag: "🇷🇺" },
  ];

  // Parse initial value
  const parseInitialValue = (initialValue) => {
    for (const country of countries) {
      if (initialValue?.startsWith(country.code)) {
        return {
          countryCode: country.code,
          phoneNumber: initialValue.substring(country.code.length).trim(),
        };
      }
    }
    // Default to UK code if no match
    return { countryCode: "+44", phoneNumber: initialValue || "" };
  };

  const parsedValue = parseInitialValue(value);
  const [countryCode, setCountryCode] = useState(parsedValue.countryCode);
  const [phoneNumber, setPhoneNumber] = useState(parsedValue.phoneNumber);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  // Close the dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }

    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownOpen]);

  // Format the phone number to only allow digits
  const formatNumber = (input) => {
    return input.replace(/[^\d]/g, "");
  };

  const handlePhoneNumberChange = (e) => {
    const formattedNumber = formatNumber(e.target.value);
    setPhoneNumber(formattedNumber);

    if (onChange) {
      onChange({
        target: {
          name,
          value: `${countryCode}${formattedNumber}`,
        },
      });
    }
  };

  const handleCountryCodeChange = (code) => {
    setCountryCode(code);
    setIsDropdownOpen(false);

    if (onChange) {
      onChange({
        target: {
          name,
          value: `${code}${phoneNumber}`,
        },
      });
    }

    // Focus the input field after selecting a country
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <div className={`phone-input-container ${className}`}>
      <div className="phone-input-wrapper">
        <div className="country-code-selector" ref={dropdownRef}>
          <button
            type="button"
            className="country-code-button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            disabled={disabled}
          >
            <span>{countryCode}</span>
            <span className="dropdown-arrow">▼</span>
          </button>

          {isDropdownOpen && (
            <div className="country-dropdown">
              {countries.map((country) => (
                <button
                  key={country.code}
                  type="button"
                  className={`country-option ${
                    country.code === countryCode ? "selected" : ""
                  }`}
                  onClick={() => handleCountryCodeChange(country.code)}
                >
                  <span className="country-flag">{country.flag}</span>
                  <span>
                    {country.code} {country.name}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <input
          type="tel"
          id={id}
          name={name}
          value={phoneNumber}
          onChange={handlePhoneNumberChange}
          placeholder={placeholder}
          className="phone-number-input"
          disabled={disabled}
          required={required}
          ref={inputRef}
        />
      </div>
    </div>
  );
};

PhoneInput.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func,
  placeholder: PropTypes.string,
  name: PropTypes.string,
  id: PropTypes.string,
  required: PropTypes.bool,
  disabled: PropTypes.bool,
  className: PropTypes.string,
};

export default PhoneInput;
