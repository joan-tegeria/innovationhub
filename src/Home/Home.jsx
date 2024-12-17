import React from "react";
import { useNavigate } from "react-router-dom";

function DebugDevPage() {
  const navigate = useNavigate();

  const navigateToPersonalDesk = () => {
    navigate("/pdesk");
  };

  const navigateToAbout = () => {
    navigate("/fullOffice");
  };

  return (
    <div style={{ padding: "20px", textAlign: "center" }}>
      <h1>Debug Development Page</h1>
      <p>Click a button below to navigate to a different route:</p>
      <div>
        <button onClick={navigateToPersonalDesk} style={buttonStyle}>
          Go to Personal Desk
        </button>
        <button onClick={navigateToAbout} style={buttonStyle}>
          Go to Full Office
        </button>
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
