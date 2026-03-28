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
export const REGISTER_URL = `${API_BASE_URL}/User/register`;
export const LOGIN_URL = `${API_BASE_URL}/User/login`;
export const REVOKE_REFRESH_TOKEN_URL = `${API_BASE_URL}/User/revokeRefreshToken`;
export const REFRESH_TOKEN_URL = `${API_BASE_URL}/User/refreshAccessToken`;

export const ME_URL = `${API_BASE_URL}/User/me`;
export const USER_NAME_URL = `${API_BASE_URL}/User/me/name`;

// Service endpoints
export const GET_ALL_SERVICES_URL = `${API_BASE_URL}/Service/GetAllServices`;
export const GET_ALL_SERVICES_WITH_SAS_URL = `${API_BASE_URL}/Service/GetAllServicesWithSas`;

// Category endpoints
export const GET_ALL_CATEGORIES_URL = `${API_BASE_URL}/categories/GetAllCategories`;
export const GET_CATEGORIES_WITH_SERVICES_URL = `${API_BASE_URL}/categories/GetCategoriesWithServices`;

/* Booking endpoints */
export const CREATE_BOOKING_URL = `${API_BASE_URL}/Booking/CreateBooking`;
export const GET_AVAILABLE_SLOTS_URL = `${API_BASE_URL}/Booking/available-time-slots`;
export const GET_MY_BOOKINGS_URL = `${API_BASE_URL}/Booking/GetBookingsByUserId/MyBookings`;
export const CANCEL_BOOKING_URL = `${API_BASE_URL}/Booking/CancelBooking`;
export const GET_MY_ASSIGNED_BOOKINGS_URL = `${API_BASE_URL}/Booking/MyAssigned`;
export const GET_BOOKING_BY_ID_URL = `${API_BASE_URL}/Booking/GetBookingByBookingId`;
export const ASSIGN_EMPLOYEE_URL = `${API_BASE_URL}/Booking/AssignEmployee`;

/* Chat endpoints */
export const CHAT_HUB_URL = `${SIGNALR_BASE_URL}/chatHub`;
export const NOTIFICATION_HUB_URL = `${SIGNALR_BASE_URL}/notificationHub`;
export const getConversationMessagesUrl = (conversationId: string) =>
  `${API_BASE_URL}/conversations/${conversationId}/GetMessagesForConversation`;
export const sendConversationMessageUrl = (conversationId: string) =>
  `${API_BASE_URL}/conversations/${conversationId}/SendMessage`;

/* Employee endpoints */
export const GET_EMPLOYEES_URL = `${API_BASE_URL}/User/employees`;
