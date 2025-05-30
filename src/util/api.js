/**
 * API configuration utility
 * Provides centralized access to API URLs and endpoints
 */

// Base API URL from environment variables
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// API endpoints
export const ENDPOINTS = {
  CONTACT: `${API_BASE_URL}/contact`,
  PRODUCTS: `${API_BASE_URL}/products`,
  CATEGORIES: `${API_BASE_URL}/categories`,
  LEADS: `${API_BASE_URL}/leads`,
  EVENT: `${API_BASE_URL}/event`,
  PRIVATE: `${API_BASE_URL}/private`
};

/**
 * Creates a full API URL for a given endpoint
 * @param {string} endpoint - The endpoint path
 * @returns {string} The complete API URL
 */
export const getApiUrl = (endpoint) => {
  return `${API_BASE_URL}${endpoint}`;
};
