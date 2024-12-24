import React, { createContext, useState, useContext, useEffect } from "react";

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

  const [fullOfficeInfo, setFullOfficeInfo] = useState({
    selectDate: "",
    endDate: "",
    businessName: "",
    nipt: "",
    businessSize: "",
    email: "",
    street: "",
    city: "",
    workspace: "",
    phoneNumber: "",
  });

  const handleFullOffice = (field, value) => {
    setFullOfficeInfo((prevState) => ({
      ...prevState,
      [field]: value,
    }));
  };

  const handlePersonalDesk = (field, value) => {
    setPersonalDeskUserInfo((prevState) => ({
      ...prevState,
      [field]: value,
    }));
  };

  useEffect(() => {
    // Check if 'localData' exists in localStorage
    const localData = localStorage.getItem("localData");

    if (localData) {
      // Parse the localStorage data (assuming it's a JSON string)
      const parsedData = JSON.parse(localData);

      // Set the state based on the localStorage data
      setPersonalDeskUserInfo((prevState) => ({
        ...prevState,
        firstName: parsedData.name || prevState.firstName,
        lastName: parsedData.lastName || prevState.lastName,
        email: parsedData.email || prevState.email,
        birthday: parsedData.birthday || prevState.birthday,
        // idNumber: parsedData.idNumber || prevState.idNumber,
        // You can add other properties if needed, for example:
        // idNumber: parsedData.idNumber || prevState.idNumber,
        // workspace: parsedData.company || prevState.workspace, // Example mapping
      }));
    }
  }, []);

  return (
    <BookingContext.Provider
      value={{
        personalDeskUserInfo,
        handlePersonalDesk,
        period,
        setPeriod,
        setPersonalDeskUserInfo,
        handleFullOffice,
        fullOfficeInfo,
        setFullOfficeInfo,
      }}
    >
      {children}
    </BookingContext.Provider>
  );
}

export const useBooking = () => useContext(BookingContext);
