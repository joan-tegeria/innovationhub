import React, { useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
// import "./App.css";
// import BookingApp from "./BookingApp";
import PersonalDesk from "./PersonalDesk";
import BookingProvider from "./context/BookingContext";
import Home from "./Home";
import ContactUs from "./ContactUs";
import FullOffice from "./FullOffice";
import Events from "./Events";
import { AuthProvider } from "./context/Auth";
import DeskBooking from "./Desks";
import MembershipPlans from "./MembershipPlans";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
function App() {
  return (
    <AuthProvider>
      <BookingProvider>
        <BrowserRouter>
          <Routes>
            {/* Define the main route for "/personaldesk" */}
            <Route path="/pdesk" element={<PersonalDesk />} />

            {/* Optionally, you can add a fallback route or home route */}
            <Route path="/fullOffice" element={<FullOffice />} />
            <Route path="/" element={<Home />} />
            <Route path="/contact" element={<ContactUs />} />
            <Route path="/desks" element={<DeskBooking />} />
            <Route path="/events" element={<Events />} />
            <Route path="/membershipplans" element={<MembershipPlans />} />
          </Routes>
        </BrowserRouter>
      </BookingProvider>
    </AuthProvider>
  );
}

export default App;
