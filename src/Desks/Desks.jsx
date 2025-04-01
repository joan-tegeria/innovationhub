import React from "react";
import { useParams, Navigate } from "react-router-dom";
import DedicatedDesks from "./DedicatedDesks";
import PrivateOffices from "./PrivateOffices";

const Desks = () => {
  const { type } = useParams();

  // If no type is provided, redirect to dedicated desks
  if (!type) {
    return <Navigate to="/desks/dedicated" replace />;
  }

  // Render the appropriate component based on type
  if (type === "dedicated") {
    return <DedicatedDesks />;
  } else if (type === "private") {
    return <PrivateOffices />;
  } else {
    // Redirect to dedicated desks if an invalid type is provided
    return <Navigate to="/desks/dedicated" replace />;
  }
};

export default Desks;
