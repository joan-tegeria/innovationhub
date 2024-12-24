import React, { useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
// import "./App.css";
// import BookingApp from "./BookingApp";
import PersonalDesk from "./PersonalDesk";
import BookingProvider from "./context/BookingContext";
import Home from "./Home";
import ContactUs from "./ContactUs";
import FullOffice from "./FullOffice";
function App() {
  return (
    <BookingProvider>
      <BrowserRouter>
        <Routes>
          {/* Define the main route for "/personaldesk" */}
          <Route path="/pdesk" element={<PersonalDesk />} />

          {/* Optionally, you can add a fallback route or home route */}
          <Route path="/fullOffice" element={<FullOffice />} />
          <Route path="/" element={<Home />} />
          <Route path="/contact" element={<ContactUs />} />
        </Routes>
      </BrowserRouter>
    </BookingProvider>
  );
}

export default App;
