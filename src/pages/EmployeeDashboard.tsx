import React, { useEffect, useMemo, useState } from "react";
import MainLayout from "@/components/layout/main-layout";
import { useAuth } from "@/services/api/authContext";
import ScheduleSection from "@/components/schedule/ScheduleSection";
import { MessageCircle, User } from "lucide-react";
import {
  addDays,
  endOfDay,
  endOfWeek,
  format,
  isSameDay,
  startOfDay,
  startOfWeek,
} from "date-fns";
import { sv } from "date-fns/locale";
import {
  assignEmployee,
  getAllBookings,
  getMyAssignedBookings,
} from "@/services/api/bookingAPI";
import { getEmployees } from "@/services/api/userAPI";
import { getAllServices } from "@/services/api/serviceAPI";
import type { BookingResponse, Employee, Service } from "@/services/api/types";
import { useNavigate } from "react-router-dom";
import { useUnreadCount } from "@/hooks/useUnreadCount";

// Helper to get customer display name
const customerName = (b: BookingResponse): string => {
  const name = [b.user?.firstName, b.user?.lastName].filter(Boolean).join(" ");
  return name || b.customerName || b.user?.email || "Okänd kund";
};

// Helper to get status badge styling
const getStatusBadge = (b: BookingResponse): { text: string; className: string } => {
  const now = new Date();
  const start = new Date(b.startTime);
  const end = new Date(b.endTime);

  if (b.status) {
    const s = b.status.toLowerCase();
    if (s.includes("cancel")) return { text: "Avbokad", className: "badge-error" };
    if (s.includes("complete")) return { text: "Avslutad", className: "badge-success" };
  }

  if (end < now) return { text: "Avslutad", className: "badge-success" };
  if (start <= now && end >= now) return { text: "Pågående", className: "badge-warning" };
  return { text: "Bokad", className: "badge-info" };
};

