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
import DesksTables from "./Desks/DesksTables";
import MembershipPlans from "./MembershipPlans";
import Partners from "./Partners/Partners";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import EventTable from "./Desks/EventTable";

import BookDesk from "./Screens/BookDesk";
import BookingPayment from "./screens/BookingPayment/BookingPayment";

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

    // Prevent scroll position from changing when date picker opens
    const preventAutoScroll = (event) => {
      // Save current scroll position
      const scrollPos = window.scrollY;

      // Check if this is a date picker event by inspecting DOM
      setTimeout(() => {
        const datePickerOpen = document.querySelector(".MuiPickersPopper-root");
        if (datePickerOpen) {
          // If scrolled, restore position
          if (window.scrollY !== scrollPos) {
            window.scrollTo(0, scrollPos);
          }
        }
      }, 10);
    };

    window.addEventListener("resize", handleResize);
    document.addEventListener("click", preventAutoScroll, true);

    // Cleanup the event listeners on unmount
    return () => {
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("click", preventAutoScroll, true);
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
            <Route path="/bookDesk" element={<BookDesk />} />
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
            <Route path="/desks-table">
              <Route
                index
                element={<Navigate to="/desks-table/dedicated" replace />}
              />
              <Route
                path="dedicated"
                element={<DesksTables type="dedicated" />}
              />
              <Route path="private" element={<DesksTables type="private" />} />
            </Route>
            <Route path="/events" element={<Events />} />
            <Route path="/membershipplans" element={<MembershipPlans />} />
            <Route path="/partners" element={<Partners />} />
            <Route path="/eventslist" element={<EventTable />} />
            <Route path="/booking/payment" element={<BookingPayment />} />
          </Routes>
        </BrowserRouter>
      </BookingProvider>
    </AuthProvider>
  );
}

export default App;
