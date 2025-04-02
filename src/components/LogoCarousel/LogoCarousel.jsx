import React, { useCallback } from "react";
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

const LogoCarousel = () => {
  const handleLogoClick = useCallback((e, link) => {
    e.preventDefault();

    // Try to communicate with parent window if in iframe
    if (window.parent !== window) {
      try {
        // Send message to parent window
        window.parent.postMessage({ type: "openLInkInside", link: link }, "*");
      } catch (error) {
        // Fallback to direct window.open if postMessage fails
        window.open(link);
      }
    } else {
      // If not in iframe, open directly
      window.open(link);
    }
  }, []);

  // Only duplicate logos once instead of twice to reduce DOM elements
  const displayLogos = [...logos, ...logos];

  return (
    <div className={styles.carouselContainer}>
      <div className={styles.slider}>
        <div className={styles.slideTrack}>
          {displayLogos.map((logo, index) => (
            <div
              key={`${logo.id}-${index}`}
              className={styles.slide}
              onClick={(e) => handleLogoClick(e, logo.link)}
              style={{ cursor: "pointer" }}
            >
              <img
                src={logo.url}
                alt={logo.alt}
                loading="lazy"
                width="200"
                height="100"
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
