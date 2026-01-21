import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import MainLayout from "@/components/layout/main-layout";
import BookingChat from "@/components/BookingChat";
import type { BookingResponse } from "@/services/api/types";
import { getBookingById } from "@/services/api/bookingAPI";

const ChatPage: React.FC = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { bookingId } = useParams();

  const initialBooking = state?.booking as BookingResponse | undefined;
  const [booking, setBooking] = useState<BookingResponse | null>(
    initialBooking ?? null
  );
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string>();

  const needsEnrichment = useMemo(() => {
    if (!booking) return true;
    const hasNames = Boolean(booking.customerName) && Boolean(booking.employeeName);
    const hasConversation = Boolean(booking.conversationId);
    return !(hasNames && hasConversation);
  }, [booking]);

  useEffect(() => {
    let cancelled = false;
    const fetchBooking = async () => {
      if (!bookingId) return;
      if (!needsEnrichment) return;
      setLoading(true);
      setLoadError(undefined);
      try {
        const res = await getBookingById(bookingId);
        if (!cancelled && res) {
          setBooking(res);
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
  }, [bookingId, needsEnrichment]);

  if (!booking || !booking.conversationId) {
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

  return (
    <MainLayout>
      <div className="fixed inset-0 top-16 flex items-center justify-center px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="w-full max-w-6xl">
          <BookingChat booking={booking as BookingResponse & { conversationId: string }} />
        </div>
      </div>
    </MainLayout>
  );
};

export default ChatPage;
