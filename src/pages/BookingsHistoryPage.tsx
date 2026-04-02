import React, { useEffect, useMemo, useState } from "react";
import MainLayout from "@/components/layout/main-layout";
import {
  Calendar,
  Trash2,
  RefreshCw,
  Clock,
  CheckCircle2,
  XCircle,
  MessageCircle,
  CalendarDays,
  History,
} from "lucide-react";
import {
  cancelBooking,
  getMyBookings,
  type BookingResponse,
} from "@/services/api";
import { useServicesWithImages } from "@/hooks/useServicesWithImages";
import {
  differenceInDays,
  format,
  formatDistanceStrict,
  isAfter,
  isPast as isPastDate,
} from "date-fns";
import { sv } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { useUnreadCount } from "@/hooks/useUnreadCount";

type Tab = "upcoming" | "history";

const getStatusInfo = (status?: string, isPast?: boolean) => {
  const st = (status || "").toLowerCase();
  if (st.includes("cancel")) {
    return { text: "Avbokad", className: "badge-error", icon: XCircle };
  }
  if (st.includes("completed") || st.includes("done") || st.includes("finished") || isPast) {
    return { text: "Avslutad", className: "badge-success", icon: CheckCircle2 };
  }
  return { text: "Bokad", className: "badge-neutral", icon: Clock };
};

const ChatButtonWithBadge: React.FC<{ booking: BookingResponse }> = ({ booking }) => {
  const navigate = useNavigate();
  const unread = useUnreadCount(booking.conversationId);
  return (
    <button
      className="btn btn-primary btn-sm flex-1 sm:flex-none relative"
      onClick={() => navigate(`/chat/${booking.id}`, { state: { booking } })}
    >
      <MessageCircle className="h-4 w-4" />
      Chat
      {unread > 0 && (
        <span className="badge badge-error badge-xs absolute -top-1 -right-1 min-w-[18px] h-[18px] text-[10px]">
          {unread > 9 ? "9+" : unread}
        </span>
      )}
    </button>
  );
};

