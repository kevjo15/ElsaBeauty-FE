export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

// Specific endpoints
export const REGISTER_URL = `${API_BASE_URL}/register`;
export const LOGIN_URL = `${API_BASE_URL}/User/login`;
export const REVOKE_REFRESH_TOKEN_URL = `${API_BASE_URL}/User/revokeRefreshToken`;
export const REFRESH_TOKEN_URL = `${API_BASE_URL}/User/refreshAccessToken`;

//export const ME_URL = `${API_BASE_URL}/User/me`;
export const ME_URL = "/api/User/me";
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
