import axios from "axios";
// Reserved for future API adapters. The demo does not make real requests.
// Never put private secrets in VITE_* variables.
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "/api",
  timeout: 15000,
  headers: { Accept: "application/json" },
});
