import type { BookingResponse } from "@/services/api/types";
import {
  getAllBookings,
  getBookingById,
  getMyAssignedBookings,
  getMyBookings,
} from "@/services/api/bookingAPI";

interface ResolveChatBookingParams {
  bookingId?: string;
  conversationId?: string;
  role?: string;
}

function getEmployeeLookupRange() {
  const now = new Date();
  const from = new Date(now);
  const to = new Date(now);
  from.setFullYear(now.getFullYear() - 1);
  to.setFullYear(now.getFullYear() + 2);
  return { from, to };
}

function normalize(value?: string): string {
  return (value ?? "").trim().toLowerCase();
}

function needsEnrichment(booking: BookingResponse | null): boolean {
  if (!booking) return true;
  return !(
    booking.conversationId &&
    booking.startTime &&
    booking.endTime &&
    booking.serviceName &&
    booking.customerName &&
    booking.employeeName
  );
}

export async function resolveChatBooking({
  bookingId,
  conversationId,
  role,
}: ResolveChatBookingParams): Promise<BookingResponse | null> {
  const normalizedBookingId = normalize(bookingId);
  const normalizedConversationId = normalize(conversationId);
  const normalizedRole = normalize(role);
  const isAdmin = normalizedRole.includes("admin");
  const isEmployee = normalizedRole.includes("employee");

  let resolvedBooking: BookingResponse | null = null;

  if (normalizedBookingId) {
    resolvedBooking = await getBookingById(bookingId!);
  }

  if (
    normalizedConversationId &&
    (!resolvedBooking || needsEnrichment(resolvedBooking) || normalize(resolvedBooking.conversationId) !== normalizedConversationId)
  ) {
    const { from, to } = getEmployeeLookupRange();
    const bookings = isAdmin
      ? await getAllBookings()
      : isEmployee
        ? await getMyAssignedBookings(from, to)
        : await getMyBookings();

    const matchedBooking =
      bookings.find(
        (candidate) =>
          normalize(candidate.conversationId) === normalizedConversationId ||
          (!!normalizedBookingId && normalize(candidate.id) === normalizedBookingId)
      ) ?? null;

    if (matchedBooking) {
      resolvedBooking = resolvedBooking ? { ...resolvedBooking, ...matchedBooking } : matchedBooking;
    }
  }

  return resolvedBooking;
}
