import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useParams, Navigate } from "react-router-dom";
import CircularProgress from "@mui/material/CircularProgress";
import styles from "./DesksTables.module.css";
import api from "../util/axiosConfig";

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

const transformApiDataToDesks = (data, period) => {
  // First, group items by their base name (without numbers)
  const groupedItems = {};

  data.forEach((item) => {
    // Extract the base name and number from Product_Name
    // Example: "Meduim Event Space 1 - Half Day" -> baseName: "Meduim Event Space", number: 1
    const fullName = item.Product_Name.split("-")[0].trim();
    const match = fullName.match(/(.*?)\s*(\d+)$/);

    let baseName = fullName;
    let number = null;

    if (match) {
      baseName = match[1].trim();
      number = parseInt(match[2]);
    }

    if (!groupedItems[baseName]) {
      groupedItems[baseName] = [];
    }

    groupedItems[baseName].push({
      ...item,
      baseName,
      number,
    });
  });

  // Convert grouped items to desks format
  const desks = [];

  Object.entries(groupedItems).forEach(([baseName, items]) => {
    if (items.length > 1 && items.some((item) => item.number !== null)) {
      // Multiple items with numbers - merge them
      const sortedItems = items.sort(
        (a, b) => (a.number || 0) - (b.number || 0)
      );
      const minCapacity = Math.min(
        ...sortedItems.map((item) => parseInt(item.Capacity))
      );
      const maxCapacity = Math.max(
        ...sortedItems.map((item) => parseInt(item.Capacity))
      );
      const minPrice = Math.min(...sortedItems.map((item) => item.Unit_Price));
      const maxPrice = Math.max(...sortedItems.map((item) => item.Unit_Price));
      const currencySymbol = "All";

      desks.push({
        type: baseName,
        description: sortedItems[0].Description, // Using description from the first item
        price:
          minPrice === maxPrice
            ? formatCurrency(minPrice, currencySymbol)
            : `${formatCurrency(minPrice, currencySymbol)} - ${formatCurrency(
                maxPrice,
                currencySymbol
              )}`,
        capacity:
          minCapacity === maxCapacity
            ? minCapacity.toString()
            : `${minCapacity} - ${maxCapacity}`,
        Additional_Information: sortedItems[0].Additional_Information, // Add Additional_Information from first item
        access:
          period === "Half Day"
            ? "for half-day access"
            : period === "Full Day"
            ? "for full-day access"
            : period === "Daily"
            ? "for 24 hours access"
            : period === "Weekly"
            ? "for 7 days access"
            : period === "Monthly"
            ? "for 30 days access"
            : "for Annual access",
        variants: sortedItems.length,
      });
    } else {
      // Single item or items without numbers - keep as is

      items.forEach((item) => {
        console.log("one ti", item);
        desks.push({
          type: item.Product_Name.split("-")[0].trim(),
          description: item.Description,
          price: formatCurrency(item.Unit_Price, item.$currency_symbol),
          capacity: item.Capacity,
          Additional_Information: item.Additional_Information,
          access:
            period === "Half Day"
              ? "for half-day access"
              : period === "Full Day"
              ? "for full-day access"
              : period === "Daily"
              ? "for 24 hours access"
              : period === "Weekly"
              ? "for 7 days access"
              : period === "Monthly"
              ? "for 30 days access"
              : "for Annual access",
        });
      });
    }
  });

  return desks;
};

// Add a custom hook for window size
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