// Chat button with unread badge
const ChatButtonWithBadge: React.FC<{
  booking: BookingResponse;
  userId: string;
  onClick: (e: React.MouseEvent) => void;
}> = ({ booking, userId, onClick }) => {
  const unread = useUnreadCount(booking.conversationId, userId);

  return (
    <button
      className="btn btn-primary btn-sm gap-1 relative"
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

// Confirmation dialog state type
type AssignConfirmState = {
  bookingId: string;
  employeeId: string;
  employeeName: string;
  serviceName: string;
} | null;

const EmployeeDashboard: React.FC = () => {
  const { user } = useAuth();
  const role = user?.role?.toLowerCase() ?? "";
  const isAdmin = role.includes("admin");
  const isEmployee = role.includes("employee"); // kräver employee-roll

  const [assigned, setAssigned] = useState<BookingResponse[]>([]);
  const [bookings, setBookings] = useState<BookingResponse[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [assigning, setAssigning] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [weekOffset, setWeekOffset] = useState(0); // 0 = this week, +/- to navigate
  const [viewMode, setViewMode] = useState<"today" | "week" | "month">("week");
  const [detailBooking, setDetailBooking] = useState<BookingResponse | null>(null);
  const [assignConfirm, setAssignConfirm] = useState<AssignConfirmState>(null);
  const navigate = useNavigate();

  const loadData = async () => {
    try {
      setError(null);
      const now = new Date();
      let start = startOfDay(now);
      let end = endOfDay(now);

      if (viewMode === "week") {
        start = startOfWeek(addDays(now, weekOffset * 7), { weekStartsOn: 1 });
        end = endOfWeek(start, { weekStartsOn: 1 });
      } else if (viewMode === "month") {
        end = addDays(start, 30);
      }

      const promises: Promise<unknown>[] = [];
      promises.push(
        getMyAssignedBookings(start, end).then((res) =>
          setAssigned(res || [])
        )
      );
      promises.push(getAllServices().then((res) => setServices(res || [])));
      if (isAdmin) {
        promises.push(getAllBookings().then((res) => setBookings(res || [])));
        promises.push(getEmployees().then((res) => setEmployees(res || [])));
      }
      await Promise.all(promises);
    } catch {
      setError("Kunde inte hämta data. Kontrollera behörighet/inloggning.");
    }
  };

  useEffect(() => {
    if (isEmployee) {
      void loadData();
    }
  }, [isEmployee, weekOffset, viewMode]);

  // Opens confirmation dialog before assigning
  const requestAssign = (bookingId: string, employeeId: string) => {
    if (!employeeId) return;
    const emp = employees.find((e) => e.id === employeeId);
    const booking = bookings.find((b) => b.id === bookingId);
    const empName = emp ? `${emp.firstName || ""} ${emp.lastName || ""}`.trim() || emp.email : "Okänd";
    const srvName = booking ? serviceName(booking.serviceId) : "Bokning";
    setAssignConfirm({ bookingId, employeeId, employeeName: empName, serviceName: srvName });
  };

  // Actually performs the assignment after confirmation
  const handleAssign = async () => {
    if (!assignConfirm) return;
    const { bookingId, employeeId } = assignConfirm;
    setAssignConfirm(null);
    setAssigning(bookingId);
    const res = await assignEmployee(bookingId, employeeId);
    setAssigning(null);
    if (res) {
      setBookings((prev) => prev.map((b) => (b.id === bookingId ? res : b)));
      if (user?.id === employeeId) {
        setAssigned((prev) => {
          const exists = prev.find((b) => b.id === bookingId);
          if (exists) return prev.map((b) => (b.id === bookingId ? res : b));
          return [...prev, res];
        });
      }
    }
  };

  const formatTime = (s: string) =>
    format(new Date(s), "d MMM yyyy HH:mm", { locale: sv });

  const serviceName = (id: string) =>
    services.find((s) => s.id === id)?.name || "Okänd tjänst";

  const weekInfo = useMemo(() => {
    const base = new Date();
    const start = startOfWeek(addDays(base, weekOffset * 7), { weekStartsOn: 1 });
    const end = endOfWeek(start, { weekStartsOn: 1 });
    const weekText = format(start, "'Vecka' w", { locale: sv });
    const rangeText = `${format(start, "d MMM", { locale: sv })} - ${format(end, "d MMM", { locale: sv })}`;
    return { weekText, rangeText };
  }, [weekOffset]);

  const bookingsForWeek = useMemo(() => {
    return [...assigned].sort(
      (a, b) =>
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );
  }, [assigned]);

  const sortedAllBookings = useMemo(() => {
    return [...bookings].sort(
      (a, b) =>
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );
  }, [bookings]);

  const stats = useMemo(() => {
    const now = new Date();
    const endNext7 = addDays(now, 7);
    const todayCount = assigned.filter((b) =>
      isSameDay(new Date(b.startTime), now)
    ).length;
    const upcomingWeek = assigned.filter((b) => {
      const s = new Date(b.startTime);
      return s >= now && s <= endNext7;
    }).length;
    const completed = assigned.filter(
      (b) => new Date(b.endTime) < now
    ).length;
    return { todayCount, upcomingWeek, completed };
  }, [assigned]);

  const filteredBookings = useMemo(() => bookingsForWeek, [bookingsForWeek]);

  const todayBookings = useMemo(
    () => filteredBookings.filter((b) => isSameDay(new Date(b.startTime), new Date())),
    [filteredBookings]
  );

  const upcomingBookings = useMemo(
    () => filteredBookings.filter((b) => !isSameDay(new Date(b.startTime), new Date())),
    [filteredBookings]
  );

  if (!isEmployee) {
    return (
      <MainLayout>
        <div className="max-w-3xl mx-auto px-4 py-10">
          Den här sidan är endast för medarbetare/administratör.
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-6xl xl:max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        <header className="space-y-2">
          <h1 className="text-3xl font-bold">Medarbetaröversikt</h1>
          <p className="text-base-content/70">Se dina bokningar och tilldela medarbetare.</p>
          <div className="flex flex-wrap gap-3 items-center text-sm">
            <div className="join">
              <button
                className={`btn btn-sm join-item ${viewMode === "today" ? "btn-primary" : ""}`}
                onClick={() => {
                  setViewMode("today");
                  setWeekOffset(0);
                }}
              >
                Idag
              </button>
              <button
                className={`btn btn-sm join-item ${viewMode === "week" ? "btn-primary" : ""}`}
                onClick={() => setViewMode("week")}
              >
                Vecka
              </button>
              <button
                className={`btn btn-sm join-item ${viewMode === "month" ? "btn-primary" : ""}`}
                onClick={() => {
                  setViewMode("month");
                  setWeekOffset(0);
                }}
              >
                30 dagar
              </button>
            </div>

            {viewMode === "week" && (
              <>
                <div className="join">
                  <button className="btn btn-sm join-item" onClick={() => setWeekOffset((w) => w - 1)}>
                    Föregående
                  </button>
                  <button className="btn btn-sm join-item" onClick={() => setWeekOffset(0)}>
                    Nuvarande
                  </button>
                  <button className="btn btn-sm join-item" onClick={() => setWeekOffset((w) => w + 1)}>
                    Nästa
                  </button>
                </div>
                <span className="text-base-content/70">
                  {weekInfo.weekText} ({weekInfo.rangeText})
                </span>
              </>
            )}

            {viewMode === "today" && (
              <span className="text-base-content/70">Idag ({format(new Date(), "d MMM", { locale: sv })})</span>
            )}

            {viewMode === "month" && (
              <span className="text-base-content/70">Kommande 30 dagar</span>
            )}
          </div>
        </header>

        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="card bg-base-100 shadow-sm border border-base-300">
            <div className="card-body py-4">
              <p className="text-sm text-base-content/60">Idag</p>
              <p className="text-2xl font-semibold">{stats.todayCount}</p>
            </div>
          </div>
          <div className="card bg-base-100 shadow-sm border border-base-300">
            <div className="card-body py-4">
              <p className="text-sm text-base-content/60">Kommande 7 dagar</p>
              <p className="text-2xl font-semibold">{stats.upcomingWeek}</p>
            </div>
          </div>
          <div className="card bg-base-100 shadow-sm border border-base-300">
            <div className="card-body py-4">
              <p className="text-sm text-base-content/60">Avslutade</p>
              <p className="text-2xl font-semibold">{stats.completed}</p>
            </div>
          </div>
        </section>

        {error && (
          <div className="alert alert-error">
            <span>{error}</span>
          </div>
        )}

        <section className="space-y-6">
          <div className="card bg-base-100 shadow-sm border border-base-300 w-full">
            <div className="card-body">
              <div className="flex items-center justify-between">
                <h2 className="card-title">Mina tilldelade bokningar</h2>
                <button className="btn btn-ghost btn-sm" onClick={loadData}>
                  Uppdatera
                </button>
              </div>
              {!filteredBookings.length ? (
                <p className="text-sm text-base-content/60">Inga bokningar matchar filtret.</p>
              ) : (
                <ul className="divide-y divide-base-300">
                  {todayBookings.map((b) => {
                    const status = getStatusBadge(b);
                    return (
                      <li
                        key={b.id}
                        className="py-3 flex items-center justify-between cursor-pointer hover:bg-base-200/40 rounded"
                        onClick={() => setDetailBooking(b)}
                      >
                        <div>
                          <p className="font-medium">{formatTime(b.startTime)}</p>
                          <p className="text-sm text-base-content/60">
                            {serviceName(b.serviceId)}
                          </p>
                          <p className="text-xs text-base-content/50 flex items-center gap-1 mt-1">
                            <User className="h-3 w-3" />
                            {customerName(b)}
                          </p>
                          <span className="badge badge-primary badge-outline mt-1">Idag</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`badge badge-outline ${status.className}`}>
                            {status.text}
                          </span>
                          {b.conversationId && (
                            <ChatButtonWithBadge
                              booking={b}
                              userId={user?.id || ""}
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/chat/${b.id}`, { state: { booking: b } });
                              }}
                            />
                          )}
                        </div>
                      </li>
                    );
                  })}
                  {upcomingBookings.map((b) => {
                    const status = getStatusBadge(b);
                    return (
                      <li
                        key={b.id}
                        className="py-3 flex items-center justify-between cursor-pointer hover:bg-base-200/40 rounded"
                        onClick={() => setDetailBooking(b)}
                      >
                        <div>
                          <p className="font-medium">{formatTime(b.startTime)}</p>
                          <p className="text-sm text-base-content/60">
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
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/chat/${b.id}`, { state: { booking: b } });
                              }}
                            />
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>

          {isAdmin && (
            <div className="card bg-base-100 shadow-sm border border-base-300 w-full">
              <div className="card-body">
                <div className="flex items-center justify-between">
                  <h2 className="card-title">Tilldela medarbetare</h2>
                  <button className="btn btn-ghost btn-sm" onClick={loadData}>
                    Uppdatera
                  </button>
                </div>
                <p className="text-sm text-base-content/60 mb-4">
                  Välj en bokning och tilldela en medarbetare.
                </p>
                <div className="overflow-x-auto">
                  <table className="table table-sm">
                    <thead>
                      <tr>
                        <th>Service</th>
                        <th>Tid</th>
                        <th>Employee</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedAllBookings.map((b) => (
                        <tr key={b.id}>
                          <td className="max-w-[200px] truncate">{serviceName(b.serviceId)}</td>
                          <td>{formatTime(b.startTime)}</td>
                          <td>
                            <select
                              className="select select-bordered select-sm"
                              value={b.employeeId || ""}
                              onChange={(e) => requestAssign(b.id, e.target.value)}
                            >
                              <option value="">Inte tilldelad</option>
                              {employees.map((emp) => (
                                <option key={emp.id} value={emp.id}>
                                  {emp.firstName || ""} {emp.lastName || ""} ({emp.email})
                                </option>
                              ))}
                            </select>
                          </td>
                          <td>{assigning === b.id && <span className="loading loading-spinner loading-xs" />}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Confirmation dialog for employee assignment */}
        {assignConfirm && (
          <dialog className="modal modal-open">
            <div className="modal-box">
              <h3 className="font-bold text-lg">Bekräfta tilldelning</h3>
              <p className="py-4">
                Vill du tilldela <span className="font-semibold">{assignConfirm.employeeName}</span> till{" "}
                <span className="font-semibold">{assignConfirm.serviceName}</span>?
              </p>
              <div className="modal-action">
                <button
                  className="btn btn-ghost"
                  onClick={() => setAssignConfirm(null)}
                >
                  Avbryt
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handleAssign}
                >
                  Bekräfta
                </button>
              </div>
            </div>
            <div className="modal-backdrop bg-black/30" onClick={() => setAssignConfirm(null)} />
          </dialog>
        )}

        <section className="card bg-base-100 shadow-sm border border-base-300 w-full">
          <div className="card-body">
            <h2 className="card-title mb-2">Mina arbetstider</h2>
            {user?.id && <ScheduleSection employeeId={user.id} />}
          </div>
        </section>

        {detailBooking && (
          <section className="card bg-base-100 shadow-sm border border-base-300 w-full">
            <div className="card-body">
              <div className="flex items-center justify-between mb-3">
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
                  <span>
                    {formatTime(detailBooking.startTime)} - {format(new Date(detailBooking.endTime), "HH:mm", { locale: sv })}
                  </span>
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
              </div>
              {detailBooking.conversationId && (
                <div className="mt-4">
                  <ChatButtonWithBadge
                    booking={detailBooking}
                    userId={user?.id || ""}
                    onClick={() =>
                      navigate(`/chat/${detailBooking.id}`, { state: { booking: detailBooking } })
                    }
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

export default EmployeeDashboard;
