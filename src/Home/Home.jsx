import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import LogoCarousel from "../components/LogoCarousel/LogoCarousel";
import DesksTables from "../Desks/DesksTables";
import styles from "./Home.module.css";

function Home() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [activeDesksType, setActiveDesksType] = useState("dedicated");

  useEffect(() => {
    const pass = localStorage.getItem("debugPass");
    if (pass !== "mafia200190200") {
      setIsAuthenticated(false);
    }
  }, [isAuthenticated]);

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (password === "mafia200190200") {
      localStorage.setItem("debugPass", "mafia200190200");
      // Replace 'yourPassword' with the actual password

      setIsAuthenticated(true);
    } else {
      alert("Incorrect password");
    }
  };

  if (!isAuthenticated) {
    return (
      <div className={styles.container}>
        <form onSubmit={handlePasswordSubmit}>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
          />
          <button type="submit">Submit</button>
        </form>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Pricing Tables Section */}
      <section className={styles.pricingSection}>
        <h2 className={styles.sectionTitle}>Our Pricing Plans</h2>
        <div className={styles.deskTypeToggle}>
          <button
            className={`${styles.toggleButton} ${
              activeDesksType === "dedicated" ? styles.active : ""
            }`}
            onClick={() => setActiveDesksType("dedicated")}
          >
            Dedicated Desks
          </button>
          <button
            className={`${styles.toggleButton} ${
              activeDesksType === "private" ? styles.active : ""
            }`}
            onClick={() => setActiveDesksType("private")}
          >
            Private Offices
          </button>
        </div>
        <DesksTables type={activeDesksType} />
      </section>

      <section className={styles.partnersSection}>
        <h2 className={styles.sectionTitle}>Our Partners</h2>
        <LogoCarousel />
      </section>

      {/* Navigation buttons can be styled and placed appropriately in the layout */}
      <nav className={styles.navigation}>
        <button onClick={() => navigate("/pdesk")}>Personal Desk</button>
        <button onClick={() => navigate("/contact")}>Contact Us</button>
        <button onClick={() => navigate("/fullOffice")}>Full Office</button>
        <button onClick={() => navigate("/desks")}>Desks</button>
        <button onClick={() => navigate("/desks-table")}>Desks Table</button>
        <button onClick={() => navigate("/events")}>Events</button>
        <button onClick={() => navigate("/membershipplans")}>
          Membership Plans
        </button>
        <button onClick={() => navigate("/partners")}>Partners</button>
        <button onClick={() => navigate("/eventslist")}>Event List</button>
      </nav>
    </div>
  );
}

export default Home;
