import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
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
import Partners from "./Partners/Partners";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

function App() {
  // Function to send the current height to the parent
  const sendHeightToParent = () => {
    const height = document.documentElement.scrollHeight;
    window.parent.postMessage(height, "*"); // Send height to parent page
  };

  // Send height when component mounts or resizes
  useEffect(() => {
    // Send height initially
    sendHeightToParent();

    // Listen for window resizing and send height again
    const handleResize = () => {
      sendHeightToParent();
    };

    window.addEventListener("resize", handleResize);

    // Cleanup the event listener on unmount
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []); // Empty dependency array ensures this runs only on mount

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
            <Route path="/desks">
              <Route
                index
                element={<Navigate to="/desks/dedicated" replace />}
              />
              <Route
                path="dedicated"
                element={<DeskBooking type="dedicated" />}
              />
              <Route path="private" element={<DeskBooking type="private" />} />
            </Route>
            <Route path="/events" element={<Events />} />
            <Route path="/membershipplans" element={<MembershipPlans />} />
            <Route path="/partners" element={<Partners />} />
          </Routes>
        </BrowserRouter>
      </BookingProvider>
    </AuthProvider>
  );
}

export default App;
