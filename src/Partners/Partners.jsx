import React from "react";
import LogoCarousel from "../components/LogoCarousel/LogoCarousel";
import styles from "./Partners.module.css";

const Partners = () => {
  return (
    <div className={styles.partnersPage}>
      <LogoCarousel />
    </div>
  );
};

export default Partners;
