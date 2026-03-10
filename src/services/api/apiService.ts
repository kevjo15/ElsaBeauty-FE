import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from "axios";
import { REFRESH_TOKEN_URL, REVOKE_REFRESH_TOKEN_URL } from "@/services/api/apiUrl";
import { getAccessToken, setAccessToken, clearAccessToken } from "./tokenStore";

/**
 * Flag to prevent multiple simultaneous refresh attempts.
 */
let isRefreshing = false;

/**
 * Queue of requests waiting for token refresh to complete.
 */
let refreshSubscribers: Array<(token: string) => void> = [];

/**
 * Queue of requests that should be rejected after refresh failure.
 */
let failedQueue: Array<{ reject: (error: Error) => void }> = [];

/**
 * Shared Axios instance configured for the API.
 * Uses withCredentials to automatically send HttpOnly cookies.
 */
export const api: AxiosInstance = axios.create({
  withCredentials: true, // Required for sending/receiving HttpOnly cookies
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * Request interceptor: Attach Authorization header from memory-based token store.
 */
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getAccessToken();
    if (token) {
      config.headers.set("Authorization", `Bearer ${token}`);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Response interceptor: Handle 401 responses with automatic token refresh.
 *
 * When a 401 is received:
 * 1. If not already refreshing, attempt to refresh the token
 * 2. If already refreshing, queue the request to retry after refresh completes
 * 3. On successful refresh, retry the original request with new token
 * 4. On refresh failure, reject all queued requests and clear auth state
 */
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // Only handle 401 errors and avoid infinite loops
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    // Don't try to refresh if the refresh endpoint itself failed
    if (
      originalRequest.url?.includes("refreshAccessToken") ||
      originalRequest.url?.includes("revokeRefreshToken")
    ) {
      clearAccessToken();
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    // If already refreshing, queue this request
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        refreshSubscribers.push((token: string) => {
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${token}`;
          }
          resolve(api(originalRequest));
        });
        failedQueue.push({ reject });
      });
    }

    isRefreshing = true;

    try {
      // Attempt to refresh the token
      // The refresh token is automatically sent via HttpOnly cookie
      const response = await axios.post<{ accessToken: string }>(
        REFRESH_TOKEN_URL,
        {},
        {
          withCredentials: true,
        }
      );

      const newToken = response.data.accessToken;

      if (!newToken) {
        throw new Error("No access token received from refresh endpoint");
      }

      // Store the new token in memory
      setAccessToken(newToken);

      isRefreshing = false;

      // Notify all queued requests
      onAccessTokenRefreshed(newToken);

      // Retry the original request with the new token
      if (originalRequest.headers) {
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
      }
      return api(originalRequest);
    } catch (refreshError) {
      isRefreshing = false;

      // Clear the token from memory
      clearAccessToken();

      // Reject all queued requests
      processFailedQueue(new Error("Session expired. Please log in again."));

      return Promise.reject(refreshError);
    }
  }
);

/**
 * Notify all queued requests that a new token is available.
 */
function onAccessTokenRefreshed(token: string): void {
  refreshSubscribers.forEach((callback) => callback(token));
  refreshSubscribers = [];
  failedQueue = [];
}

/**
 * Reject all queued requests with an error.
 */
function processFailedQueue(error: Error): void {
  failedQueue.forEach(({ reject }) => reject(error));
  failedQueue = [];
  refreshSubscribers = [];
}

/**
 * Revoke the refresh token on the server (logout).
 * The refresh token cookie will be cleared by the server.
 */
export async function revokeRefreshToken(): Promise<void> {
  try {
    await api.post(REVOKE_REFRESH_TOKEN_URL);
  } catch (error) {
    console.error("Failed to revoke refresh token:", error);
  } finally {
    clearAccessToken();
  }
}

/**
 * Attempt to refresh the access token.
 * Used on app initialization to restore auth state from HttpOnly cookie.
 */
export async function refreshAccessToken(): Promise<string | null> {
  try {
    const response = await axios.post<{ accessToken: string }>(
      REFRESH_TOKEN_URL,
      {},
      {
        withCredentials: true,
      }
    );

    const newToken = response.data.accessToken;
    if (newToken) {
      setAccessToken(newToken);
      return newToken;
    }
    return null;
  } catch {
    clearAccessToken();
    return null;
  }
}
