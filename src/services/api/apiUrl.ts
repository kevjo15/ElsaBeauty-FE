const rawApiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();

export const API_BASE_URL = rawApiBaseUrl || "/api";

function resolveSignalRBaseUrl(): string {
  const envSignalRBaseUrl = import.meta.env.VITE_SIGNALR_BASE_URL?.trim();
  if (envSignalRBaseUrl) {
    return envSignalRBaseUrl;
  }

  if (API_BASE_URL.startsWith("http://") || API_BASE_URL.startsWith("https://")) {
    try {
      return new URL(API_BASE_URL).origin;
    } catch {
      // Fallback to current origin below
    }
  }

  if (typeof window !== "undefined") {
    return window.location.origin;
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

/* Chat endpoints */
export const CHAT_HUB_URL = `${SIGNALR_BASE_URL}/chatHub`;
export const NOTIFICATION_HUB_URL = `${SIGNALR_BASE_URL}/notificationHub`;
export const getConversationMessagesUrl = (conversationId: string) =>
  `${API_BASE_URL}/conversations/${conversationId}/messages`;
export const sendConversationMessageUrl = (conversationId: string) =>
  `${API_BASE_URL}/conversations/${conversationId}/messages`;

/* Employee endpoints */
export const GET_EMPLOYEES_URL = `${API_BASE_URL}/users/employees`;
