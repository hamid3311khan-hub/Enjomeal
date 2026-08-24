import axios from "axios";

const API = axios.create({
  baseURL: "https://enjomeal-api.onrender.com/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach restaurant token automatically
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("enjoMealRestaurantToken");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle unauthorized request
API.interceptors.response.use(
  (response) => response,

  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("enjoMealRestaurantToken");
      localStorage.removeItem("enjoMealRestaurantUser");
    }

    return Promise.reject(error);
  }
);

export default API;