const BookingsHistoryPage: React.FC = () => {
  const [bookings, setBookings] = useState<BookingResponse[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [err, setErr] = useState<string | null>(null);
  const [active, setActive] = useState<Tab>("upcoming");
  const [canceling, setCanceling] = useState<string | null>(null);
  const { services } = useServicesWithImages();

  const serviceName = (serviceId: string) =>
    services.find((s) => s.id === serviceId)?.name || "Behandling";

  const refresh = async () => {
    setLoading(true);
    setErr(null);
    try {
      const data = await getMyBookings();
      setBookings(data);
    } catch {
      setErr("Kunde inte hämta bokningar just nu.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const now = new Date();
  const { upcoming, history } = useMemo(() => {
    const up: BookingResponse[] = [];
    const past: BookingResponse[] = [];
    for (const b of bookings) {
      const start = new Date(b.startTime);
      const end = new Date(b.endTime);
      const canceled = (b.status || "").toLowerCase().includes("cancel");
      if (!canceled && (isAfter(start, now) || isAfter(end, now))) {
        up.push(b);
      } else {
        past.push(b);
      }
    }
    up.sort(
      (a, b) =>
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );
    past.sort(
      (a, b) =>
        new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
    );
    return { upcoming: up, history: past };
  }, [bookings, now]);

  const handleCancel = async (bookingId: string) => {
    const ok = window.confirm("Är du säker på att du vill avboka denna tid?");
    if (!ok) return;
    setCanceling(bookingId);
    try {
      const success = await cancelBooking(bookingId);
      if (success) {
        setBookings((prev) => prev.filter((b) => b.id !== bookingId));
      } else {
        alert("Avbokning misslyckades. Försök igen.");
      }
    } finally {
      setCanceling(null);
    }
  };

  const BookingCard = ({ booking, canCancel }: { booking: BookingResponse; canCancel?: boolean }) => {
    const start = new Date(booking.startTime);
    const end = new Date(booking.endTime);
    const pastBooking = isPastDate(end);
    const daysUntil = differenceInDays(start, now);
    const isSoon = !pastBooking && daysUntil >= 0 && daysUntil <= 7;
    const durationLabel = formatDistanceStrict(start, end, { locale: sv });
    const statusInfo = getStatusInfo(booking.status, pastBooking);
    const StatusIcon = statusInfo.icon;

    return (
      <div className={`card bg-base-100 shadow-sm border border-base-200 hover:shadow-md transition-shadow ${pastBooking ? "opacity-75" : ""}`}>
        <div className="card-body p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            {/* Left: Main info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <span className={`badge ${statusInfo.className} gap-1`}>
                  <StatusIcon className="h-3 w-3" />
                  {statusInfo.text}
                </span>
                {isSoon && (
                  <span className="badge badge-secondary badge-outline">
                    {daysUntil === 0 ? "Idag" : `Om ${daysUntil} dag${daysUntil === 1 ? "" : "ar"}`}
                  </span>
                )}
              </div>

              <h3 className="font-semibold text-lg text-base-content truncate">
                {serviceName(booking.serviceId)}
              </h3>

              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-base-content/70">
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  {format(start, "d MMM yyyy", { locale: sv })}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  {format(start, "HH:mm")} - {format(end, "HH:mm")}
                </span>
                <span className="text-base-content/50">({durationLabel})</span>
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex flex-row sm:flex-col gap-2 sm:items-end">
              {booking.conversationId ? (
                <ChatButtonWithBadge booking={booking} />
              ) : (
                <div className="tooltip tooltip-left flex-1 sm:flex-none" data-tip="Chat aktiveras när behandlare tilldelats">
                  <button className="btn btn-ghost btn-sm w-full opacity-50" disabled>
                    <MessageCircle className="h-4 w-4" />
                    Chat
                  </button>
                </div>
              )}
              {canCancel && (
                <button
                  className="btn btn-ghost btn-sm text-error hover:bg-error/10 flex-1 sm:flex-none"
                  onClick={() => handleCancel(booking.id)}
                  disabled={canceling === booking.id}
                >
                  {canceling === booking.id ? (
                    <span className="loading loading-spinner loading-xs" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                  Avboka
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const List = ({
    items,
    emptyText,
    canCancel,
  }: {
    items: BookingResponse[];
    emptyText: string;
    canCancel?: boolean;
  }) => {
    if (!items.length) {
      return (
        <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
          <Calendar className="h-12 w-12 text-base-content/30" />
          <p className="text-base-content/60 max-w-xs">{emptyText}</p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {items.map((b) => (
          <BookingCard key={b.id} booking={b} canCancel={canCancel} />
        ))}
      </div>
    );
  };

  return (
    <MainLayout>
      <section className="mx-auto max-w-3xl px-4 py-6 pb-16">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-base-content">Mina bokningar</h1>
            <p className="text-sm text-base-content/60 mt-0.5">
              {upcoming.length} kommande · {history.length} avslutade
            </p>
          </div>
          <button
            className="btn btn-ghost btn-sm btn-circle"
            onClick={refresh}
            disabled={loading}
            title="Uppdatera"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>

        {err && (
          <div className="alert alert-error mb-6">
            <span>{err}</span>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-base-200 rounded-lg mb-6">
          <button
            className={`flex-1 btn btn-sm ${active === "upcoming" ? "btn-primary" : "btn-ghost"}`}
            onClick={() => setActive("upcoming")}
          >
            <CalendarDays className="h-4 w-4" />
            Kommande
            {upcoming.length > 0 && (
              <span className={`badge badge-sm ${active === "upcoming" ? "badge-primary-content bg-primary-content/20" : "badge-neutral"}`}>
                {upcoming.length}
              </span>
            )}
          </button>
          <button
            className={`flex-1 btn btn-sm ${active === "history" ? "btn-primary" : "btn-ghost"}`}
            onClick={() => setActive("history")}
          >
            <History className="h-4 w-4" />
            Historik
            {history.length > 0 && (
              <span className={`badge badge-sm ${active === "history" ? "badge-primary-content bg-primary-content/20" : "badge-neutral"}`}>
                {history.length}
              </span>
            )}
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="skeleton h-28 w-full rounded-xl" />
            ))}
          </div>
        ) : active === "upcoming" ? (
          <List
            items={upcoming}
            emptyText="Du har inga kommande bokningar. Boka en behandling för att komma igång!"
            canCancel
          />
        ) : (
          <List
            items={history}
            emptyText="Ingen historik ännu. Dina avslutade behandlingar visas här."
          />
        )}
      </section>
    </MainLayout>
  );
};

export default BookingsHistoryPage;