const EventTable = ({ type }) => {
  const [activeTab, setActiveTab] = useState("Half Day");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [deskData, setDeskData] = useState({
    "Half Day": [],
    "Full Day": [],
  });
  const { width } = useWindowDimensions();
  const isMobile = width <= 768;
  const tableRef = useRef(null);

  const handleBooking = (deskType) => {
    const url =
      deskType.toLowerCase() === "the solo"
        ? "http://35.176.180.59/dedicated-desk/"
        : deskType.toLowerCase() === "the duo"
        ? "http://35.176.180.59/flexible-desk/"
        : "http://35.176.180.59/private-offices/";

    if (window.self !== window.top) {
      window.parent.location.href = url;
    } else {
      window.location.href = url;
    }
  };

  // if (!type) {
  //   return <Navigate to="/desks/dedicated" replace />;
  // }

  const tabs = ["Half Day", "Full Day"];

  useEffect(() => {
    const fetchDesks = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const period = activeTab === "Half Day" ? "Half Day" : "Full Day";
        const apiPeriod = activeTab === "Half Day" ? "half day" : "full day";

        const response = await api.get(
          `https://nhpvz8wphf.execute-api.eu-central-1.amazonaws.com/prod/products?category=event&period=${apiPeriod}`
        );

        // if (category === "Private") {
        //   response.data.data.reverse();
        // }

        const currentTabData = transformApiDataToDesks(
          response.data.data || [],
          period
        );

        console.log(currentTabData);

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
      {deskData[activeTab]?.map((desk, index) => (
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
            <div className={styles.price}>{desk.price}</div>
            <div className={styles.access}>{desk.access}</div>
          </div>

          {desk.Additional_Information && (
            <div className={styles.cardSection}>
              <div className={styles.cardLabel}>Additional Information</div>
              <div className={styles.cardValue}>
                <ul style={{ listStyleType: "none", padding: 0, margin: 0 }}>
                  {desk.Additional_Information.split(";").map((item, i) => (
                    <li
                      key={i}
                      style={{
                        marginBottom: "6px",
                        display: "flex",
                        alignItems: "flex-start",
                      }}
                    >
                      <span style={{ marginRight: "8px" }}>
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 14 14"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <g clipPath="url(#clip0_2374_1886)">
                            <path
                              d="M13.0192 2.58475L4.95816 10.6453C4.90396 10.6997 4.83955 10.7428 4.76863 10.7723C4.69771 10.8018 4.62167 10.8169 4.54487 10.8169C4.46807 10.8169 4.39203 10.8018 4.3211 10.7723C4.25018 10.7428 4.18577 10.6997 4.13158 10.6453L1.01424 7.525C0.960046 7.47059 0.895638 7.42742 0.824715 7.39796C0.753792 7.3685 0.67775 7.35334 0.600952 7.35334C0.524154 7.35334 0.448111 7.3685 0.377188 7.39796C0.306265 7.42742 0.241857 7.47059 0.18766 7.525C0.133248 7.5792 0.0900745 7.64361 0.0606152 7.71453C0.0311559 7.78546 0.0159912 7.8615 0.0159912 7.9383C0.0159912 8.01509 0.0311559 8.09114 0.0606152 8.16206C0.0900745 8.23298 0.133248 8.29739 0.18766 8.35159L3.30616 11.4695C3.63513 11.7979 4.08094 11.9823 4.54574 11.9823C5.01054 11.9823 5.45636 11.7979 5.78533 11.4695L13.8458 3.41075C13.9002 3.35657 13.9432 3.2922 13.9727 3.22133C14.0021 3.15046 14.0172 3.07448 14.0172 2.99775C14.0172 2.92103 14.0021 2.84505 13.9727 2.77418C13.9432 2.70331 13.9002 2.63894 13.8458 2.58475C13.7916 2.53034 13.7272 2.48717 13.6563 2.45771C13.5854 2.42825 13.5093 2.41309 13.4325 2.41309C13.3557 2.41309 13.2797 2.42825 13.2088 2.45771C13.1378 2.48717 13.0734 2.53034 13.0192 2.58475Z"
                              fill="#222222"
                            />
                          </g>
                          <defs>
                            <clipPath id="clip0_2374_1886">
                              <rect width="14" height="14" fill="white" />
                            </clipPath>
                          </defs>
                        </svg>
                      </span>
                      {item.trim()}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

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

  const renderTable = () => {
    if (!deskData[activeTab] || deskData[activeTab].length === 0) {
      return (
        <div className={styles.noDataMessage}>
          No data available for {activeTab} period.
        </div>
      );
    }

    return (
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
                <div className={styles.rateLabel}>Daily rate</div>
                <div className={styles.price} style={{ fontSize: 18 }}>
                  {desk.price}
                </div>
                <div className={styles.access}>{desk.access}</div>
              </td>
            ))}
          </tr>
          <tr>
            {deskData[activeTab].map((desk, index) => (
              <td key={index}>
                <div className={styles.description}>{desk.description}</div>
              </td>
            ))}
          </tr>
          <tr>
            {deskData[activeTab].map((desk, index) => (
              <td key={index}>
                <div className={styles.description}>
                  {desk.Additional_Information && (
                    <ul
                      style={{
                        listStyleType: "none",
                        padding: 0,
                        margin: 0,
                        textAlign: "left",
                      }}
                    >
                      {desk.Additional_Information.split(";").map((item, i) => (
                        <li
                          key={i}
                          style={{
                            marginBottom: "6px",
                            display: "flex",
                            alignItems: "flex-start",
                          }}
                        >
                          <span style={{ marginRight: "8px" }}>
                            <svg
                              width="14"
                              height="14"
                              viewBox="0 0 14 14"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <g clipPath="url(#clip0_2374_1886)">
                                <path
                                  d="M13.0192 2.58475L4.95816 10.6453C4.90396 10.6997 4.83955 10.7428 4.76863 10.7723C4.69771 10.8018 4.62167 10.8169 4.54487 10.8169C4.46807 10.8169 4.39203 10.8018 4.3211 10.7723C4.25018 10.7428 4.18577 10.6997 4.13158 10.6453L1.01424 7.525C0.960046 7.47059 0.895638 7.42742 0.824715 7.39796C0.753792 7.3685 0.67775 7.35334 0.600952 7.35334C0.524154 7.35334 0.448111 7.3685 0.377188 7.39796C0.306265 7.42742 0.241857 7.47059 0.18766 7.525C0.133248 7.5792 0.0900745 7.64361 0.0606152 7.71453C0.0311559 7.78546 0.0159912 7.8615 0.0159912 7.9383C0.0159912 8.01509 0.0311559 8.09114 0.0606152 8.16206C0.0900745 8.23298 0.133248 8.29739 0.18766 8.35159L3.30616 11.4695C3.63513 11.7979 4.08094 11.9823 4.54574 11.9823C5.01054 11.9823 5.45636 11.7979 5.78533 11.4695L13.8458 3.41075C13.9002 3.35657 13.9432 3.2922 13.9727 3.22133C14.0021 3.15046 14.0172 3.07448 14.0172 2.99775C14.0172 2.92103 14.0021 2.84505 13.9727 2.77418C13.9432 2.70331 13.9002 2.63894 13.8458 2.58475C13.7916 2.53034 13.7272 2.48717 13.6563 2.45771C13.5854 2.42825 13.5093 2.41309 13.4325 2.41309C13.3557 2.41309 13.2797 2.42825 13.2088 2.45771C13.1378 2.48717 13.0734 2.53034 13.0192 2.58475Z"
                                  fill="#222222"
                                />
                              </g>
                              <defs>
                                <clipPath id="clip0_2374_1886">
                                  <rect width="14" height="14" fill="white" />
                                </clipPath>
                              </defs>
                            </svg>
                          </span>
                          {item.trim()}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
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
    );
  };

  return (
    <div className={styles.container}>
      <div className={styles.titleContainer}>
        <span className={styles.title}>Find the Right Fit for Your Team</span>
        <div className={styles.tabContainer} style={{ height: "43px" }}>
          <motion.div
            className={styles.activeBackground2}
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
              style={{ whiteSpace: "nowrap", minWidth: "100px" }}
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
                {renderTable()}
              </div>

              <MobileCards />
            </>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default EventTable;
