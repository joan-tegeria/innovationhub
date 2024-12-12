import React, { createContext, useState, useContext } from "react";

const BookingContext = createContext();

export default function BookingProvider({ children }) {
  const [period, setPeriod] = useState("24 Hours");
  const [personalDeskUserInfo, setPersonalDeskUserInfo] = useState({
    selectDate: "",
    firstName: "",
    lastName: "",
    birthday: "",
    idNumber: "",
    email: "",
    totalToPay: 5000,
  });

  const handlePersonalDesk = (field, value) => {
    console.log("🚀 ~ handlePersonalDesk ~ value:", value);
    console.log("🚀 ~ handlePersonalDesk ~ field:", field);
    setPersonalDeskUserInfo((prevState) => ({
      ...prevState,
      [field]: value,
    }));
  };

  return (
    <BookingContext.Provider
      value={{
        personalDeskUserInfo,
        handlePersonalDesk,
        period,
        setPeriod,
        setPersonalDeskUserInfo,
      }}
    >
      {children}
    </BookingContext.Provider>
  );
}

export const useBooking = () => useContext(BookingContext);
