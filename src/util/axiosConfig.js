import axios from 'axios';

// Create a custom axios instance
const api = axios.create();

// Flag to prevent multiple refresh token requests
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

// Request interceptor
api.interceptors.request.use(
    (config) => {
        // Get the token from localStorage (we'll update this to use context)
        const token = window._accessToken;
        const tokenType = window._tokenType;

        if (token && tokenType) {
            config.headers.Authorization = `${tokenType} ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // If the error is not 401 or the request was for refreshing token, reject
        if (error.response?.status !== 401 || originalRequest.url?.includes('oauth2/token')) {
            return Promise.reject(error);
        }

        if (isRefreshing) {
            // If refreshing, queue the request
            return new Promise((resolve, reject) => {
                failedQueue.push({ resolve, reject });
            })
                .then(() => {
                    return api(originalRequest);
                })
                .catch(err => {
                    return Promise.reject(err);
                });
        }

        isRefreshing = true;

        try {
            // Get new token
            const response = await axios.post(
                "https://nhpvz8wphf.execute-api.eu-central-1.amazonaws.com/prod/oauth2/token?grant_type=client_credentials",
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

            // Update global tokens
            window._accessToken = access_token;
            window._tokenType = token_type;

            // Update the failed request's authorization header
            originalRequest.headers.Authorization = `${token_type} ${access_token}`;

            processQueue(null, access_token);

            return api(originalRequest);
        } catch (err) {
            processQueue(err, null);
            return Promise.reject(err);
        } finally {
            isRefreshing = false;
        }
    }
);

export default api; 