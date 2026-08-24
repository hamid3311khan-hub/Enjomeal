import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Automatically attach login token
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("enjoMealToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle authentication errors
API.interceptors.response.use(
  (response) => response,

  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("enjoMealToken");
      localStorage.removeItem("enjoMealUser");

      // current page ko save karke login pe bhejo
      if (window.location.pathname !== "/login") {
        const currentPath = window.location.pathname + window.location.search;
        window.location.href = `/login?from=${encodeURIComponent(currentPath)}`;
      }
    }

    return Promise.reject(error);
  }
);

export default API;