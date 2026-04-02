const rawApiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();
const trimTrailingSlash = (value: string) => value.replace(/\/+$/, "");
const isLocalDevHost = (host: string) =>
  host === "localhost" || host === "127.0.0.1" || host === "[::1]";

export const API_BASE_URL = rawApiBaseUrl || "/api";

function resolveSignalRBaseUrl(): string {
  const envSignalRBaseUrl = import.meta.env.VITE_SIGNALR_BASE_URL?.trim();
  if (envSignalRBaseUrl) {
    try {
      const parsed = new URL(
        envSignalRBaseUrl,
        typeof window !== "undefined" ? window.location.origin : undefined
      );

      // In local dev, prefer Vite's same-origin proxy instead of a direct backend
      // hub URL. That keeps hub auth/session behavior aligned with the rest of the app
      // and avoids browser-specific cross-origin differences.
      if (
        typeof window !== "undefined" &&
        isLocalDevHost(parsed.hostname) &&
        isLocalDevHost(window.location.hostname)
      ) {
        return window.location.origin;
      }

      return trimTrailingSlash(parsed.toString());
    } catch {
      return trimTrailingSlash(envSignalRBaseUrl);
    }
  }

  if (API_BASE_URL.startsWith("http://") || API_BASE_URL.startsWith("https://")) {
    try {
      return trimTrailingSlash(new URL(API_BASE_URL).origin);
    } catch {
      // Fallback to current origin below
    }
  }

  if (typeof window !== "undefined") {
    return trimTrailingSlash(window.location.origin);
  }

  return "";
}

export const SIGNALR_BASE_URL = resolveSignalRBaseUrl();

// Specific endpoints
export const REGISTER_URL = `${API_BASE_URL}/auth/register`;
export const LOGIN_URL = `${API_BASE_URL}/auth/login`;
export const REVOKE_REFRESH_TOKEN_URL = `${API_BASE_URL}/auth/logout`;
export const REFRESH_TOKEN_URL = `${API_BASE_URL}/auth/refresh`;

export const ME_URL = `${API_BASE_URL}/me`;
export const USER_NAME_URL = `${API_BASE_URL}/me/name`;

// Service endpoints
export const GET_ALL_SERVICES_URL = `${API_BASE_URL}/services`;
export const GET_ALL_SERVICES_WITH_SAS_URL = `${API_BASE_URL}/services/with-sas`;

// Category endpoints
export const GET_ALL_CATEGORIES_URL = `${API_BASE_URL}/categories`;
export const GET_CATEGORIES_WITH_SERVICES_URL = `${API_BASE_URL}/categories/with-services`;

/* Booking endpoints */
export const CREATE_BOOKING_URL = `${API_BASE_URL}/bookings`;
export const GET_AVAILABLE_SLOTS_URL = `${API_BASE_URL}/bookings/availability`;
export const GET_MY_BOOKINGS_URL = `${API_BASE_URL}/bookings/me`;
export const CANCEL_BOOKING_URL = `${API_BASE_URL}/bookings`;
export const GET_MY_ASSIGNED_BOOKINGS_URL = `${API_BASE_URL}/bookings/assigned`;
export const GET_BOOKING_BY_ID_URL = `${API_BASE_URL}/bookings`;
export const ASSIGN_EMPLOYEE_URL = `${API_BASE_URL}/bookings`;

/* Notification endpoints */
export const NOTIFICATIONS_URL = `${API_BASE_URL}/notifications`;

/* Chat endpoints */
export const CHAT_HUB_URL = `${SIGNALR_BASE_URL}/chatHub`;
export const NOTIFICATION_HUB_URL = `${SIGNALR_BASE_URL}/notificationHub`;
export const getConversationMessagesUrl = (conversationId: string) =>
  `${API_BASE_URL}/conversations/${conversationId}/messages`;
export const sendConversationMessageUrl = (conversationId: string) =>
  `${API_BASE_URL}/conversations/${conversationId}/messages`;

/* Employee endpoints */
export const GET_EMPLOYEES_URL = `${API_BASE_URL}/users/employees`;
