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
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { MessageCircle } from "lucide-react";

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
  const [assigning, setAssigning] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  const sortedBookings = useMemo(
    () =>
      [...bookings].sort(
        (a, b) =>
          new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
      ),
    [bookings]
  );

  const sortedAssigned = useMemo(
    () =>
      [...assigned].sort(
        (a, b) =>
          new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
      ),
    [assigned]
  );

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
      <div className="max-w-6xl xl:max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        <header className="space-y-1">
          <h1 className="text-3xl font-bold">Adminpanel</h1>
          <p className="text-base-content/70">
            Tilldela medarbetare, följ status och öppna chattar.
          </p>
          <button className="btn btn-ghost btn-sm" onClick={loadData}>
            Uppdatera
          </button>
        </header>

        {error && (
          <div className="alert alert-error">
            <span>{error}</span>
          </div>
        )}

        <section>
          <div className="card bg-base-100 shadow-sm border border-base-300 w-full">
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
                      <th className="w-48">Tid</th>
                      <th className="w-60">Service</th>
                      <th className="w-72">Medarbetare</th>
                      <th className="text-right w-52">Åtgärder</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedBookings.map((b) => (
                      <tr key={b.id}>
                        <td className="whitespace-nowrap">{formatTime(b.startTime)}</td>
                        <td className="text-xs max-w-[240px] truncate">
                          {serviceName(b.serviceId)}
                        </td>
                        <td>
                          <select
                            className="select select-bordered select-sm w-full max-w-xs"
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
                        <td className="text-right">
                          <div className="flex items-center gap-2 justify-end">
                            <span
                              className={`badge whitespace-nowrap px-2 ${b.conversationId ? "badge-outline" : "badge-ghost"}`}
                            >
                              {b.conversationId ? "Chat aktiv" : "Ingen chat"}
                            </span>
                            {isEmployee &&
                              b.employeeId === user?.id &&
                              b.conversationId && (
                                <button
                                  className="btn btn-primary btn-xs gap-1"
                                  onClick={() => setSelectedBooking(b)}
                                >
                                  <MessageCircle className="h-4 w-4" /> Chat
                                </button>
                              )}
                            {assigning === b.id && (
                              <span className="loading loading-spinner loading-xs" />
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        {isEmployee && (
          <section className="card bg-base-100 shadow-sm border border-base-300">
            <div className="card-body">
              <h2 className="card-title">Mina tilldelade bokningar</h2>
              {sortedAssigned.length === 0 ? (
                <p className="text-sm text-base-content/60">Inga tilldelade bokningar.</p>
              ) : (
                <ul className="divide-y divide-base-300">
                  {sortedAssigned.map((b) => (
                    <li key={b.id} className="py-3 flex items-center justify-between">
                      <div>
                        <p className="font-medium">{formatTime(b.startTime)}</p>
                        <p className="text-xs text-base-content/60">
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
          </section>
        )}

        {selectedBooking &&
          selectedBooking.conversationId &&
          selectedBooking.employeeId === user?.id && (
            <section className="card bg-base-100 shadow-sm border border-base-300">
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
      </div>
    </MainLayout>
  );
};

export default AdminDashboard;
