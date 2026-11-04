import axios from "axios";

// Live site par backend usi address par hai jahan website hai.
// Laptop par localhost backend use hoga.
// Mobile par jis IP se frontend open hua hai,
// usi IP par backend connect hoga.
const { hostname: host, protocol, origin } = window.location;

export const API =
  protocol === "https:"
    ? origin
    : host === "localhost" || host === "127.0.0.1"
      ? "http://localhost:8080"
      : `http://${host}:8080`;

const api = axios.create({
  baseURL: API + "/api",
  timeout: 15000
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// A suspended or deleted account, or an expired session: go back to the login page.
api.interceptors.response.use(undefined, error => {
  if (error.response?.status === 401 && localStorage.getItem("token")) {
    localStorage.clear();
    window.location.assign("/login");
  }

  return Promise.reject(error);
});

export default api;