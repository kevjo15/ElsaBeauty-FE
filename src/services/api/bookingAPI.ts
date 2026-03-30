import {
  GET_AVAILABLE_SLOTS_URL,
  CREATE_BOOKING_URL,
  GET_MY_BOOKINGS_URL,
  CANCEL_BOOKING_URL,
  GET_MY_ASSIGNED_BOOKINGS_URL,
  ASSIGN_EMPLOYEE_URL,
  GET_BOOKING_BY_ID_URL,
  API_BASE_URL,
} from "./apiUrl";
import { api } from "./apiService";
import {
  TimeSlot,
  DaySlots,
  BookingRequest,
  BookingResponse,
} from "./types";

/**
 * Gets available time slots for a service on a specific date.
 */
export async function getAvailableTimeSlots(
  serviceId: string,
  date: string
): Promise<TimeSlot[]> {
  try {
    const response = await api.get<DaySlots[]>(GET_AVAILABLE_SLOTS_URL, {
      params: { serviceId, date },
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
}

/**
 * Creates a new booking.
 */
export async function createBooking(
  bookingData: BookingRequest
): Promise<BookingResponse | null> {
  try {
    const response = await api.post<BookingResponse>(CREATE_BOOKING_URL, bookingData);
    return response.data;
  } catch (error) {
    console.error("Failed to create booking:", error);
    throw error;
  }
}

/**
 * Gets bookings for the current user.
 */
export async function getMyBookings(): Promise<BookingResponse[]> {
  try {
    const response = await api.get<BookingResponse[]>(GET_MY_BOOKINGS_URL);
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error("Failed to fetch my bookings:", error);
    return [];
  }
}

/**
 * Cancels a booking by ID.
 */
export async function cancelBooking(bookingId: string): Promise<boolean> {
  try {
    await api.delete(`${CANCEL_BOOKING_URL}/${bookingId}`);
    return true;
  } catch (error) {
    console.error("Failed to cancel booking:", error);
    return false;
  }
}

/**
 * Gets bookings assigned to the current employee.
 */
export async function getMyAssignedBookings(
  from?: Date,
  to?: Date
): Promise<BookingResponse[]> {
  try {
    const params: Record<string, string> = {};
    if (from) params.from = from.toISOString();
    if (to) params.to = to.toISOString();

    const response = await api.get<BookingResponse[]>(GET_MY_ASSIGNED_BOOKINGS_URL, {
      params,
    });
    return response.data ?? [];
  } catch (error) {
    console.error("Failed to fetch assigned bookings:", error);
    return [];
  }
}

/**
 * Assigns an employee to a booking.
 */
export async function assignEmployee(
  bookingId: string,
  employeeId: string
): Promise<BookingResponse | null> {
  try {
    const response = await api.put<BookingResponse>(
      `${ASSIGN_EMPLOYEE_URL}/${bookingId}`,
      { employeeId }
    );
    return response.data;
  } catch (error) {
    console.error("Failed to assign employee:", error);
    return null;
  }
}

/**
 * Gets all bookings (admin only).
 */
export async function getAllBookings(): Promise<BookingResponse[]> {
  try {
    const response = await api.get<BookingResponse[]>(`${API_BASE_URL}/bookings`);
    return response.data ?? [];
  } catch (error) {
    console.error("Failed to fetch all bookings:", error);
    return [];
  }
}

/**
 * Gets a booking by ID.
 */
export async function getBookingById(
  bookingId: string
): Promise<BookingResponse | null> {
  try {
    const response = await api.get<BookingResponse>(
      `${GET_BOOKING_BY_ID_URL}/${bookingId}`
    );
    return response.data ?? null;
  } catch (error) {
    console.error("Failed to fetch booking by id:", error);
    return null;
  }
}
