import React from "react";
import styles from "./LogoCarousel.module.css";

const logos = [
  {
    id: 1,
    url: "http://35.176.180.59/wp-content/uploads/2025/02/image.png",
    alt: "Partner 1",
  },
  {
    id: 2,
    url: "http://35.176.180.59/wp-content/uploads/2025/02/Bashkia-Tirane.jpg",
    alt: "Partner 2",
  },
  {
    id: 3,
    url: "http://35.176.180.59/wp-content/uploads/2025/02/IDEMIA_Smart_Identity_3L_RGB.png",
    alt: "Partner 3",
  },
  {
    id: 4,
    url: "http://35.176.180.59/wp-content/uploads/2025/02/Logo-AADF_-Shkrimi-poshte-01.png",
    alt: "Partner 4",
  },
  {
    id: 5,
    url: "http://35.176.180.59/wp-content/uploads/2025/02/image-14.png",
    alt: "Partner 5",
  },
];

const LogoCarousel = () => {
  return (
    <div className={styles.carouselContainer}>
      <div className={styles.slider}>
        <div className={styles.slideTrack}>
          {/* Triple the logos for smoother infinite effect */}
          {[...logos, ...logos, ...logos].map((logo, index) => (
            <div key={`${logo.id}-${index}`} className={styles.slide}>
              <img src={logo.url} alt={logo.alt} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LogoCarousel;
