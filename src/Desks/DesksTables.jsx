import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useParams, Navigate } from "react-router-dom";
import CircularProgress from "@mui/material/CircularProgress";
import styles from "./DesksTables.module.css";
import api from "../util/axiosConfig";
// import useWindowSize from "../hooks/useWindowSize";

// Add a currency formatter function
const formatCurrency = (value, currencySymbol) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currencySymbol,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })
    .format(value)
    .replace(
      currencySymbol === "ALL" ? "$" : currencySymbol,
      currencySymbol + " "
    );
};

const transformApiDataToDesks = (data, period) => {
  return data.map((item) => ({
    type: item.Product_Name.split("-")[0].trim(),
    description: item.Description,
    price: `${item.Unit_Price}`,
    capacity: item.Capacity,
    access:
      period === "Daily"
        ? "for 24 hours access"
        : period === "Weekly"
        ? "for 7 days access"
        : period === "Monthly"
        ? "for 30 days access"
        : "for Annual access",
  }));
};

// Add a custom hook for window size
// Note: If this hook already exists elsewhere in your codebase, you can import it instead
const useWindowDimensions = () => {
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return windowSize;
};

const DesksTables = ({ type }) => {
  const [activeTab, setActiveTab] = useState("daily");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [deskData, setDeskData] = useState({
    daily: [],
    weekly: [],
    monthly: [],
    annually: [],
  });
  const { width } = useWindowDimensions();
  const isMobile = width <= 768;
  const tableRef = useRef(null);

  if (!type) {
    return <Navigate to="/desks/dedicated" replace />;
  }

  const tabs =
    type === "dedicated"
      ? ["daily", "weekly", "monthly"]
      : ["daily", "monthly", "annually"];

  useEffect(() => {
    const fetchDesks = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const period =
          activeTab === "daily"
            ? "Daily"
            : activeTab === "weekly"
            ? "Weekly"
            : activeTab === "monthly"
            ? "Monthly"
            : "Annually";

        const category = type === "dedicated" ? "Dedicated" : "Private";

        const response = await api.get(
          `https://66eujsebp8.execute-api.eu-central-1.amazonaws.com/prod/products?category=${category}&period=${period}`
        );

        if (category === "Private") {
          response.data.data.reverse();
        }

        const currentTabData = transformApiDataToDesks(
          response.data.data || [],
          period
        );

        setDeskData((prev) => ({
          ...prev,
          [activeTab]: currentTabData,
        }));
      } catch (error) {
        console.error("Error fetching desks:", error);
        setError("Failed to load desk data. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchDesks();
  }, [activeTab, type]);

  // Mobile cards view component
  const MobileCards = () => (
    <div
      className={styles.cardContainer}
      style={{ display: isMobile ? "block" : "none" }}
    >
      {deskData[activeTab].map((desk, index) => (
        <div key={index} className={styles.card}>
          <h3 className={styles.cardTitle}>{desk.type}</h3>

          <div className={styles.cardSection}>
            <div className={styles.capacity}>
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z"
                  fill="currentColor"
                />
              </svg>
              <span>
                {desk.capacity || 1} {desk.capacity <= 1 ? "Person" : "People"}
              </span>
            </div>
          </div>

          <div className={styles.cardSection}>
            <div className={styles.cardLabel}>Description</div>
            <div className={styles.cardValue}>{desk.description}</div>
          </div>

          <div className={styles.cardSection}>
            <div className={styles.rateLabel}>Daily rate</div>

            <div className={styles.price}>
              {desk.price ? Number(desk.price).toLocaleString() : 0} ALL
            </div>
            <div className={styles.access}>{desk.access}</div>
          </div>

          {/* Enable book button if needed
          <button
            className={styles.bookButton}
            onClick={() => handleBooking(desk.type)}
          >
            Book Now
          </button>
          */}
        </div>
      ))}
    </div>
  );

  return (
    <div className={styles.container}>
      <div className={styles.titleContainer}>
        <span className={styles.title}>Find the Right Fit for Your Team</span>
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
            }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          />
          {tabs.map((tab) => (
            <motion.button
              key={tab}
              onClick={() => setActiveTab(tab)}
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
          ) : (
            <>
              <div
                className={styles.tableContainer}
                ref={tableRef}
                style={{ display: isMobile ? "none" : "block" }}
              >
                <table className={styles.pricingTable}>
                  <thead>
                    <tr>
                      {deskData[activeTab].map((desk, index) => (
                        <th key={index}>{desk.type}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      {deskData[activeTab].map((desk, index) => (
                        <td key={index}>
                          <div className={styles.capacity}>
                            <svg
                              width="24"
                              height="24"
                              viewBox="0 0 24 24"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z"
                                fill="currentColor"
                              />
                            </svg>
                            <span>
                              {desk.capacity || 1}{" "}
                              {desk.capacity <= 1 ? "Person" : "People"}
                            </span>
                          </div>
                        </td>
                      ))}
                    </tr>
                    <tr>
                      {deskData[activeTab].map((desk, index) => (
                        <td key={index}>
                          <div className={styles.description}>
                            {desk.description}
                          </div>
                        </td>
                      ))}
                    </tr>
                    <tr>
                      {deskData[activeTab].map((desk, index) => (
                        <td key={index}>
                          <div className={styles.rateLabel}>Daily rate</div>
                          <div className={styles.price}>
                            {desk.price
                              ? Number(desk.price).toLocaleString()
                              : 0}{" "}
                            ALL
                          </div>
                          <div className={styles.access}>{desk.access}</div>
                        </td>
                      ))}
                    </tr>
                    {/* <tr>
                      {deskData[activeTab].map((desk, index) => (
                        <td key={index}>
                          <button
                            className={styles.bookButton}
                            onClick={() => handleBooking(desk.type)}
                          >
                            Book Now
                          </button>
                        </td>
                      ))}
                    </tr> */}
                  </tbody>
                </table>
              </div>

              <MobileCards />
            </>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default DesksTables;
