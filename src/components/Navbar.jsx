import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import "./Navbar.css";
import LogoImport from "../assets/Logo.png";

const Navbar = () => {
  const location = useLocation();
  const currentPath = location.pathname.replace(/^\/|\/$/g, "");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [logoSrc, setLogoSrc] = useState(LogoImport);

  const aboutUsPaths = ["about-us", "plug-and-play", "innovation-coworking"];
  const ourSolutionsPaths = [
    "services",
    "flexible-desk",
    "dedicated-desk",
    "private-offices",
  ];

  useEffect(() => {
    // Close mobile menu when route changes
    setIsMobileMenuOpen(false);
    setActiveDropdown(null);
  }, [location]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setIsMobileMenuOpen(false);
        setActiveDropdown(null);
      }
    };

    const handleOutsideClick = (e) => {
      if (!e.target.closest(".custom-nav-container")) {
        setIsMobileMenuOpen(false);
        setActiveDropdown(null);
      }
    };

    // Preload the logo image
    const img = new Image();
    img.onload = () => {
      setLogoSrc(LogoImport);
    };
    img.onerror = () => {
      // Fallback to the logo in the public directory
      setLogoSrc("/Logo.png");
    };
    img.src = LogoImport;

    window.addEventListener("resize", handleResize);
    document.addEventListener("click", handleOutsideClick);

    return () => {
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("click", handleOutsideClick);
    };
  }, []);

  const toggleMobileMenu = (e) => {
    e.stopPropagation();
    setIsMobileMenuOpen(!isMobileMenuOpen);
    if (!isMobileMenuOpen) {
      setActiveDropdown(null);
    }
  };

  const toggleDropdown = (dropdownName, e) => {
    if (window.innerWidth <= 768) {
      e.preventDefault();
      e.stopPropagation();
      setActiveDropdown(activeDropdown === dropdownName ? null : dropdownName);
    }
  };

  const scrollToBottom = () => {
    if (location.pathname !== "/") {
      window.location.href = "/";
    }
    const contactSection = document.getElementById("contact-section");
    contactSection?.scrollIntoView({ behavior: "smooth", block: "end" });
  };

  const handleLogoError = (e) => {
    console.error("Logo failed to load");
    // Try the public folder as fallback
    setLogoSrc("/Logo.png");
  };

  return (
    <div className="custom-nav-container">
      <div className="nav-content">
        <Link to="http://35.176.180.59/" className="logo-container">
          <img
            src={logoSrc}
            alt="Innovation Hub"
            className="nav-logo"
            onError={handleLogoError}
          />
        </Link>
        <div
          className={`nav-items-container ${isMobileMenuOpen ? "active" : ""}`}
        >
          <Link className="nav-item" to="http://35.176.180.59/">
            Home
          </Link>
          <div
            className={`dropdown ${activeDropdown === "about" ? "active" : ""}`}
          >
            <Link
              className={`nav-item our-solutions-nav-item ${
                activeDropdown === "about" ? "active" : ""
              }`}
              to="http://35.176.180.59/about"
              onClick={(e) => toggleDropdown("about", e)}
            >
              About
              <svg
                className="dropdown-icon"
                width="12"
                height="8"
                viewBox="0 0 12 8"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M1.41 0.589996L6 5.17L10.59 0.589996L12 2L6 8L0 2L1.41 0.589996Z"
                  fill="currentColor"
                />
              </svg>
            </Link>
            <div className="dropdown-content">
              <Link
                className="dropdown-item"
                to="http://35.176.180.59/about-us"
              >
                About us
              </Link>
              <Link
                className="dropdown-item"
                to="http://35.176.180.59/innovation-coworking"
              >
                Innovation & Coworking
              </Link>
              <Link
                className="dropdown-item"
                to="http://35.176.180.59/plug-and-play"
              >
                Plug And Play
              </Link>
            </div>
          </div>
          <div
            className={`dropdown ${
              activeDropdown === "solutions" ? "active" : ""
            }`}
          >
            <Link
              className={`nav-item our-solutions-nav-item solutions-link ${
                activeDropdown === "solutions" ? "active" : ""
              }`}
              to="http://35.176.180.59/services"
              onClick={(e) => toggleDropdown("solutions", e)}
            >
              Our Solutions
              <svg
                className="dropdown-icon"
                width="12"
                height="8"
                viewBox="0 0 12 8"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M1.41 0.589996L6 5.17L10.59 0.589996L12 2L6 8L0 2L1.41 0.589996Z"
                  fill="currentColor"
                />
              </svg>
            </Link>
            <div className="dropdown-content">
              <Link
                className="dropdown-item"
                to="http://35.176.180.59/flexible-desk"
              >
                Flexible Desk
              </Link>
              <Link
                className="dropdown-item"
                to="http://35.176.180.59/dedicated-desk"
              >
                Dedicated Desk
              </Link>
              <Link
                className="dropdown-item"
                to="http://35.176.180.59/private-offices"
              >
                Private Offices
              </Link>
            </div>
          </div>
          <Link className="nav-item" to="http://35.176.180.59/events-info">
            Events
          </Link>
          <Link className="nav-button" to="http://35.176.180.59/#contact">
            Join us
          </Link>
        </div>
        <button className="mobile-menu-button" onClick={toggleMobileMenu}>
          <div className={`hamburger-icon ${isMobileMenuOpen ? "active" : ""}`}>
            <span></span>
            <span></span>
            <span></span>
          </div>
        </button>
      </div>
      {/* <div className="social-media-container">
        <a href="#" target="_blank" rel="noopener noreferrer">
          <i className="fab fa-facebook-f"></i>
        </a>
        <a href="#" target="_blank" rel="noopener noreferrer">
          <i className="fab fa-instagram"></i>
        </a>
        <a href="#" target="_blank" rel="noopener noreferrer">
          <i className="fab fa-linkedin-in"></i>
        </a>
      </div> */}
    </div>
  );
};

export default Navbar;
