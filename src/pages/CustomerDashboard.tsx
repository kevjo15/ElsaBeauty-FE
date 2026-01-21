import React, { useEffect, useState } from "react";
import MainLayout from "@/components/layout/main-layout";
import { useAuth } from "@/services/api/authContext";
import { useNavigate } from "react-router-dom";
import { getMyBookings, type BookingResponse } from "@/services/api";
import { useServicesWithImages } from "@/hooks/useServicesWithImages";
import {
  Calendar,
  Clock,
  Plus,
  History,
  Scissors,
  MessageCircle,
  CalendarCheck,
  ArrowRight,
} from "lucide-react";
import { format, isAfter, parseISO } from "date-fns";
import { sv } from "date-fns/locale";

const CustomerDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { services } = useServicesWithImages();

  const [bookings, setBookings] = useState<BookingResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoading(true);
        const data = await getMyBookings();
        setBookings(data || []);
      } catch {
        setError("Kunde inte hämta bokningar");
      } finally {
        setLoading(false);
      }
    };
    fetchBookings();
  }, []);

  // Filtrera kommande bokningar (inte avbokade)
  const upcomingBookings = bookings
    .filter((b) => {
      const status = b.status?.toLowerCase() || "";
      const startTime = parseISO(b.startTime);
      return !status.includes("cancel") && isAfter(startTime, new Date());
    })
    .sort((a, b) => parseISO(a.startTime).getTime() - parseISO(b.startTime).getTime());

  const nextBooking = upcomingBookings[0];

  const getServiceName = (serviceId: string) => {
    const service = services.find((s) => s.id === serviceId);
    return service?.name || "Behandling";
  };

  const formatDateTime = (dateStr: string) => {
    const date = parseISO(dateStr);
    return {
      date: format(date, "EEEE d MMMM", { locale: sv }),
      time: format(date, "HH:mm"),
    };
  };

  return (
    <MainLayout>
      <div className="container mx-auto max-w-5xl px-4 py-6">
        {/* Välkomst */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold">
            Välkommen{user?.firstName ? `, ${user.firstName}` : ""}!
          </h1>
          <p className="text-base-content/60 mt-1">
            Här kan du hantera dina bokningar och hitta nya behandlingar.
          </p>
        </div>

        {/* Nästa bokning */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <CalendarCheck className="h-5 w-5 text-primary" />
            Din nästa bokning
          </h2>

          {loading ? (
            <div className="card bg-base-100 shadow">
              <div className="card-body">
                <div className="flex gap-4 animate-pulse">
                  <div className="w-16 h-16 bg-base-300 rounded-lg"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-base-300 rounded w-1/3"></div>
                    <div className="h-3 bg-base-300 rounded w-1/2"></div>
                  </div>
                </div>
              </div>
            </div>
          ) : error ? (
            <div className="alert alert-error">{error}</div>
          ) : nextBooking ? (
            <div className="card bg-base-100 shadow hover:shadow-md transition-shadow">
              <div className="card-body">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex items-center justify-center w-16 h-16 bg-primary/10 rounded-lg shrink-0">
                    <Scissors className="h-8 w-8 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">
                      {getServiceName(nextBooking.serviceId)}
                    </h3>
                    <div className="flex flex-wrap gap-4 mt-2 text-sm text-base-content/70">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {formatDateTime(nextBooking.startTime).date}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {formatDateTime(nextBooking.startTime).time}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 sm:flex-col">
                    {nextBooking.conversationId && (
                      <button
                        className="btn btn-outline btn-sm"
                        onClick={() => navigate(`/chat/${nextBooking.id}`)}
                      >
                        <MessageCircle className="h-4 w-4" />
                        Chatta
                      </button>
                    )}
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => navigate("/bookings/history")}
                    >
                      Detaljer
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="card bg-base-100 shadow border-2 border-dashed border-base-300">
              <div className="card-body text-center py-8">
                <p className="text-base-content/60 mb-4">
                  Du har inga kommande bokningar
                </p>
                <button
                  className="btn btn-primary mx-auto"
                  onClick={() => navigate("/bookings")}
                >
                  <Plus className="h-4 w-4" />
                  Boka en tid
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Snabblänkar */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Snabblänkar</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <button
              className="card bg-base-100 shadow hover:shadow-md transition-all hover:-translate-y-1 cursor-pointer"
              onClick={() => navigate("/bookings")}
            >
              <div className="card-body items-center text-center py-6">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-2">
                  <Plus className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-medium">Boka ny tid</h3>
                <p className="text-sm text-base-content/60">
                  Hitta en ledig tid
                </p>
              </div>
            </button>

            <button
              className="card bg-base-100 shadow hover:shadow-md transition-all hover:-translate-y-1 cursor-pointer"
              onClick={() => navigate("/bookings/history")}
            >
              <div className="card-body items-center text-center py-6">
                <div className="w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center mb-2">
                  <History className="h-6 w-6 text-secondary" />
                </div>
                <h3 className="font-medium">Mina bokningar</h3>
                <p className="text-sm text-base-content/60">
                  Se alla bokningar
                </p>
              </div>
            </button>

            <button
              className="card bg-base-100 shadow hover:shadow-md transition-all hover:-translate-y-1 cursor-pointer"
              onClick={() => navigate("/services")}
            >
              <div className="card-body items-center text-center py-6">
                <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mb-2">
                  <Scissors className="h-6 w-6 text-accent" />
                </div>
                <h3 className="font-medium">Behandlingar</h3>
                <p className="text-sm text-base-content/60">
                  Utforska vårt utbud
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* Kommande bokningar lista */}
        {upcomingBookings.length > 1 && (
          <div>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Fler kommande bokningar
            </h2>
            <div className="space-y-3">
              {upcomingBookings.slice(1, 4).map((booking) => (
                <div
                  key={booking.id}
                  className="card bg-base-100 shadow-sm hover:shadow transition-shadow cursor-pointer"
                  onClick={() => navigate("/bookings/history")}
                >
                  <div className="card-body py-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">
                          {getServiceName(booking.serviceId)}
                        </p>
                        <p className="text-sm text-base-content/60">
                          {formatDateTime(booking.startTime).date} kl{" "}
                          {formatDateTime(booking.startTime).time}
                        </p>
                      </div>
                      <ArrowRight className="h-5 w-5 text-base-content/40" />
                    </div>
                  </div>
                </div>
              ))}
              {upcomingBookings.length > 4 && (
                <button
                  className="btn btn-ghost btn-sm w-full"
                  onClick={() => navigate("/bookings/history")}
                >
                  Visa alla ({upcomingBookings.length} bokningar)
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default CustomerDashboard;
