import axios, { AxiosInstance } from "axios";
import {
  API_BASE_URL,
  REVOKE_REFRESH_TOKEN_URL,
  REFRESH_TOKEN_URL,
  USER_NAME_URL,
  GET_AVAILABLE_SLOTS_URL,
  CREATE_BOOKING_URL,
  GET_ALL_SERVICES_URL,
  GET_ALL_SERVICES_WITH_SAS_URL,
  GET_ALL_CATEGORIES_URL,
  GET_CATEGORIES_WITH_SERVICES_URL,
  GET_MY_BOOKINGS_URL,
  CANCEL_BOOKING_URL,
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

// Service interfaces
export interface Service {
  id: string;
  name: string;
  description: string;
  duration: string;
  price: number;
  imageUrl: string;
}

export interface Category {
  name: string;
}

export interface CategoryWithServices {
  id: string;
  name: string;
  services: Service[];
}

// User interfaces
export interface UserNameDTO {
  firstName: string;
  lastName: string;
}

// Booking interfaces
export interface TimeSlot {
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

export interface DaySlots {
  date: string;
  availableSlots: TimeSlot[];
}

export interface BookingRequest {
  userId: string;
  serviceId: string;
  startTime: string;
  endTime: string;
}

export interface BookingResponse {
  id: string;
  userId: string;
  serviceId: string;
  startTime: string;
  endTime: string;
  status?: string;
}

// Service API functions
export const getAllServices = async (): Promise<Service[]> => {
  try {
    const response = await api.get<Service[]>(GET_ALL_SERVICES_URL);
    return response.data;
  } catch (error) {
    console.error("Failed to fetch services:", error);
    return [];
  }
};

export const getAllServicesWithSas = async (): Promise<Service[]> => {
  try {
    const response = await api.get<Service[]>(GET_ALL_SERVICES_WITH_SAS_URL);
    return response.data;
  } catch (error) {
    console.error("Failed to fetch services with SAS:", error);
    return [];
  }
};

// Category API functions
export const getAllCategories = async (): Promise<Category[]> => {
  try {
    const response = await api.get<Category[]>(GET_ALL_CATEGORIES_URL);
    return response.data;
  } catch (error) {
    console.error("Failed to fetch categories:", error);
    return [];
  }
};

// User API functions
export const getUserName = async (): Promise<UserNameDTO | null> => {
  try {
    const response = await api.get<UserNameDTO>(USER_NAME_URL);
    return response.data;
  } catch (error) {
    console.error("Failed to fetch user name:", error);
    return null;
  }
};

export const getCategoriesWithServices = async (): Promise<
  CategoryWithServices[]
> => {
  try {
    const response = await api.get<CategoryWithServices[]>(
      GET_CATEGORIES_WITH_SERVICES_URL
    );
    return response.data;
  } catch (error) {
    console.error("Failed to fetch categories with services:", error);
    return [];
  }
};

// Booking API functions
export const getAvailableTimeSlots = async (
  serviceId: string,
  date: string
): Promise<TimeSlot[]> => {
  try {
    const response = await api.get<DaySlots[]>(GET_AVAILABLE_SLOTS_URL, {
      params: {
        serviceId,
        date,
      },
    });

    // Extract all available slots from all days
    const availableSlots: TimeSlot[] = [];
    response.data.forEach((day) => {
      day.availableSlots.forEach((slot) => {
        if (slot.isAvailable) {
          availableSlots.push(slot);
        }
      });
    });

    return availableSlots;
  } catch (error) {
    console.error("Failed to fetch available time slots:", error);
    return [];
  }
};

export const createBooking = async (
  bookingData: BookingRequest
): Promise<BookingResponse | null> => {
  try {
    // Get the access token from cookie
    const accessToken = document.cookie
      .split("; ")
      .find((row) => row.startsWith("accessToken="))
      ?.split("=")[1];

    // Use fetch instead of axios to match the test frontend implementation
    const response = await fetch(CREATE_BOOKING_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(bookingData),
      credentials: "include",
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Booking error response:", errorText);
      throw new Error(
        `Failed to create booking: ${response.status} ${response.statusText}`
      );
    }

    return await response.json();
  } catch (error) {
    console.error("Failed to create booking:", error);
    throw error;
  }
};

/* Bookings - fetch my bookings */
export const getMyBookings = async (): Promise<BookingResponse[]> => {
  try {
    const getAccessToken = () =>
      document.cookie
        .split("; ")
        .find((row) => row.startsWith("accessToken="))
        ?.split("=")[1];

    let accessToken = getAccessToken();

    // First attempt using fetch (avoid axios interceptor to prevent 415 on refresh)
    let res = await fetch(GET_MY_BOOKINGS_URL, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken ?? ""}`,
      },
      credentials: "include",
    });

    // If unauthorized, try cookie-based refresh without JSON content-type, then retry
    if (res.status === 401) {
      const refreshRes = await fetch(REFRESH_TOKEN_URL, {
        method: "POST",
        credentials: "include",
      });
      if (refreshRes.ok) {
        const data = (await refreshRes.json()) as { AccessToken?: string };
        if (data?.AccessToken) {
          setCookie("accessToken", data.AccessToken, 1);
          accessToken = data.AccessToken;
        }
        res = await fetch(GET_MY_BOOKINGS_URL, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken ?? ""}`,
          },
          credentials: "include",
        });
      }
    }

    if (!res.ok) {
      const text = await res.text();
      console.error("getMyBookings error:", res.status, text);
      return [];
    }

    const data = (await res.json()) as BookingResponse[];
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Failed to fetch my bookings:", error);
    return [];
  }
};

/* Bookings - cancel by id */
export const cancelBooking = async (bookingId: string): Promise<boolean> => {
  try {
    const getAccessToken = () =>
      document.cookie
        .split("; ")
        .find((row) => row.startsWith("accessToken="))
        ?.split("=")[1];

    let accessToken = getAccessToken();

    // First attempt
    let res = await fetch(`${CANCEL_BOOKING_URL}/${bookingId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${accessToken ?? ""}`,
      },
      credentials: "include",
    });

    // If unauthorized, refresh and retry
    if (res.status === 401) {
      const refreshRes = await fetch(REFRESH_TOKEN_URL, {
        method: "POST",
        credentials: "include",
      });
      if (refreshRes.ok) {
        const data = (await refreshRes.json()) as { AccessToken?: string };
        if (data?.AccessToken) {
          setCookie("accessToken", data.AccessToken, 1);
          accessToken = data.AccessToken;
        }
        res = await fetch(`${CANCEL_BOOKING_URL}/${bookingId}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${accessToken ?? ""}`,
          },
          credentials: "include",
        });
      }
    }

    if (!res.ok) {
      const text = await res.text();
      console.error("cancelBooking error:", res.status, text);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Failed to cancel booking:", error);
    return false;
  }
};
