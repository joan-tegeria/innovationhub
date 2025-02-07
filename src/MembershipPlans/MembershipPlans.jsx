import React from "react";
import styles from "./MembershipPlans.module.css";
import wifiIcon from "../assets/wifi.svg";
import coffeeIcon from "../assets/coffe.svg";
import dedicatedIcon from "../assets/coffe.svg";
// Import Swiper React components
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Autoplay } from "swiper/modules";

// Import Swiper styles
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

const MEMBERSHIP_PLANS = [
  {
    title: "Private Office",
    price: "2500",
    description:
      "A fully equipped, private space for teams seeking maximum privacy.",
    features: [
      { text: "Private, lockable office space", icon: dedicatedIcon },
      {
        text: "Flexible seating arrangements for up to 260 people",
        icon: wifiIcon,
      },
      {
        text: "Access to communal kitchen and lounge area",
        icon: dedicatedIcon,
      },
      {
        text: "Flexible seating arrangements for up to 260 people",
        icon: dedicatedIcon,
      },
      {
        text: "Networking opportunities with like-minded individuals",
        icon: dedicatedIcon,
      },
    ],
    imageUrl: "http://35.176.180.59/wp-content/uploads/2024/11/image-15.png",
    buttonText: "Get a quote",
  },
  {
    title: "Dedicated Desk",
    price: "1200",
    description: "Your personal workspace in a collaborative environment.",
    features: [
      { text: "Reserved desk space", icon: dedicatedIcon },
      { text: "High-speed internet access", icon: wifiIcon },
      { text: "Free coffee and refreshments", icon: coffeeIcon },
      { text: "Access to common areas", icon: dedicatedIcon },
      { text: "Business address service", icon: dedicatedIcon },
    ],
    imageUrl: "http://35.176.180.59/wp-content/uploads/2024/11/image-15.png",
    buttonText: "Get a quote",
  },
  {
    title: "Event Space",
    price: "15,000",
    description: "Modern, flexible spaces for your next business event.",
    features: [
      { text: "Professional AV equipment", icon: dedicatedIcon },
      { text: "High-speed WiFi", icon: wifiIcon },
      { text: "Catering available", icon: coffeeIcon },
      { text: "Flexible seating layouts", icon: dedicatedIcon },
      { text: "Event support staff", icon: dedicatedIcon },
    ],
    imageUrl: "http://35.176.180.59/wp-content/uploads/2024/11/image-15.png",
    buttonText: "Book now",
  },
  {
    title: "Private Office",
    price: "2500",
    description:
      "A fully equipped, private space for teams seeking maximum privacy.",
    features: [
      { text: "Private, lockable office space", icon: dedicatedIcon },
      { text: "High-speed internet access", icon: wifiIcon },
      { text: "24/7 building access", icon: dedicatedIcon },
      { text: "Meeting room credits included", icon: dedicatedIcon },
      { text: "Mail and package handling", icon: dedicatedIcon },
    ],
    imageUrl: "http://35.176.180.59/wp-content/uploads/2024/11/image-15.png",
    buttonText: "Get a quote",
  },
  {
    title: "Dedicated Desk",
    price: "1200",
    description: "Your personal workspace in a collaborative environment.",
    features: [
      { text: "Reserved desk space", icon: dedicatedIcon },
      { text: "High-speed internet access", icon: wifiIcon },
      { text: "Free coffee and refreshments", icon: coffeeIcon },
      { text: "Access to common areas", icon: dedicatedIcon },
      { text: "Business address service", icon: dedicatedIcon },
    ],
    imageUrl: "http://35.176.180.59/wp-content/uploads/2024/11/image-15.png",
    buttonText: "Get a quote",
  },
  {
    title: "Event Space",
    price: "15,000",
    description: "Modern, flexible spaces for your next business event.",
    features: [
      { text: "Professional AV equipment", icon: dedicatedIcon },
      { text: "High-speed WiFi", icon: wifiIcon },
      { text: "Catering available", icon: coffeeIcon },
      { text: "Flexible seating layouts", icon: dedicatedIcon },
      { text: "Event support staff", icon: dedicatedIcon },
    ],
    imageUrl: "http://35.176.180.59/wp-content/uploads/2024/11/image-15.png",
    buttonText: "Book now",
  },
];

const PlanFeature = ({ icon, text }) => (
  <li className={styles.featureItem}>
    <img src={icon} alt="" className={styles.featureIcon} />
    <span>{text}</span>
  </li>
);

const PlanCard = ({ plan }) => (
  <div className={styles.planCard}>
    <div className={styles.planImageContainer}>
      <img src={plan.imageUrl} alt={plan.title} className={styles.planImage} />
    </div>
    <div className={styles.planContent}>
      <h2 className={styles.planTitle}>{plan.title}</h2>
      <div className={styles.priceSection}>
        <span className={styles.startingFrom}>Starting from</span>
        <span className={styles.price}>
          {plan.price} ALL {plan.price !== "15,000" && "/day"}
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
      <button className={styles.planButton}>{plan.buttonText}</button>
    </div>
  </div>
);

export default function MembershipPlans() {
  return (
    <section className={styles.membershipPlansContainer}>
      <Swiper
        modules={[Navigation, Pagination, Autoplay]}
        spaceBetween={40}
        slidesPerView={2.5}
        centeredSlides={true}
        navigation
        loop={true}
        // pagination={{ clickable: true }}
        autoplay={{
          delay: 30000,
          disableOnInteraction: false,
        }}
        breakpoints={
          {
            //   640: {
            //     slidesPerView: 1,
            //   },
            //   768: {
            //     slidesPerView: 2,
            //   },
            //   1024: {
            //     slidesPerView: 3,
            //   },
          }
        }
        className={styles.plansWrapper}
      >
        {MEMBERSHIP_PLANS.map((plan, index) => (
          <SwiperSlide key={index}>
            <PlanCard plan={plan} />
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  );
}
