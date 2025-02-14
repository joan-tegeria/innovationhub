import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useParams, Navigate } from "react-router-dom";
import CircularProgress from "@mui/material/CircularProgress";
import styles from "./DeskBooking.module.css";
import Dedicated from "../assets/dedicated.svg";
import Flexible from "../assets/flexible.svg";
import api from "../utility/axiosConfig";

const transformApiDataToDesks = (data, period) => {
  return data.map((item) => ({
    type: item.Product_Name.split("-")[0].trim(),
    description: item.Description,
    price: `${item.Unit_Price} ${item.$currency_symbol}`,
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

const DeskBooking = ({ type }) => {
  const [activeTab, setActiveTab] = useState("daily");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [deskData, setDeskData] = useState({
    daily: [],
    weekly: [],
    monthly: [],
    annually: [],
  });

  const handleBooking = (deskType) => {
    const url =
      deskType.toLowerCase() === "dedicated"
        ? "http://35.176.180.59/flexible-desk/"
        : "http://35.176.180.59/private-offices/";

    // If in iframe, use parent window location
    if (window.self !== window.top) {
      window.parent.location.href = url;
    } else {
      window.location.href = url;
    }
  };

  // If no type is provided, redirect to dedicated desks
  if (!type) {
    return <Navigate to="/desks/dedicated" replace />;
  }

  // Define tabs based on desk type
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
          `https://nhpvz8wphf.execute-api.eu-central-1.amazonaws.com/prod//products?category=${category}&period=${period}`
        );
        console.log(response.data.data);

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

  return (
    <div className={styles.container}>
      <div className={styles.titleContainer}>
        {type.toLowerCase() === "dedicated" ? (
          <span className={styles.title}>Desks</span>
        ) : (
          <span className={styles.title}></span>
        )}
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
          ) : (
            deskData[activeTab].map((desk, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: index === 0 ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className={styles.card}
              >
                <div style={{ position: "relative" }}>
                  <img
                    src={
                      "http://35.176.180.59/wp-content/uploads/2024/11/image-15.png"
                    }
                    alt=""
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
                        stroke-width="1.09701"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                      <path
                        d="M1 11.4923C1.00713 10.8101 1.18706 10.1407 1.523 9.54686C2.23095 8.29528 3.59059 7.50055 5.02811 7.49744C6.46562 7.50055 7.82526 8.29528 8.53321 9.54686C8.86915 10.1407 9.04908 10.8101 9.05621 11.4923"
                        stroke="black"
                        stroke-width="1.09701"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                    </svg>

                    <span>{desk.Capacity ? desk.Capacity : 1}</span>
                  </div>
                </div>
                <div className={styles.cardContent}>
                  <span className={styles.cardTitle}>{desk.type}</span>
                  <span className={styles.description}>{desk.description}</span>
                  <div className={styles.cardInfo}>
                    <span className={styles.rateLabel}>Daily rate</span>
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
            ))
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default DeskBooking;
