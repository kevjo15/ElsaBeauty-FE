import React, { useEffect, useMemo, useState } from "react";
import MainLayout from "@/components/layout/main-layout";
import {
  CalendarClock,
  Trash2,
  RefreshCw,
  Clock,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import {
  getMyBookings,
  cancelBooking,
  type BookingResponse,
} from "@/services/api";
import { useServicesWithImages } from "@/hooks/useServicesWithImages";
import { format, isAfter } from "date-fns";
import { sv } from "date-fns/locale";

type Tab = "upcoming" | "history";

const statusBadge = (status?: string) => {
  if (!status) return null;
  const st = status.toLowerCase();
  if (st.includes("cancel")) {
    return (
      <span className="badge badge-outline border-error/40 text-error">
        <XCircle className="h-3.5 w-3.5 mr-1" />
        Avbokad
      </span>
    );
  }
  if (
    st.includes("completed") ||
    st.includes("done") ||
    st.includes("finished")
  ) {
    return (
      <span className="badge badge-outline border-success/40 text-success">
        <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
        Klar
      </span>
    );
  }
  return (
    <span className="badge badge-outline border-primary/40 text-primary">
      <Clock className="h-3.5 w-3.5 mr-1" />
      Bokad
    </span>
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
    // Sorteringslogik: kommande närmast först, historik senaste först
    up.sort(
      (a, b) =>
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );
    past.sort(
      (a, b) =>
        new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
    );
    return { upcoming: up, history: past };
  }, [bookings]);

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

  const List = ({
    items,
    emptyText,
    canCancel,
  }: {
    items: BookingResponse[];
    emptyText: string;
    canCancel?: boolean;
  }) => {
    if (items.length === 0) {
      return (
        <div className="card bg-base-100 ring-1 ring-base-300/60">
          <div className="card-body items-center text-center">
            <p className="text-base-content/70">{emptyText}</p>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {items.map((b) => {
          const start = new Date(b.startTime);
          const end = new Date(b.endTime);
          return (
            <div
              key={b.id}
              className="card bg-base-100 ring-1 ring-base-300/60 hover:shadow-md transition-shadow"
            >
              <div className="card-body">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <CalendarClock className="h-4 w-4 text-primary" />
                      <span className="font-medium">
                        {format(start, "EEEE d MMMM yyyy 'kl.' HH:mm", {
                          locale: sv,
                        })}
                      </span>
                    </div>
                    <div className="text-sm text-base-content/70">
                      {serviceName(b.serviceId)} • {format(start, "HH:mm")}–
                      {format(end, "HH:mm")}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {statusBadge(b.status)}
                    {canCancel && (
                      <button
                        className="btn btn-outline btn-error btn-sm"
                        onClick={() => handleCancel(b.id)}
                        disabled={canceling === b.id}
                        title="Avboka"
                      >
                        {canceling === b.id ? (
                          <>
                            <span className="loading loading-spinner loading-xs"></span>
                            Avbokar...
                          </>
                        ) : (
                          <>
                            <Trash2 className="h-4 w-4" />
                            Avboka
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <MainLayout>
      <section className="max-w-4xl mx-auto">
        <div className="flex items-center gap-2">
          <span className="rounded-full p-2 bg-primary/10 text-primary ring-1 ring-primary/20">
            <CalendarClock className="h-5 w-5" />
          </span>
          <h1 className="text-3xl font-bold tracking-tight">Bokningar</h1>
          <button
            className="btn btn-ghost btn-sm ml-auto"
            onClick={refresh}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Uppdatera
          </button>
        </div>
        <p className="mt-2 text-base-content/70">
          Se kommande tider, historik och avboka vid behov.
        </p>

        {err && (
          <div className="alert alert-error my-4">
            <span>{err}</span>
          </div>
        )}

        <div role="tablist" className="tabs tabs-lifted mt-6">
          <button
            role="tab"
            className={`tab ${active === "upcoming" ? "tab-active" : ""}`}
            onClick={() => setActive("upcoming")}
          >
            Kommande ({upcoming.length})
          </button>
          <button
            role="tab"
            className={`tab ${active === "history" ? "tab-active" : ""}`}
            onClick={() => setActive("history")}
          >
            Historik ({history.length})
          </button>
        </div>

        <div className="p-6 border-x border-b border-base-300 bg-base-100 rounded-b-lg">
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="skeleton h-20 w-full" />
              ))}
            </div>
          ) : active === "upcoming" ? (
            <List
              items={upcoming}
              emptyText="Inga kommande bokningar."
              canCancel
            />
          ) : (
            <List items={history} emptyText="Ingen historik ännu." />
          )}
        </div>
      </section>
    </MainLayout>
  );
};

export default BookingsHistoryPage;
