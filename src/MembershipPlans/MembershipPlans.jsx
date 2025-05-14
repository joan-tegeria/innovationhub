import React, { useEffect, useState } from "react";
import styles from "./MembershipPlans.module.css";
import wifiIcon from "../assets/wifi.svg";
import coffeeIcon from "../assets/coffe.svg";
import dedicatedIcon from "../assets/dedicated.svg";
// Import Swiper React components
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Autoplay } from "swiper/modules";
import api from "../util/axiosConfig";
import { CircularProgress } from "@mui/material";
// Import Swiper styles
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

const transformApiDataToPlans = (apiData) => {
  return apiData.map((item) => {
    const facilities = item.Facilities.split("\n");
    console.log(item.Price);

    // Extract only the numeric part from the price
    let numericPrice = item.Price;
    if (typeof item.Price === "string" && item.Price.includes("ALL")) {
      numericPrice = item.Price.replace("ALL", "").trim();
    }

    return {
      title: item.Name,
      price: numericPrice, // Only store the numeric part
      description: item.Description,
      features: facilities.map((facility) => ({
        text: facility,
        icon: coffeeIcon,
      })),
      imageUrl: "https://hubitat.al/wp-content/uploads/2024/11/image-15.png",
      buttonText: "Get a quote",
    };
  });
};

const PlanFeature = ({ icon, text }) => (
  <li className={styles.featureItem}>
    <img src={icon} alt="" className={styles.featureIcon} />
    <span>{text}</span>
  </li>
);

const getRedirectUrl = (title) => {
  switch (title) {
    case "Dedicated Desk":
      return "https://hubitat.al/services/dedicated-desk/";
    case "Event Space":
      return "https://hubitat.al/events-info/";
    case "Private Office":
      return "https://hubitat.al/services/private-offices/";
    default:
      return "https://hubitat.al/services"; // Default URL or handle error
  }
};

const handleButtonClick = (plan) => {
  const url = getRedirectUrl(plan.title);
  console.log("Button is being clicked", plan.title);
  if (window.self !== window.top) {
    window.parent.location.href = url;
  } else {
    window.location.href = url;
  }
};

const PlanCard = ({ plan }) => (
  <div className={styles.planCard}>
    <div className={styles.planImageContainer}>
      <img src={plan.imageUrl} alt={plan.title} className={styles.planImage} />
      <h2 className={styles.planTitle}>{plan.title}</h2>
    </div>
    <div className={styles.planContent}>
      <div className={styles.priceSection}>
        <span className={styles.startingFrom}>Starting from</span>
        <span className={styles.price}>
          {plan.price ? Number(plan.price).toLocaleString() : 0} ALL
          {plan.price.includes("300") ? "" : "/Day"}
        </span>
      </div>
      <p className={styles.description}>{plan.description}</p>
      <div className={styles.featuresSection}>
        <h3 className={styles.featuresTitle}>What's Included:</h3>
        <ul className={styles.featuresList}>
          {plan.features.map((feature, index) => (
            <PlanFeature key={index} {...feature} />
          ))}
        </ul>
      </div>
      <button
        className={styles.planButton}
        style={{ borderRadius: 4 }}
        onClick={() => handleButtonClick(plan)}
      >
        {plan.buttonText}
      </button>
    </div>
  </div>
);

export default function MembershipPlans() {
  const [plans, setPlans] = useState([]);
  const [slidesPerView, setSlidesPerView] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoading(true);
        const response = await api.get(
          "https://acas4w1lnk.execute-api.eu-central-1.amazonaws.com/prod/categories"
        );
        const transformedPlans = transformApiDataToPlans(response.data.data);
        // Duplicate the plans array with new unique keys
        const duplicatedPlans = [
          ...transformedPlans.map((plan) => ({
            ...plan,
            id: `original-${plan.title}`,
          })),
          ...transformedPlans.map((plan) => ({
            ...plan,
            id: `duplicate-${plan.title}`,
          })),
        ];
        setPlans(duplicatedPlans);
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching products:", error);
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  if (isLoading) {
    return (
      <section
        style={{
          width: "100%",
          height: 450,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <CircularProgress
          size={40}
          thickness={4}
          sx={{
            color: "#EB3778",
          }}
        />
      </section>
    );
  }

  return (
    <section className={styles.membershipPlansContainer}>
      <div className={styles.gradientLeft}></div>
      <div className={styles.gradientRight}></div>
      <Swiper
        modules={[Navigation, Pagination, Autoplay]}
        spaceBetween={40}
        slidesPerView={1}
        centeredSlides={true}
        initialSlide={Math.floor(plans.length / 4)}
        navigation
        loop={true}
        autoplay={{
          delay: 3000,
          disableOnInteraction: false,
        }}
        className={styles.plansWrapper}
        breakpoints={{
          // Mobile and small tablets - show exactly one card, centered
          320: {
            slidesPerView: 1,
            centeredSlides: true,
          },
          480: {
            slidesPerView: 1,
            centeredSlides: true,
          },
          640: {
            slidesPerView: 1,
            centeredSlides: true,
          },
          // Medium-sized tablets and up - start showing partial cards
          771: {
            slidesPerView: 1.6,
            centeredSlides: true,
          },
          1025: {
            slidesPerView: 2,
            centeredSlides: true,
          },
          1200: {
            slidesPerView: 2.4,
            centeredSlides: true,
          },
          1500: {
            slidesPerView: 2.5,
            centeredSlides: true,
          },
        }}
      >
        {plans.map((plan) => (
          <SwiperSlide key={plan.id}>
            <PlanCard plan={plan} />
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  );
}
