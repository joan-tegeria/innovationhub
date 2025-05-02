import React, { createContext, useState, useEffect, useContext } from "react";
import api from "../util/axiosConfig";

// Create Context
const AuthContext = createContext();

// AuthContextProvider to wrap the app and provide the access token and token type
export const AuthProvider = ({ children }) => {
  const [accessToken, setAccessToken] = useState(null);
  const [tokenType, setTokenType] = useState(null);
  const [tokenLoading, setTokenLoading] = useState(true);
  const [error, setError] = useState(null);

  // Set tokens globally for axios interceptor
  useEffect(() => {
    if (accessToken && tokenType) {
      window._accessToken = accessToken;
      window._tokenType = tokenType;
    }
  }, [accessToken, tokenType]);

  // Fetch the access token and token type
  useEffect(() => {
    const fetchAuthToken = async () => {
      try {
        const response = await api.post(
          "https://66eujsebp8.execute-api.eu-central-1.amazonaws.com/prod/oauth2/token?grant_type=client_credentials",
          null,
          {
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
              Authorization:
                "Basic MmU1aG1mNDA2ZGQ0a3M5bzY4dnBnYm0yZWg6aGQ2am5sN3NuMXQ5NnVpbGw5MWp2MGdwdDR1bGptYnI4ZWhtZmhva284cTN2MWNuMjE5",
              Cookie: "XSRF-TOKEN=0c8a0bbd-22d7-4c95-b2dd-7b3fb432e8ed",
            },
          }
        );

        const { access_token, token_type } = response.data;
        setAccessToken(access_token);
        setTokenType(token_type);
      } catch (err) {
        setError(err.message);
        console.error("Error fetching auth token:", err);
      } finally {
        setTokenLoading(false);
      }
    };

    fetchAuthToken();
  }, []);

  return (
    <AuthContext.Provider
      value={{ accessToken, tokenType, tokenLoading, error }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
