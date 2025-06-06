import React, { useState, useEffect } from "react";
import { ENDPOINTS } from "../util/api";
import { motion, AnimatePresence } from "framer-motion";
import CircularProgress from "@mui/material/CircularProgress";
import styles from "./PrivateOffices.module.css";
import api from "../util/axiosConfig";
import poffice4 from "../assets/3d-4people.webp";
import poffice1 from "../assets/3d-1person.webp";
import poffice2 from "../assets/3d-2people.webp";
import poffice3 from "../assets/3d-3people.webp";
import { image } from "framer-motion/client";
// Add a currency formatter function
const formatCurrency = (value) => {
  // Format the number using the 'ALL' currency code
  const formattedValue = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "ALL",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);

  // Remove the 'ALL' part and add it manually at the end
  return formattedValue.replace("ALL", "").trim() + " ALL";
};

const getProductImage = (name) => {
  switch (name.toLowerCase()) {
    case "the pod":
      return "https://hubitat.al/wp-content/uploads/2025/05/3d-3people-min-min.jpg";
    case "the solo":
      return "https://hubitat.al/wp-content/uploads/2025/05/3d-1person-min.jpg";
    case "the duo":
      return "https://hubitat.al/wp-content/uploads/2025/05/3d-2people-min.jpg";
    case "the suite":
      return "https://hubitat.al/wp-content/uploads/2025/05/3d-4people-min.jpg";
  }
};

const getProductName = (name) => {
  switch (name.toLowerCase()) {
    case "the pod":
      return "3 People ";
    case "the solo":
      return "1 Person";
    case "the duo":
      return "2 People";
    case "the suite":
      return "4 People";
  }
};

const transformApiDataToDesks = (data, period) => {
  return data.map((item) => ({
    type: item.Product_Name.split("-")[0].trim(),
    description: item.Description,
    // image: getProductImage(item.Product_Name.split("-")[0].trim()),
    image:
      "https://hubitat.al/wp-content/uploads/2025/01/modern-office-9-3.png",
    price: formatCurrency(item.Unit_Price, item.$currency_symbol),
    Capacity: item.Capacity,
    access:
      period === "Daily"
        ? "for Daily access"
        : period === "Weekly"
        ? "for 7 days access"
        : period === "Monthly"
        ? "for 30 days access"
        : "for Annual access",
  }));
};

const PrivateOffices = () => {
  const [activeTab, setActiveTab] = useState("daily");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [deskData, setDeskData] = useState({
    daily: [],
    monthly: [],
    annually: [],
  });

  const tabs = ["daily", "monthly", "annually"];

  // Check for mobile view on initial render and window resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 767);
    };

    // Initial check
    checkMobile();

    // Add resize listener
    window.addEventListener("resize", checkMobile);

    // Cleanup
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleBooking = (deskType) => {
    console.log(deskType);
    const url = "https://hubitat.al/private-offices/";

    // If in iframe, use parent window location
    if (window.self !== window.top) {
      window.parent.location.href = url;
    } else {
      window.location.href = url;
    }
  };

  useEffect(() => {
    const fetchDesks = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const period =
          activeTab === "daily"
            ? "Daily"
            : activeTab === "monthly"
            ? "Monthly"
            : "Annually";

        const response = await api.get(
          `${ENDPOINTS.PRODUCTS}?category=Private&period=${period}`
        );
        console.log(response.data.data);

        // Reverse the data for Private Offices
        response.data.data.reverse();

        const currentTabData = transformApiDataToDesks(
          response.data.data || [],
          period
        );

        setDeskData((prev) => ({
          ...prev,
          [activeTab]: currentTabData,
        }));
      } catch (error) {
        console.error("Error fetching offices:", error);
        setError("Failed to load office data. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchDesks();
  }, [activeTab]);

  return (
    <div className={styles.container}>
      <div className={styles.titleContainer} style={{ marginBottom: "2rem" }}>
        <span className={styles.title2}>Offices</span>
        <span>
          Your own space to innovate, collaborate, and grow. Our private,
          fully-equipped offices are perfect for startups, growing teams, and
          individuals who value privacy, focus, and a professional work
          environment.
        </span>
      </div>

      <div className={styles.titleContainer}>
        <span className={styles.title}>Private Offices</span>

        <div className={styles.tabContainer}>
          <motion.div
            className={styles.activeBackground}
            animate={{
              x:
                activeTab === tabs[0]
                  ? 0
                  : activeTab === tabs[1]
                  ? "100%"
                  : "200%",
              width: `calc((100% - 8px) / 3)`,
            }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          />
          {tabs.map((tab) => (
            <motion.button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{ fontFamily: "Termina Test" }}
              className={`${styles.tab} ${
                activeTab === tab ? styles.activeTab : ""
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </motion.button>
          ))}
        </div>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className={styles.grid}
        >
          {isLoading ? (
            <div className={styles.loadingContainer}>
              <CircularProgress
                size={40}
                thickness={4}
                sx={{
                  color: "#EB3778",
                }}
              />
            </div>
          ) : deskData[activeTab].length === 0 ? (
            <div className={styles.error}>
              No options available for this time period.
            </div>
          ) : (
            <>
              {isMobile && (
                <div className={styles.scrollIndicator}>
                  <div className={styles.scrollText}>
                    Scroll for more options
                  </div>
                  <div className={styles.scrollArrow}>→</div>
                </div>
              )}
              {deskData[activeTab].map((desk, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 * index }}
                  className={styles.card}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div style={{ position: "relative" }}>
                    <img
                      loading="lazy"
                      srcset={getProductImage(desk.type)}
                      // decoding="async"
                      sizes="(max-width: 500px)"
                      alt={desk.type}
                      className={styles.imgContainer}
                    />

                    <div className={styles.numberBox}>
                      <svg
                        width="10"
                        height="13"
                        viewBox="0 0 10 13"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M5.0251 5.58732C6.15163 5.58732 7.06486 4.67409 7.06486 3.54757C7.06486 2.42104 6.15163 1.50781 5.0251 1.50781C3.89858 1.50781 2.98535 2.42104 2.98535 3.54757C2.98535 4.67409 3.89858 5.58732 5.0251 5.58732Z"
                          stroke="black"
                          strokeWidth="1.09701"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M1 11.4923C1.00713 10.8101 1.18706 10.1407 1.523 9.54686C2.23095 8.29528 3.59059 7.50055 5.02811 7.49744C6.46562 7.50055 7.82526 8.29528 8.53321 9.54686C8.86915 10.1407 9.04908 10.8101 9.05621 11.4923"
                          stroke="black"
                          strokeWidth="1.09701"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>

                      <span>{desk.Capacity ? desk.Capacity : 1}</span>
                    </div>
                  </div>
                  <div className={styles.cardContent}>
                    <span className={styles.cardTitle}>{desk.type}</span>
                    <span className={styles.description}>
                      {desk.description}
                    </span>
                    <div className={styles.cardInfo}>
                      <span className={styles.rateLabel}>
                        {activeTab.charAt(0).toUpperCase() +
                          activeTab.slice(1) ===
                        "Annually"
                          ? "Monthly"
                          : activeTab.charAt(0).toUpperCase() +
                            activeTab.slice(1)}{" "}
                        rate
                      </span>
                      <span className={styles.price}>{desk.price}</span>
                      <span className={styles.access}>{desk.access}</span>
                    </div>
                    <button
                      className={styles.button}
                      onClick={() => handleBooking(desk.type)}
                    >
                      Book Now
                    </button>
                  </div>
                </motion.div>
              ))}
            </>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default PrivateOffices;
