import React, { useEffect, useMemo, useState } from "react";
import MainLayout from "@/components/layout/main-layout";
import BookingChat from "@/components/BookingChat";
import { useAuth } from "@/services/api/authContext";
import {
  assignEmployee,
  getAllBookings,
  getMyAssignedBookings,
} from "@/services/api/bookingAPI";
import { getEmployees } from "@/services/api/userAPI";
import { getAllServices } from "@/services/api/serviceAPI";
import type { BookingResponse, Employee, Service } from "@/services/api/types";
import { addDays, format, startOfDay } from "date-fns";
import { sv } from "date-fns/locale";
import { MessageCircle, User } from "lucide-react";
import { useUnreadCount } from "@/hooks/useUnreadCount";

// Helper to get customer display name
const customerName = (b: BookingResponse): string => {
  const name = [b.user?.firstName, b.user?.lastName].filter(Boolean).join(" ");
  return name || b.customerName || b.user?.email || "Okänd kund";
};

// Helper to get booking status badge
const getStatusBadge = (b: BookingResponse): { text: string; className: string } => {
  const now = new Date();
  const start = new Date(b.startTime);
  const end = new Date(b.endTime);

  // If explicit status exists, use it
  if (b.status) {
    const s = b.status.toLowerCase();
    if (s.includes("cancel")) return { text: "Avbokad", className: "badge-error" };
    if (s.includes("complete")) return { text: "Avslutad", className: "badge-success" };
  }

  // Otherwise calculate from time
  if (end < now) return { text: "Avslutad", className: "badge-success" };
  if (start <= now && end >= now) return { text: "Pågående", className: "badge-warning" };
  return { text: "Bokad", className: "badge-info" };
};

