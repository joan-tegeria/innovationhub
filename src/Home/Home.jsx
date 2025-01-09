import React from "react";
import { useNavigate } from "react-router-dom";

function DebugDevPage() {
  const navigate = useNavigate();

  const navigateToPersonalDesk = () => {
    navigate("/pdesk");
  };

  const navigateToContact = () => {
    navigate("/contact");
  };
  const navigateToOffice = () => {
    navigate("/fullOffice");
  };

  const navigateToDesks = () => {
    navigate("/desks");
  };

  return (
    <div style={{ padding: "20px", textAlign: "center" }}>
      <h1>Debug Development Page</h1>
      <p>Click a button below to navigate to a different route:</p>
      <div>
        <button onClick={navigateToPersonalDesk} style={buttonStyle}>
          Go to Personal Desk
        </button>
        <button onClick={navigateToContact} style={buttonStyle}>
          Go to Contact Us
        </button>
        <button onClick={navigateToOffice} style={buttonStyle}>
          Go to Full Office
        </button>
        <button onClick={navigateToDesks} style={buttonStyle}>
          Go to Desks
        </button>
        {/* <button onClick={navigateToAbout} style={buttonStyle}>
          Go to Full Office
        </button> */}
      </div>
    </div>
  );
}

const buttonStyle = {
  margin: "10px",
  padding: "10px 20px",
  fontSize: "16px",
  cursor: "pointer",
  backgroundColor: "#4CAF50",
  color: "white",
  border: "none",
  borderRadius: "5px",
};

export default DebugDevPage;
