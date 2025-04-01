import React from "react";
import styles from "./LogoCarousel.module.css";

const logos = [
  {
    id: 1,
    url: "http://35.176.180.59/wp-content/uploads/2025/02/image.png",
    alt: "Plug and Play",
    link: "https://www.plugandplaytechcenter.com/",
  },
  {
    id: 2,
    url: "http://35.176.180.59/wp-content/uploads/2025/02/Bashkia-Tirane.jpg",
    alt: "Bashkia e Tiranes",
    link: "https://www.tirana.al/",
  },
  {
    id: 3,
    url: "http://35.176.180.59/wp-content/uploads/2025/02/IDEMIA_Smart_Identity_3L_RGB.png",
    alt: "Idemia",
    link: "https://www.aadf.org/",
  },
  {
    id: 4,
    url: "http://35.176.180.59/wp-content/uploads/2025/02/Logo-AADF_-Shkrimi-poshte-01.png",
    alt: "AADF",
    link: "https://www.idemia.com/",
  },
  {
    id: 5,
    url: "http://35.176.180.59/wp-content/uploads/2025/02/image-14.png",
    alt: "Piramida",
    link: "https://piramida.edu.al/",
  },
];

const handleLogoClick = (link) => {
  if (window.self !== window.top) {
    window.parent.open(link, "_blank");
  } else {
    window.open(link, "_blank");
  }
};

const LogoCarousel = () => {
  return (
    <div className={styles.carouselContainer}>
      <div className={styles.slider}>
        <div className={styles.slideTrack}>
          {/* Triple the logos for smoother infinite effect */}
          {[...logos, ...logos, ...logos].map((logo, index) => (
            <div
              key={`${logo.id}-${index}`}
              className={styles.slide}
              onClick={() => {
                handleLogoClick(logo.link);
              }}
              style={{ cursor: "pointer" }}
            >
              <img
                src={logo.url}
                alt={logo.alt}
                style={{ cursor: "pointer" }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LogoCarousel;
