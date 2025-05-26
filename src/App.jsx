import React, { useState, useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import "./App.css";
// import BookingApp from "./BookingApp";

import Home from "./Home";
import ContactUs from "./ContactUs";
import Footer from "./components/Footer";

import Events from "./Events";
// import { AuthProvider } from "./context/Auth";
import Desks from "./Desks/Desks";
import DedicatedDesks from "./Desks/DedicatedDesks";
import PrivateOffices from "./Desks/PrivateOffices";
import DesksTables from "./Desks/DesksTables";
import MembershipPlans from "./MembershipPlans";
import Partners from "./Partners/Partners";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import EventTable from "./Desks/EventTable";

import BookDesk from "./Screens/BookDesk";
import BookingPayment from "./Screens/BookingPayment/BookingPayment";
import FinishedBooking from "./Screens/FinishedBooking/FinishedBooking";
import BookOffice from "./Screens/BookOffice";
import Navbar from "./components/Navbar";
import VisitSPace from "./Screens/VIsitSPace/VisitSPace";
// Wrapper component to handle conditional rendering of Navbar and Footer

const ExternalRedirect = ({ to }) => {
  useEffect(() => {
    window.location.href = to;
  }, [to]);

  return null;
};

const AppContent = () => {
  const location = useLocation();

  // Define routes where Navbar and Footer should appear
  const showNavAndFooter = [
    "/events",
    "/bookDesk",
    "/bookOffice",
    "/booking/payment",
    "/booking-success",
    "/visitspace",
  ];

  // Check if current path starts with any of the routes in showNavAndFooter
  const shouldShowNavAndFooter = showNavAndFooter.some((route) =>
    location.pathname.startsWith(route)
  );

  // Function to send the current height to the parent
  const sendHeightToParent = () => {
    const height = document.documentElement.scrollHeight;
    window.parent.postMessage(height, "*"); // Send height to parent page
  };

  // Send height when component mounts or resizes
  useEffect(() => {
    // Set viewport height for mobile devices
    const setViewportHeight = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty("--vh", `${vh}px`);
    };

    // Send height initially
    sendHeightToParent();
    setViewportHeight();

    // Listen for window resizing and send height again
    const handleResize = () => {
      sendHeightToParent();
      setViewportHeight();
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
    <div className="app-container">
      {shouldShowNavAndFooter && <Navbar />}
      <main className="main-content">
        <Routes>
          {/* Main Routes */}
          {/* <Route path="/" element={<Home />} /> */}
          <Route
            path="/"
            element={<ExternalRedirect to="https://hubitat.al/" />}
          />
          <Route path="/contact" element={<ContactUs />} />
          <Route path="/events" element={<Events />} />
          <Route path="/membershipplans" element={<MembershipPlans />} />
          <Route path="/partners" element={<Partners />} />
          <Route path="/listevents" element={<EventTable />} />
          <Route path="/visitspace" element={<VisitSPace />} />

          {/* Desk Routes */}
          <Route path="/desks" element={<Desks />}>
            <Route index element={<Navigate to="/desks/dedicated" replace />} />
            <Route path=":type" element={<Desks />} />
          </Route>
          <Route path="/dedicated-desks" element={<DedicatedDesks />} />
          <Route path="/private-offices" element={<PrivateOffices />} />

          {/* Desk Tables Routes */}
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

          {/* Booking Flow Routes */}
          <Route path="/bookDesk">
            <Route
              index
              element={<Navigate to="/bookDesk/flexible" replace />}
            />
            <Route path=":type" element={<BookDesk />} />
          </Route>
          <Route path="/bookOffice" element={<BookOffice />} />
          <Route path="/booking/payment" element={<BookingPayment />} />
          <Route path="/booking-success" element={<FinishedBooking />} />
        </Routes>
      </main>
      {shouldShowNavAndFooter && <Footer />}
    </div>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
