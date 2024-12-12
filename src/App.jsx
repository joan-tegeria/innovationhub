// import { useState } from "react";
// import "./App.css";
// import BookingApp from "./BookingApp";
import PersonalDesk from "./PersonalDesk";
import BookingProvider from "./context/BookingContext";
function App() {
  return (
    <BookingProvider>
      <PersonalDesk />
    </BookingProvider>
  );
}

export default App;
