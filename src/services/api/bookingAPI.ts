import {
  GET_AVAILABLE_SLOTS_URL,
  CREATE_BOOKING_URL,
  GET_MY_BOOKINGS_URL,
  CANCEL_BOOKING_URL,
  REFRESH_TOKEN_URL,
} from "./apiUrl";
import { api, setCookie } from "./apiService";
import {
  TimeSlot,
  DaySlots,
  BookingRequest,
  BookingResponse,
} from "./types";

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
    const accessToken = document.cookie
      .split("; ")
      .find((row) => row.startsWith("accessToken="))
      ?.split("=")[1];

    const response = await fetch(CREATE_BOOKING_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken ?? ""}`,
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

    return (await response.json()) as BookingResponse;
  } catch (error) {
    console.error("Failed to create booking:", error);
    throw error;
  }
};

export const getMyBookings = async (): Promise<BookingResponse[]> => {
  try {
    const getAccessToken = () =>
      document.cookie
        .split("; ")
        .find((row) => row.startsWith("accessToken="))
        ?.split("=")[1];

    let accessToken = getAccessToken();

    let res = await fetch(GET_MY_BOOKINGS_URL, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken ?? ""}`,
      },
      credentials: "include",
    });

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

export const cancelBooking = async (bookingId: string): Promise<boolean> => {
  try {
    const getAccessToken = () =>
      document.cookie
        .split("; ")
        .find((row) => row.startsWith("accessToken="))
        ?.split("=")[1];

    let accessToken = getAccessToken();

    let res = await fetch(`${CANCEL_BOOKING_URL}/${bookingId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${accessToken ?? ""}`,
      },
      credentials: "include",
    });

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
