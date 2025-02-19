import React, { useEffect, useState } from "react";
import styles from "./MembershipPlans.module.css";
import wifiIcon from "../assets/wifi.svg";
import coffeeIcon from "../assets/coffe.svg";
import dedicatedIcon from "../assets/dedicated.svg";
// Import Swiper React components
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Autoplay } from "swiper/modules";
import api from "../utility/axiosConfig";

// Import Swiper styles
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

const transformApiDataToPlans = (apiData) => {
  return apiData.map((item) => {
    const facilities = item.Facilities.split("\n");
    return {
      title: item.Name,
      price: item.Price, // Keep the full price string including currency
      description: item.Description,
      features: facilities.map((facility) => ({
        text: facility,
        icon: coffeeIcon,
      })),
      imageUrl: "http://35.176.180.59/wp-content/uploads/2024/11/image-15.png",
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
      return "http://35.176.180.59/services/flexible-desk/";
    case "Event Space":
      return "http://35.176.180.59/events-info/";
    case "Private Office":
      return "http://35.176.180.59/services/private-offices/";
    default:
      return "http://35.176.180.59/services"; // Default URL or handle error
  }
};

const handleButtonClick = (plan) => {
  const url = getRedirectUrl(plan.title);
  console.log("Button is being clicked", plan.title);
  window.location.href = url;
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
          {plan.price}
          {plan.price.includes("300") ? "" : "/day"}
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

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await api.get(
          "https://nhpvz8wphf.execute-api.eu-central-1.amazonaws.com/prod/categories"
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
      } catch (error) {
        console.error("Error fetching products:", error);
      }
    };

    fetchProducts();
  }, []);

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
          900: {
            slidesPerView: 1.7,
          },
          1024: {
            slidesPerView: 1.9,
          },
          1280: {
            slidesPerView: 2.5,
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
