import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import LogoCarousel from "../components/LogoCarousel/LogoCarousel";
import DesksTables from "../Desks/DesksTables";
import styles from "./Home.module.css";

function Home() {
  const navigate = useNavigate();
  const [activeDesksType, setActiveDesksType] = useState("dedicated");

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

        {/* Direct links to booking pages */}
        <div className={styles.bookingButtons}>
          <button
            className={styles.bookingButton}
            onClick={() => navigate("/dedicated-desks")}
          >
            View Dedicated Desks
          </button>
          <button
            className={styles.bookingButton}
            onClick={() => navigate("/private-offices")}
          >
            View Private Offices
          </button>
        </div>
      </section>

      <section className={styles.partnersSection}>
        <h2 className={styles.sectionTitle}>Our Partners</h2>
        <LogoCarousel />
      </section>

      {/* Navigation buttons can be styled and placed appropriately in the layout */}
      <nav className={styles.navigation}>
        <button onClick={() => navigate("/bookDesk")}>Book Desk</button>
        <button onClick={() => navigate("/contact")}>Contact Us</button>
        <button onClick={() => navigate("/desks")}>Desks</button>
        <button onClick={() => navigate("/dedicated-desks")}>
          Dedicated Desks
        </button>
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
