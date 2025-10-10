import axios, { AxiosInstance } from "axios";
import {
  API_BASE_URL,
  REVOKE_REFRESH_TOKEN_URL,
  REFRESH_TOKEN_URL,
} from "@/services/api/apiUrl";
import { decodeAccessToken } from "./authService";

/**
 * Utility helper to set a cookie optionally scoped by lifetime in days.
 */
export function setCookie(name: string, value: string, days?: number) {
  let expires = "";
  if (days) {
    const date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    expires = "; expires=" + date.toUTCString();
  }
  document.cookie = `${name}=${value}${expires}; path=/;`;
}

let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

/**
 * Shared Axios instance configured for the API.
 */
export const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * Response interceptor that handles token refresh on 401 responses.
 */
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as typeof error.config & {
      _retry?: boolean;
    };
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      if (isRefreshing) {
        return new Promise((resolve) => {
          refreshSubscribers.push((token: string) => {
            originalRequest.headers = {
              ...originalRequest.headers,
              Authorization: `Bearer ${token}`,
            };
            resolve(api(originalRequest));
          });
        });
      }

      isRefreshing = true;
      try {
        const response = await api.post<{ AccessToken: string }>(
          REFRESH_TOKEN_URL
        );
        const newToken = response.data.AccessToken;

        const decoded = decodeAccessToken(newToken);
        localStorage.setItem(
          "refreshTokenExpiryTime",
          decoded.RefreshTokenExpiryTime
        );
        setCookie("accessToken", newToken, 1);

        isRefreshing = false;
        onAccessTokenRefreshed(newToken);
        originalRequest.headers = {
          ...originalRequest.headers,
          Authorization: `Bearer ${newToken}`,
        };
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
 * Notify pending requests that a new access token is available.
 */
const onAccessTokenRefreshed = (token: string) => {
  refreshSubscribers.forEach((callback) => callback(token));
  refreshSubscribers = [];
};

/**
 * Revoke the refresh token on the server and clear the access token cookie.
 */
export const revokeRefreshToken = async (): Promise<void> => {
  try {
    await api.post(REVOKE_REFRESH_TOKEN_URL);
    document.cookie = "accessToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
  } catch (error) {
    console.error("Failed to revoke refresh token:", error);
  }
};
