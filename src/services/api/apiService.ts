import axios, { AxiosInstance } from "axios";
import {
  API_BASE_URL,
  REVOKE_REFRESH_TOKEN_URL,
  REFRESH_TOKEN_URL,
} from "@/services/api/apiUrl";
import { decodeAccessToken } from "./authService";

/**
 * Hjälpfunktion för att sätta en cookie.
 */
export function setCookie(name: string, value: string, days?: number) {
  let expires = "";
  if (days) {
    const date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    expires = "; expires=" + date.toUTCString();
  }
  document.cookie = name + "=" + value + expires + "; path=/;";
}

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

/**
 * Skapar en Axios-instans med bas-URL och withCredentials: true (så att cookies skickas med).
 */
export const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * Interceptor som hanterar accessToken-förnyelse vid 401-svar.
 * Nu skickar vi INTE med något token i request body, då backend läser token från den cookie som redan är satt.
 */
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      if (isRefreshing) {
        return new Promise((resolve) => {
          refreshSubscribers.push((token: string) => {
            originalRequest.headers["Authorization"] = `Bearer ${token}`;
            resolve(api(originalRequest));
          });
        });
      }

      isRefreshing = true;
      try {
        // Anropa refresh-endpointen utan att bifoga ett token i request body
        const response = await api.post<{ AccessToken: string }>(
          REFRESH_TOKEN_URL
        );
        const newToken = response.data.AccessToken;

        // Avkoda det nya tokenet och spara metadata
        const decoded = decodeAccessToken(newToken);
        localStorage.setItem(
          "refreshTokenExpiryTime",
          decoded.RefreshTokenExpiryTime
        );
        // Uppdatera accessToken-cookien med det nya tokenet
        setCookie("accessToken", newToken, 1);

        isRefreshing = false;
        onAccessTokenRefreshed(newToken);
        originalRequest.headers["Authorization"] = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (err) {
        isRefreshing = false;
        refreshSubscribers = [];
        return Promise.reject(err);
      }
    }
    return Promise.reject(error);
  }
);

/**
 * Meddelar alla köade förfrågningar att ett nytt token har erhållits.
 */
const onAccessTokenRefreshed = (token: string) => {
  refreshSubscribers.forEach((callback) => callback(token));
  refreshSubscribers = [];
};

/**
 * Anropar backend för att återkalla refreshToken,
 * och rensar sedan accessToken-cookien.
 */
export const revokeRefreshToken = async (): Promise<void> => {
  try {
    await api.post(REVOKE_REFRESH_TOKEN_URL);
    // Rensa accessToken-cookien
    document.cookie =
      "accessToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
  } catch (error) {
    console.error("Failed to revoke refresh token:", error);
  }
};
