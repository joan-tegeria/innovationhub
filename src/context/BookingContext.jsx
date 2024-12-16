import React, { createContext, useState, useContext } from "react";

const BookingContext = createContext();

export default function BookingProvider({ children }) {
  const [period, setPeriod] = useState("24 Hours");
  const [personalDeskUserInfo, setPersonalDeskUserInfo] = useState({
    selectDate: "",
    endDate: "",
    firstName: "",
    lastName: "",
    birthday: "",
    idNumber: "",
    email: "",
    totalToPay: 5000,
    workspace: "",
  });

  const handlePersonalDesk = (field, value) => {
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
