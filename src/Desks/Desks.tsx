import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './DeskBooking.module.css';
import Dedicated from "../assets/dedicated.svg"
import Flexible from "../assets/flexible.svg"
const deskData = {
  daily: [
    {
      type: "Flexible Desk",
      description: "Ideal for freelancers, remote workers, and digital nomads who need a flexible and collaborative workspace.",
      price: "12 EUR",
      access: "for 24 hours access"
    },
    {
      type: "Dedicated Desk",
      description: "Your personal, reserved workspace in a productive and inspiring open environment.",
      price: "15 EUR",
      access: "for 24 hours access"
    }
  ],
  weekly: [
    {
      type: "Flexible Desk",
      description: "Ideal for freelancers, remote workers, and digital nomads who need a flexible and collaborative workspace.",
      price: "50 EUR",
      access: "for 7 days access"
    },
    {
      type: "Dedicated Desk",
      description: "Your personal, reserved workspace in a productive and inspiring open environment.",
      price: "65 EUR",
      access: "for 7 days access"
    }
  ],
  monthly: [
    {
      type: "Flexible Desk",
      description: "Ideal for freelancers, remote workers, and digital nomads who need a flexible and collaborative workspace.",
      price: "180 EUR",
      access: "for 30 days access"
    },
    {
      type: "Dedicated Desk",
      description: "Your personal, reserved workspace in a productive and inspiring open environment.",
      price: "220 EUR",
      access: "for 30 days access"
    }
  ]
};

const DeskBooking = () => {
  const [activeTab, setActiveTab] = useState('daily');

  return (
    <div className={styles.container}>
        <div className={styles.titleContainer}>
      <span className={styles.title}>Desks</span>
      <div className={styles.tabContainer}>
        {['daily', 'weekly', 'monthly'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`${styles.tab} ${activeTab === tab ? styles.activeTab : ''}`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>
      </div>
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className={styles.grid}
        >
          {deskData[activeTab].map((desk, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: index === 0 ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className={styles.card}
            >
                <div className={styles.imgContainer}>

            <img src={desk.type === "Dedicated Desk" ? Dedicated : Flexible} alt="" />
                </div>
              <span className={styles.cardTitle}>{desk.type}</span>
              <span className={styles.description}>{desk.description}</span>
              <div className={styles.cardInfo}>
                <span className={styles.rateLabel}>Daily rate</span>
                <span className={styles.price}>{desk.price}</span>
                <span className={styles.access}>{desk.access}</span>
              </div>
              <button className={styles.button}>Book Now</button>
            </motion.div>
          ))}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default DeskBooking;