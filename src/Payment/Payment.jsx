import React, { useEffect, useState } from "react";
import styles from "./Payment.modules.css";
import { Chip } from "@mui/material";
import { useAuth } from "../context/Auth";
import api from "../utility/axiosConfig";

export default function Payment() {
  const { accessToken, tokenType } = useAuth();
  const [couponCode, setCouponCode] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [validCoupon, setValidCoupon] = useState(null);
  const [price, setPrice] = useState(0);
  const [currentPrice, setCurrentPrice] = useState(0);

  // Format price as currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "ALL",
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(value);
  };

  // Fetch the initial price when the component mounts
  useEffect(() => {
    // Here you would fetch the initial price from your API or get it from props
    // For now, let's use a placeholder value
    const initialPrice = 2000; // in ALL
    setPrice(initialPrice);
    setCurrentPrice(initialPrice);
  }, []);

  const handleApplyCoupon = async (code) => {
    if (!code) return;

    setCouponLoading(true);

    try {
      const response = await api.get(
        `https://nhpvz8wphf.execute-api.eu-central-1.amazonaws.com/prod/coupon?coupon=${code}`,
        {
          headers: { Authorization: `${tokenType} ${accessToken}` },
        }
      );
      // Handle successful coupon application here
      console.log("Coupon response:", response.data);
      setValidCoupon(
        response.data.discount || response.data.couponData.Coupon_Value
      );

      // Calculate the discounted price
      if (response.data.value) {
        setPrice(response.data.value);
      } else if (
        response.data.couponData &&
        response.data.couponData.Coupon_Value
      ) {
        setPrice(
          currentPrice -
            (currentPrice * response.data.couponData.Coupon_Value) / 100
        );
      }
    } catch (error) {
      console.error("Error applying coupon:", error);
      setValidCoupon(null);
    } finally {
      setCouponLoading(false);
    }
  };

  const removeCoupon = () => {
    setValidCoupon(null);
    setCouponCode("");
    setPrice(currentPrice);
  };

  return (
    <div className={styles.formBody}>
      <h1 className={styles.mainTitle}>Payment</h1>
      <p className={styles.subtitle}>Complete payment information</p>

      <h2 className={styles.sectionTitle}>Order details</h2>

      {/* Coupon Section */}
      <div className={styles.couponSection}>
        <h2 className={styles.sectionTitle}>Do you have a discount code?</h2>
        <span style={{ fontSize: 14 }}>
          Apply it at checkout to get a special discount on your order.
          <div className={styles.couponInputContainer}>
            {validCoupon ? (
              <div className={styles.couponChip}>
                <Chip
                  label={couponCode}
                  onDelete={removeCoupon}
                  color="primary"
                  variant="outlined"
                  style={{ height: 48, fontSize: 16 }}
                />
              </div>
            ) : (
              <>
                <input
                  type="text"
                  placeholder="Code"
                  className={styles.couponInputField}
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                />
                <button
                  className={styles.couponButton}
                  onClick={() => handleApplyCoupon(couponCode)}
                  disabled={couponLoading}
                >
                  {couponLoading ? "Applying..." : "Apply"}
                </button>
              </>
            )}
          </div>
        </span>
      </div>

      {validCoupon && (
        <div className={styles.discountInfo}>
          <div className={styles.discountRow}>
            <span>Discount code:</span>
            <span>{couponCode}</span>
          </div>
          <div className={styles.discountRow}>
            <span>Discount percentage:</span>
            <span>{((validCoupon / currentPrice) * 100).toFixed(0)}%</span>
          </div>
          <div className={styles.subtotalRow}>
            <span>Subtotal:</span>
            <span className={styles.subtotalAmount}>
              {formatCurrency(-validCoupon)}
            </span>
          </div>
        </div>
      )}

      <div className={styles.totalSection}>
        <div className={styles.totalRow}>
          <span>TOTAL:</span>
          <span className={styles.totalAmount}>{formatCurrency(price)}</span>
        </div>
      </div>

      <button className={styles.paymentButton}>Proceed to Payment</button>
    </div>
  );
}
