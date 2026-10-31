import axios from "axios";

// Laptop par localhost backend use hoga.
// Mobile par jis IP se frontend open hua hai,
// usi IP par backend connect hoga.
const host = window.location.hostname;

export const API =
  host === "localhost" || host === "127.0.0.1"
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

export default api;