import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import MainLayout from "@/components/layout/main-layout";
import BookingChat from "@/components/BookingChat";
import type { BookingResponse } from "@/services/api/types";
import { useAuth } from "@/services/api/authContext";
import { resolveChatBooking } from "@/services/chat/resolveChatBooking";

type RoutedChatBooking = Partial<BookingResponse> & {
  id: string;
  conversationId: string;
};

const ChatPage: React.FC = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { bookingId } = useParams();
  const { user } = useAuth();

  const initialBooking = state?.booking as BookingResponse | RoutedChatBooking | undefined;
  const [booking, setBooking] = useState<BookingResponse | RoutedChatBooking | null>(
    initialBooking ?? null
  );
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string>();
  const attemptedLookupKeyRef = useRef<string | null>(null);
  const role = user?.role?.toLowerCase() ?? "";

  const needsEnrichment = useMemo(() => {
    if (!booking) return true;
    return (
      !booking.conversationId ||
      !booking.startTime ||
      !booking.endTime ||
      !booking.serviceName ||
      !booking.customerName ||
      !booking.employeeName
    );
  }, [booking]);

  useEffect(() => {
    let cancelled = false;
    const fetchBooking = async () => {
      if (!needsEnrichment) return;
      const lookupKey = `${bookingId ?? ""}|${booking?.conversationId ?? ""}|${role}`;
      if (attemptedLookupKeyRef.current === lookupKey) return;

      attemptedLookupKeyRef.current = lookupKey;
      setLoading(true);
      setLoadError(undefined);
      try {
        const res = await resolveChatBooking({
          bookingId,
          conversationId: booking?.conversationId,
          role,
        });
        if (!cancelled && res) {
          setBooking((prev) => ({ ...(prev ?? {}), ...res }));
        } else if (!cancelled && !res) {
          setLoadError("Kunde inte hämta bokningen.");
        }
      } catch (err) {
        if (!cancelled) setLoadError("Kunde inte hämta bokningen.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void fetchBooking();
    return () => {
      cancelled = true;
    };
  }, [bookingId, booking?.conversationId, needsEnrichment, role]);

  if (!booking?.conversationId) {
    return (
      <MainLayout>
        <div className="max-w-3xl mx-auto px-4 py-12 space-y-4">
          <h1 className="text-2xl font-bold">Chat</h1>
          <p className="text-base-content/70">
            {loading
              ? "Laddar bokning..."
              : "Ingen chat-data hittades. Öppna chatten via din bokningslista."}
          </p>
          {loadError && <p className="text-error text-sm">{loadError}</p>}
          <button className="btn btn-primary" onClick={() => navigate(-1)} disabled={loading}>
            Tillbaka
          </button>
          {bookingId && (
            <p className="text-xs text-base-content/50">BookingId: {bookingId}</p>
          )}
        </div>
      </MainLayout>
    );
  }

  const bookingForChat: BookingResponse & { conversationId: string } = {
    id: booking.id || bookingId || booking.conversationId,
    userId: booking.userId || "",
    serviceId: booking.serviceId || "",
    startTime: booking.startTime || "",
    endTime: booking.endTime || "",
    conversationId: booking.conversationId,
    employeeId: booking.employeeId,
    isChatOpen: booking.isChatOpen,
    status: booking.status,
    employeeName: booking.employeeName,
    customerName: booking.customerName,
    serviceName: booking.serviceName,
    user: booking.user,
    employee: booking.employee,
    service: booking.service,
  };

  return (
    <MainLayout>
      <div className="fixed inset-0 top-16 flex items-center justify-center px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="w-full max-w-6xl">
          <BookingChat booking={bookingForChat} />
        </div>
      </div>
    </MainLayout>
  );
};

export default ChatPage;
