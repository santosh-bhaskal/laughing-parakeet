import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

// Environment-driven API URL (Expo requires EXPO_PUBLIC_ prefix to be available in client JS)
const envMode = (process.env.EXPO_PUBLIC_ENVIRONMENT || "PROD").toUpperCase();

export const DEFAULT_API_URL =
  envMode === "DEV"
    ? process.env.EXPO_PUBLIC_API_URL_DEV || "https://miffed-carl-cyclicly.ngrok-free.dev"
    : process.env.EXPO_PUBLIC_API_URL_PROD ||
      "https://miffed-carl-cyclicly.ngrok-free.dev";

export const apiClient = axios.create({
  baseURL: `${DEFAULT_API_URL}/api`,
  timeout: 12000,
  headers: {
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "true",
    Accept: "application/json",
  },
});

// Allow dynamic server address change (e.g. switching between Wi-Fi IP and ngrok)
export const updateApiBaseUrl = async (newUrl: string) => {
  const formatted = newUrl.endsWith("/") ? newUrl.slice(0, -1) : newUrl;
  const fullBase = formatted.endsWith("/api") ? formatted : `${formatted}/api`;
  apiClient.defaults.baseURL = fullBase;
  await AsyncStorage.setItem("@custom_api_url", fullBase);
};

// Auto-restore saved server address on app startup
export const initApiConfig = async () => {
  try {
    const savedUrl = await AsyncStorage.getItem("@custom_api_url");
    if (savedUrl) {
      apiClient.defaults.baseURL = savedUrl;
    }
  } catch (err) {
    console.warn("Could not restore saved API URL", err);
  }
};

// Inject stored auth token
apiClient.interceptors.request.use(async (config) => {
  try {
    const token = await AsyncStorage.getItem("@auth_token");
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (e) {
    console.warn("Error reading token from AsyncStorage", e);
  }
  return config;
});

// Unauthorized (401) listener
let onUnauthorizedCallback: (() => void) | null = null;
export const setOnUnauthorizedCallback = (cb: () => void) => {
  onUnauthorizedCallback = cb;
};

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Clear token on unauthorized
      await AsyncStorage.removeItem("@auth_token");
      await AsyncStorage.removeItem("@auth_user");
      onUnauthorizedCallback?.();
    }
    return Promise.reject(error);
  },
);

export default apiClient;