// Chat button with unread badge
const ChatButtonWithBadge: React.FC<{
  booking: BookingResponse;
  userId: string;
  onClick: (e: React.MouseEvent) => void;
  size?: "xs" | "sm";
}> = ({ booking, userId, onClick, size = "xs" }) => {
  const unread = useUnreadCount(booking.conversationId, userId);

  return (
    <button
      className={`btn btn-primary btn-${size} gap-1 relative`}
      onClick={onClick}
    >
      <MessageCircle className="h-4 w-4" />
      Chat
      {unread > 0 && (
        <span className="badge badge-error badge-xs absolute -top-1 -right-1 text-[10px] min-w-[18px] h-[18px]">
          {unread > 9 ? "9+" : unread}
        </span>
      )}
    </button>
  );
};

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const role = user?.role?.toLowerCase() ?? "";
  const isAdmin = role.includes("admin");
  const isEmployee = role.includes("employee");

  const [bookings, setBookings] = useState<BookingResponse[]>([]);
  const [assigned, setAssigned] = useState<BookingResponse[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<BookingResponse | null>(null);
  const [detailBooking, setDetailBooking] = useState<BookingResponse | null>(null);
  const [assigning, setAssigning] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "unassigned" | "chat">("all");
  const [sortSoonest, setSortSoonest] = useState<boolean>(true);

  const loadData = async () => {
    try {
      setError(null);
      const [all, emps, srvs] = await Promise.all([
        getAllBookings(),
        getEmployees(),
        getAllServices(),
      ]);
      setBookings(all || []);
      setEmployees(emps || []);
      setServices(srvs || []);

      if (isEmployee) {
        const mine = await getMyAssignedBookings();
        setAssigned(mine || []);
      }
    } catch {
      setError("Kunde inte hämta data. Kontrollera behörighet/inloggning.");
    }
  };

  useEffect(() => {
    if (isAdmin) {
      void loadData();
    }
  }, [isAdmin]);

  const handleAssign = async (bookingId: string, employeeId: string) => {
    if (!employeeId) return;
    setAssigning(bookingId);
    const res = await assignEmployee(bookingId, employeeId);
    setAssigning(null);
    if (res) {
      setBookings((prev) => prev.map((b) => (b.id === bookingId ? res : b)));
      if (isEmployee) {
        setAssigned((prev) => {
          const exists = prev.find((b) => b.id === bookingId);
          if (exists) return prev.map((b) => (b.id === bookingId ? res : b));
          return [...prev, res];
        });
      }
    }
  };

  const formatTime = (value: string) =>
    format(new Date(value), "d MMM yyyy HH:mm", { locale: sv });

  const serviceName = (id: string) =>
    services.find((s) => s.id === id)?.name || "Okänd tjänst";

  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      if (filter === "unassigned") return !b.employeeId;
      if (filter === "chat") return Boolean(b.conversationId);
      return true;
    });
  }, [bookings, filter]);

  const sortedBookings = useMemo(() => {
    const sorted = [...filteredBookings].sort((a, b) => {
      const diff =
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
      return sortSoonest ? diff : -diff;
    });
    return sorted;
  }, [filteredBookings, sortSoonest]);

  const sortedAssigned = useMemo(
    () =>
      [...assigned].sort(
        (a, b) =>
          new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
      ),
    [assigned]
  );

  const stats = useMemo(() => {
    const total = bookings.length;
    const assignedCount = bookings.filter((b) => b.employeeId).length;
    const unassigned = total - assignedCount;
    return { total, assignedCount, unassigned };
  }, [bookings]);

  const miniChart = useMemo(() => {
    const today = startOfDay(new Date());
    const days: { label: string; value: number }[] = [];
    for (let i = 6; i >= 0; i -= 1) {
      const day = addDays(today, -i);
      const dayStr = day.toISOString().slice(0, 10);
      const count = bookings.filter((b) => b.startTime.slice(0, 10) === dayStr).length;
      days.push({ label: format(day, "EEE", { locale: sv }), value: count });
    }
    const max = Math.max(...days.map((d) => d.value), 1);
    return { days, max };
  }, [bookings]);

  const upcomingChart = useMemo(() => {
    const today = startOfDay(new Date());
    const days: { label: string; value: number }[] = [];
    for (let i = 0; i < 7; i += 1) {
      const day = addDays(today, i);
      const dayStr = day.toISOString().slice(0, 10);
      const count = bookings.filter((b) => b.startTime.slice(0, 10) === dayStr).length;
      days.push({ label: format(day, "EEE", { locale: sv }), value: count });
    }
    const max = Math.max(...days.map((d) => d.value), 1);
    return { days, max };
  }, [bookings]);

  if (!isAdmin) {
    return (
      <MainLayout>
        <div className="max-w-3xl mx-auto px-4 py-10">
          Den här sidan är endast för administratörer.
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-7xl xl:max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-12 space-y-10">
        <header className="space-y-2">
          <h1 className="text-3xl font-bold">Adminpanel</h1>
          <p className="text-base-content/70 text-sm md:text-base">
            Tilldela medarbetare, följ status och öppna chattar.
          </p>
          <div className="flex gap-2">
            <button className="btn btn-ghost btn-sm" onClick={loadData}>
              Uppdatera
            </button>
          </div>
        </header>

        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="card bg-base-100 border border-base-300 shadow-sm rounded-xl">
            <div className="card-body py-5">
              <p className="text-sm text-base-content/70">Alla bokningar</p>
              <p className="text-2xl font-semibold leading-tight">{stats.total}</p>
            </div>
          </div>
          <div className="card bg-base-100 border border-base-300 shadow-sm rounded-xl">
            <div className="card-body py-5">
              <p className="text-sm text-base-content/70">Tilldelade</p>
              <p className="text-2xl font-semibold leading-tight">{stats.assignedCount}</p>
            </div>
          </div>
          <div className="card bg-base-100 border border-base-300 shadow-sm rounded-xl">
            <div className="card-body py-5">
              <p className="text-sm text-base-content/70">Ej tilldelade</p>
              <p className="text-2xl font-semibold leading-tight">{stats.unassigned}</p>
            </div>
          </div>
        </section>

        <section className="card bg-base-100 border border-base-300 shadow-sm rounded-xl">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <h2 className="card-title">Bokningar (7 dagar bakåt & framåt)</h2>
              <span className="text-xs text-base-content/60">Snabb överblick</span>
            </div>
            <div className="grid md:grid-cols-2 gap-4 mt-2">
              <div>
                <p className="text-sm text-base-content/70 mb-1">Senaste 7 dagar</p>
                <div className="flex items-end gap-3">
                  {miniChart.days.map((d) => (
                    <div key={d.label} className="flex flex-col items-center gap-1 flex-1 min-w-[28px]">
                      <div
                        className="w-full rounded bg-primary/30"
                        style={{
                          height: `${(d.value / miniChart.max) * 80 + 6}px`,
                          minHeight: 6,
                        }}
                        title={`${d.value} bokningar`}
                      >
                        <div className="w-full h-full bg-primary rounded" style={{ opacity: 0.8 }} />
                      </div>
                      <span className="text-[11px] text-base-content/70 uppercase">{d.label}</span>
                      <span className="text-xs font-semibold">{d.value}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm text-base-content/70 mb-1">Kommande 7 dagar</p>
                <div className="flex items-end gap-3">
                  {upcomingChart.days.map((d) => (
                    <div key={d.label} className="flex flex-col items-center gap-1 flex-1 min-w-[28px]">
                      <div
                        className="w-full rounded bg-primary/30"
                        style={{
                          height: `${(d.value / upcomingChart.max) * 80 + 6}px`,
                          minHeight: 6,
                        }}
                        title={`${d.value} bokningar`}
                      >
                        <div className="w-full h-full bg-primary rounded" style={{ opacity: 0.8 }} />
                      </div>
                      <span className="text-[11px] text-base-content/70 uppercase">{d.label}</span>
                      <span className="text-xs font-semibold">{d.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {error && (
          <div className="alert alert-error">
            <span>{error}</span>
          </div>
        )}

        <section className="space-y-4">
          <div className="flex flex-wrap gap-3 items-center justify-between">
            <div className="join">
              <button
                className={`btn btn-sm join-item ${filter === "all" ? "btn-primary" : ""}`}
                onClick={() => setFilter("all")}
              >
                Alla
              </button>
              <button
                className={`btn btn-sm join-item ${filter === "unassigned" ? "btn-primary" : ""}`}
                onClick={() => setFilter("unassigned")}
              >
                Ej tilldelade
              </button>
              <button
                className={`btn btn-sm join-item ${filter === "chat" ? "btn-primary" : ""}`}
                onClick={() => setFilter("chat")}
              >
                Med chat
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setSortSoonest((v) => !v)}
              >
                Sortera: {sortSoonest ? "Snart start" : "Senaste först"}
              </button>
              <button className="btn btn-outline btn-sm" onClick={loadData}>
                Uppdatera
              </button>
            </div>
          </div>

          <div className="card bg-base-100 shadow-sm border border-base-300 w-full rounded-xl">
            <div className="card-body">
              <div className="flex items-center justify-between gap-3">
                <h2 className="card-title">Alla bokningar</h2>
                <span className="text-xs text-base-content/60">
                  {sortedBookings.length} st
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="table table-sm w-full">
                  <thead>
                    <tr className="text-xs uppercase text-base-content/70">
                      <th className="w-44">Tid</th>
                      <th className="w-48">Kund</th>
                      <th className="w-52">Service</th>
                      <th className="w-56">Medarbetare</th>
                      <th className="w-24">Status</th>
                      <th className="text-right w-32">Åtgärder</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedBookings.map((b) => {
                      const status = getStatusBadge(b);
                      return (
                        <tr
                          key={b.id}
                          className="cursor-pointer hover:bg-base-200/40"
                          onClick={() => setDetailBooking(b)}
                        >
                          <td className="whitespace-nowrap">{formatTime(b.startTime)}</td>
                          <td className="text-sm">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-base-content/50" />
                              <span className="truncate max-w-[140px]">{customerName(b)}</span>
                            </div>
                          </td>
                          <td className="text-xs max-w-[200px] truncate">
                            {serviceName(b.serviceId)}
                          </td>
                          <td>
                            <select
                              className="select select-bordered select-sm w-full max-w-[200px]"
                              value={b.employeeId || ""}
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) => handleAssign(b.id, e.target.value)}
                            >
                              <option value="">Inte tilldelad</option>
                              {employees.map((emp) => (
                                <option key={emp.id} value={emp.id}>
                                  {emp.firstName || ""} {emp.lastName || ""} ({emp.email})
                                </option>
                              ))}
                            </select>
                          </td>
                          <td>
                            <span className={`badge badge-outline whitespace-nowrap ${status.className}`}>
                              {status.text}
                            </span>
                          </td>
                          <td className="text-right">
                            <div className="flex items-center gap-2 justify-end">
                              {isEmployee &&
                                b.employeeId === user?.id &&
                                b.conversationId && (
                                  <ChatButtonWithBadge
                                    booking={b}
                                    userId={user?.id || ""}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedBooking(b);
                                    }}
                                  />
                                )}
                              {assigning === b.id && (
                                <span className="loading loading-spinner loading-xs" />
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        {isEmployee && (
          <section className="card bg-base-100 shadow-sm border border-base-300 rounded-xl">
            <div className="card-body">
              <h2 className="card-title">Mina tilldelade bokningar</h2>
              {sortedAssigned.length === 0 ? (
                <p className="text-sm text-base-content/60">Inga tilldelade bokningar.</p>
              ) : (
                <ul className="divide-y divide-base-300">
                  {sortedAssigned.map((b) => {
                    const status = getStatusBadge(b);
                    return (
                      <li key={b.id} className="py-3 flex items-center justify-between">
                        <div>
                          <p className="font-medium">{formatTime(b.startTime)}</p>
                          <p className="text-xs text-base-content/60">
                            {serviceName(b.serviceId)}
                          </p>
                          <p className="text-xs text-base-content/50 flex items-center gap-1 mt-1">
                            <User className="h-3 w-3" />
                            {customerName(b)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`badge badge-outline ${status.className}`}>
                            {status.text}
                          </span>
                          {b.conversationId && (
                            <ChatButtonWithBadge
                              booking={b}
                              userId={user?.id || ""}
                              onClick={() => setSelectedBooking(b)}
                              size="sm"
                            />
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </section>
        )}

        {selectedBooking &&
          selectedBooking.conversationId &&
          selectedBooking.employeeId === user?.id && (
            <section className="card bg-base-100 shadow-sm border border-base-300 rounded-xl">
              <div className="card-body">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="card-title">Chat</h2>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => setSelectedBooking(null)}
                  >
                    Stäng
                  </button>
                </div>
                <BookingChat
                  booking={selectedBooking as BookingResponse & { conversationId: string }}
                />
              </div>
            </section>
          )}

        {detailBooking && (
          <section className="card bg-base-100 shadow-sm border border-base-300 rounded-xl">
            <div className="card-body">
              <div className="flex items-center justify-between mb-2">
                <h2 className="card-title">Detaljer</h2>
                <button className="btn btn-ghost btn-sm" onClick={() => setDetailBooking(null)}>
                  Stäng
                </button>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex gap-2">
                  <span className="font-medium">Kund:</span>
                  <span className="flex items-center gap-1">
                    <User className="h-4 w-4 text-base-content/50" />
                    {customerName(detailBooking)}
                    {detailBooking.user?.email && (
                      <span className="text-base-content/50">({detailBooking.user.email})</span>
                    )}
                  </span>
                </div>
                <div className="flex gap-2">
                  <span className="font-medium">Service:</span>
                  <span>{serviceName(detailBooking.serviceId)}</span>
                </div>
                <div className="flex gap-2">
                  <span className="font-medium">Tid:</span>
                  <span>{formatTime(detailBooking.startTime)}</span>
                </div>
                <div className="flex gap-2 items-center">
                  <span className="font-medium">Status:</span>
                  {(() => {
                    const status = getStatusBadge(detailBooking);
                    return (
                      <span className={`badge badge-outline ${status.className}`}>
                        {status.text}
                      </span>
                    );
                  })()}
                </div>
                <div className="flex gap-2 items-center">
                  <span className="font-medium">Chat:</span>
                  <span className="badge badge-outline">
                    {detailBooking.conversationId ? "Chat aktiv" : "Ingen chat"}
                  </span>
                </div>
                <div className="flex gap-2">
                  <span className="font-medium">Medarbetare:</span>
                  <select
                    className="select select-bordered select-sm"
                    value={detailBooking.employeeId || ""}
                    onChange={(e) => handleAssign(detailBooking.id, e.target.value)}
                  >
                    <option value="">Inte tilldelad</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.firstName || ""} {emp.lastName || ""} ({emp.email})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              {isEmployee &&
                detailBooking.employeeId === user?.id &&
                detailBooking.conversationId && (
                  <div className="mt-3">
                    <ChatButtonWithBadge
                      booking={detailBooking}
                      userId={user?.id || ""}
                      onClick={() => setSelectedBooking(detailBooking)}
                      size="sm"
                    />
                  </div>
                )}
            </div>
          </section>
        )}
      </div>
    </MainLayout>
  );
};

export default AdminDashboard;
