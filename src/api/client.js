import axios from "axios";
export const apiClient = axios.create({
  baseURL: (
    import.meta.env.VITE_API_BASE_URL || "https://mail-system.ngrok.app"
  ).replace(/\/$/, ""),
  timeout: 20000,
  withCredentials: true,
  headers: { Accept: "application/json" },
});
let accessToken = null;
let refreshing = null;
let onExpired = () => {};
let generation = 0;
export function setSession(session) {
  accessToken = session?.accessToken || null;
}
export function clearSession() {
  generation++;
  accessToken = null;
}
export function onSessionExpired(callback) {
  onExpired = callback;
}
export async function refreshSession() {
  if (!refreshing) {
    const current = generation;
    refreshing = apiClient
      .post("/api/auth/refresh", undefined, { skipRefresh: true })
      .then(({ data }) => {
        if (current === generation) setSession(data);
        return data;
      })
      .finally(() => {
        refreshing = null;
      });
  }
  return refreshing;
}
apiClient.interceptors.request.use((config) => {
  if (accessToken && !config.skipRefresh)
    config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;
    if (
      error.response?.status === 401 &&
      config &&
      !config.skipRefresh &&
      !config.retried
    ) {
      config.retried = true;
      try {
        await refreshSession();
      } catch (refreshError) {
        clearSession();
        onExpired();
        throw refreshError;
      }
      return apiClient(config);
    }
    const data = error.response?.data;
    if (error.response?.status === 401 && config?.retried) {
      clearSession();
      onExpired();
    }
    error.message =
      typeof data === "string" ? data : data?.error || error.message;
    if (data?.details) error.message += `: ${JSON.stringify(data.details)}`;
    throw error;
  },
);
export async function request(method, url, data, params, options = {}) {
  return (await apiClient({ method, url, data, params, ...options })).data;
}
