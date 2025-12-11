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
        <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-base-300 bg-base-200/40 py-16 text-center">
          <CalendarClock className="h-8 w-8 text-base-content/50" />
          <p className="max-w-sm text-sm text-base-content/70">{emptyText}</p>
        </div>
      );
    }

    return (
      <ol className="space-y-6">
        {items.map((b) => {
          const start = new Date(b.startTime);
          const end = new Date(b.endTime);
          const pastBooking = isPastDate(end);
          const daysUntil = differenceInDays(start, now);
          const isSoon = !pastBooking && daysUntil >= 0 && daysUntil <= 7;
          const durationLabel = formatDistanceStrict(start, end, {
            locale: sv,
          });
  const cardBackground = pastBooking
    ? "bg-base-100/90 border-base-300/50"
    : "bg-base-100/95 border-primary/20 shadow-[0_18px_40px_-22px_rgba(236,72,153,0.45)] dark:shadow-[0_18px_40px_-22px_rgba(236,72,153,0.28)]";
  const accentBadge = pastBooking
    ? "border-base-300 bg-base-100 text-base-content/60"
    : "border-primary/20 bg-primary/90 text-primary-content";

          return (
            <li key={b.id}>
              <article
                className={`relative overflow-hidden rounded-2xl border backdrop-blur transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl ${cardBackground}`}
              >
                <span
                  className={`absolute left-5 top-5 flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors ${accentBadge}`}
                >
                  <CalendarClock className="h-4 w-4" />
                </span>

                <div className="flex flex-col gap-6 p-6 pl-20 md:flex-row md:items-center md:justify-between">
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <p className="text-xs font-semibold uppercase tracking-wide text-base-content/60">
                        {format(start, "EEEE d MMMM yyyy", { locale: sv })}
                      </p>
                      <h3 className="text-xl font-semibold text-base-content">
                        {serviceName(b.serviceId)}
                      </h3>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-sm text-base-content/70">
                      <span className="inline-flex items-center gap-2 rounded-full border border-base-300/60 bg-base-100/80 px-3 py-1">
                        <Clock className="h-3.5 w-3.5" />
                        {format(start, "HH:mm", { locale: sv })} -{" "}
                        {format(end, "HH:mm", { locale: sv })}
                      </span>
                      <span className="inline-flex items-center gap-2 rounded-full border border-base-300/60 bg-base-100/70 px-3 py-1">
                        Varaktighet: {durationLabel}
                      </span>
                      {isSoon && (
                        <span className="inline-flex items-center gap-2 rounded-full bg-warning/15 px-3 py-1 text-warning">
                          <Clock className="h-3.5 w-3.5" />
                          {daysUntil === 0
                            ? "Idag"
                            : `Om ${daysUntil} dag${daysUntil === 1 ? "" : "ar"}`}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-stretch gap-3 md:items-end">
                    <div>{statusBadge(b.status)}</div>
                    {canCancel && (
                      <button
                        className="btn btn-outline btn-error btn-sm w-full md:btn-md md:w-auto"
                        onClick={() => handleCancel(b.id)}
                        disabled={canceling === b.id}
                        title="Avboka"
                      >
                        {canceling === b.id ? (
                          <>
                            <span className="loading loading-spinner loading-xs" />
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
              </article>
            </li>
          );
        })}
      </ol>
    );
  };

  return (
    <MainLayout>
      <section className="mx-auto max-w-5xl space-y-8 px-4 pb-16">
        <div className="rounded-3xl border border-base-300/40 bg-base-100/75 p-6 shadow-lg backdrop-blur dark:bg-base-200/70">
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-primary/12 p-3 text-primary ring-2 ring-primary/15">
              <CalendarClock className="h-5 w-5" />
            </span>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-base-content">
                Bokningar
              </h1>
              <p className="text-sm text-base-content/70">
                Se kommande tider, historik och hantera avbokningar.
              </p>
            </div>
            <button
              className="btn btn-ghost btn-sm ml-auto"
              onClick={refresh}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Uppdatera
            </button>
          </div>

          {err && (
            <div className="alert alert-error mt-6">
              <span>{err}</span>
            </div>
          )}

          <div className="mt-6 grid gap-3 text-sm sm:grid-cols-3">
            <div className="rounded-2xl border border-base-300/40 bg-base-100/90 p-4 shadow-sm">
              <p className="text-xs uppercase tracking-wide text-base-content/60">
                Totalt
              </p>
              <p className="mt-2 text-2xl font-semibold text-base-content">
                {upcoming.length + history.length}
              </p>
              <p className="text-xs text-base-content/60">bokningar</p>
            </div>
            <div className="rounded-2xl border border-primary/20 bg-primary/6 p-4 shadow-sm shadow-[0_12px_30px_-24px_rgba(236,72,153,0.6)]">
              <p className="text-xs uppercase tracking-wide text-primary/75">
                Kommande
              </p>
              <p className="mt-2 text-2xl font-semibold text-primary">
                {upcoming.length}
              </p>
              <p className="text-xs text-primary/70">bokningar kvar</p>
            </div>
            <div className="rounded-2xl border border-base-300/40 bg-base-100/90 p-4 shadow-sm">
              <p className="text-xs uppercase tracking-wide text-base-content/60">
                Historik
              </p>
              <p className="mt-2 text-2xl font-semibold text-base-content">
                {history.length}
              </p>
              <p className="text-xs text-base-content/60">
                avslutade behandlingar
              </p>
            </div>
          </div>

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

          <div className="rounded-b-2xl border-x border-b border-base-300/50 bg-base-100/92 p-6 dark:bg-base-200/70">
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="skeleton h-24 w-full rounded-2xl" />
                ))}
              </div>
            ) : active === "upcoming" ? (
              <List
                items={upcoming}
                emptyText="Du har inga kommande bokningar ännu. Utforska våra behandlingar och boka din nästa tid."
                canCancel
              />
            ) : (
              <List
                items={history}
                emptyText="Ingen historik ännu. När du avslutat en behandling hamnar den här."
              />
            )}
          </div>
        </div>
      </section>
    </MainLayout>
  );
};

export default BookingsHistoryPage;
