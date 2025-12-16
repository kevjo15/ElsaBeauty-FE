import React, { useEffect, useMemo, useState } from "react";
import MainLayout from "@/components/layout/main-layout";
import { useAuth } from "@/services/api/authContext";
import { MessageCircle } from "lucide-react";
import { addDays, endOfWeek, format, startOfWeek } from "date-fns";
import { sv } from "date-fns/locale";
import BookingChat from "@/components/BookingChat";
import {
  assignEmployee,
  getAllBookings,
  getMyAssignedBookings,
} from "@/services/api/bookingAPI";
import { getEmployees } from "@/services/api/userAPI";
import { getAllServices } from "@/services/api/serviceAPI";
import type { BookingResponse, Employee, Service } from "@/services/api/types";

const EmployeeDashboard: React.FC = () => {
  const { user } = useAuth();
  const role = user?.role?.toLowerCase() ?? "";
  const isAdmin = role.includes("admin");
  const isEmployee = role.includes("employee"); // kräver employee-roll

  const [assigned, setAssigned] = useState<BookingResponse[]>([]);
  const [bookings, setBookings] = useState<BookingResponse[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<BookingResponse | null>(null);
  const [assigning, setAssigning] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [weekOffset, setWeekOffset] = useState(0); // 0 = this week, +/- to navigate

  const loadData = async () => {
    try {
      setError(null);
      const now = new Date();
      const start = new Date(now);
      start.setHours(0, 0, 0, 0);
      start.setDate(start.getDate() + weekOffset * 7);
      const end = new Date(start);
      end.setDate(end.getDate() + 7);

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
  }, [isEmployee, weekOffset]);

  const handleAssign = async (bookingId: string, employeeId: string) => {
    if (!employeeId) return;
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
          <div className="flex flex-wrap gap-2 items-center text-sm">
            <span>Vecka</span>
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
          </div>
        </header>

        {error && (
          <div className="alert alert-error">
            <span>{error}</span>
          </div>
        )}

        <section className="space-y-6">
          <div className="card bg-base-100 shadow-sm border border-base-300 w-full">
            <div className="card-body">
              <div className="flex items-center justify-between">
                <h2 className="card-title">Mina tilldelade bokningar (nästa 7 dagar)</h2>
                <button className="btn btn-ghost btn-sm" onClick={loadData}>
                  Uppdatera
                </button>
              </div>
              {!bookingsForWeek.length ? (
                <p className="text-sm text-base-content/60">Inga kommande bokningar.</p>
              ) : (
                <ul className="divide-y divide-base-300">
                  {bookingsForWeek.map((b) => (
                    <li key={b.id} className="py-3 flex items-center justify-between">
                      <div>
                        <p className="font-medium">{formatTime(b.startTime)}</p>
                        <p className="text-sm text-base-content/60">
                          {serviceName(b.serviceId)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="badge badge-outline">
                          {b.conversationId ? "Chat aktiv" : "Ingen chat"}
                        </span>
                        {b.conversationId && (
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => setSelectedBooking(b)}
                          >
                            <MessageCircle className="h-4 w-4" /> Chat
                          </button>
                        )}
                      </div>
                    </li>
                  ))}
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

        {selectedBooking && selectedBooking.conversationId && (
          <section className="card bg-base-100 shadow-sm border border-base-300 w-full">
            <div className="card-body">
              <div className="flex items-center justify-between mb-2">
                <h2 className="card-title">Chat</h2>
                <button className="btn btn-ghost btn-sm" onClick={() => setSelectedBooking(null)}>
                  Stäng
                </button>
              </div>
              <BookingChat
                booking={selectedBooking as BookingResponse & { conversationId: string }}
              />
            </div>
          </section>
        )}
      </div>
    </MainLayout>
  );
};

export default EmployeeDashboard;
