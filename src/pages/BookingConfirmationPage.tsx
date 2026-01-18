import React, { useEffect, useState } from "react";
import { useParams, useLocation, Link } from "react-router-dom";
import MainLayout from "@/components/layout/main-layout";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { getBookingById, type BookingResponse } from "@/services/api";
import { useServicesWithImages } from "@/hooks/useServicesWithImages";
import { CheckCircle2, Calendar, Clock, CreditCard } from "lucide-react";

const BookingConfirmationPage: React.FC = () => {
  const { bookingId } = useParams<{ bookingId: string }>();
  const location = useLocation();
  const { services } = useServicesWithImages();

  // Try to get booking details from navigation state first (fresh booking)
  const stateBookingDetails = location.state?.bookingDetails;

  const [booking, setBooking] = useState<BookingResponse | null>(null);
  const [loading, setLoading] = useState(!stateBookingDetails);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // If we have state from navigation, don't fetch
    if (stateBookingDetails) {
      return;
    }

    // Otherwise fetch from API using bookingId
    const fetchBooking = async () => {
      if (!bookingId) {
        setError("Inget boknings-ID hittades");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await getBookingById(bookingId);
        if (data) {
          setBooking(data);
        } else {
          setError("Bokningen kunde inte hittas");
        }
      } catch {
        setError("Kunde inte hämta bokningsdetaljer");
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();
  }, [bookingId, stateBookingDetails]);

  // Get service name from services list
  const getServiceName = (serviceId: string) => {
    const service = services.find((s) => s.id === serviceId);
    return service?.name || "Behandling";
  };

  const getServicePrice = (serviceId: string) => {
    const service = services.find((s) => s.id === serviceId);
    return service?.price || 0;
  };

  // Loading state
  if (loading) {
    return (
      <MainLayout>
        <div className="container mx-auto py-6 max-w-2xl">
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body items-center">
              <span className="loading loading-spinner loading-lg"></span>
              <p className="mt-4">Laddar bokningsdetaljer...</p>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  // Error state or no booking found
  if (error || (!stateBookingDetails && !booking)) {
    return (
      <MainLayout>
        <div className="container mx-auto py-6 text-center max-w-2xl">
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body items-center">
              <h1 className="text-2xl font-bold mb-4">Bokningsbekräftelse</h1>
              <p className="text-base-content/70">
                {error || "Inga bokningsdetaljer hittades."}
              </p>
              <div className="flex gap-2 mt-6">
                <Link to="/dashboard" className="btn btn-ghost">
                  Till Dashboard
                </Link>
                <Link to="/bookings/history" className="btn btn-primary">
                  Mina bokningar
                </Link>
              </div>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  // Render booking details - use state if available, otherwise use fetched booking
  if (stateBookingDetails) {
    // Fresh booking from navigation state (old format)
    const { service, date, slot } = stateBookingDetails;

    return (
      <MainLayout>
        <div className="container mx-auto py-6 max-w-2xl">
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body items-center text-center">
              <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="h-10 w-10 text-success" />
              </div>
              <h2 className="card-title text-2xl">Tack för din bokning!</h2>
              <p className="text-base-content/70">
                En bekräftelse har skickats till din e-post.
              </p>

              <div className="divider"></div>

              <div className="space-y-4 w-full">
                <div className="flex items-center gap-3 p-3 bg-base-200/50 rounded-lg">
                  <Calendar className="h-5 w-5 text-primary" />
                  <div className="text-left">
                    <p className="text-sm text-base-content/60">Tjänst</p>
                    <p className="font-medium">{service.name}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-base-200/50 rounded-lg">
                  <Calendar className="h-5 w-5 text-primary" />
                  <div className="text-left">
                    <p className="text-sm text-base-content/60">Datum</p>
                    <p className="font-medium">
                      {format(new Date(date), "EEEE d MMMM yyyy", { locale: sv })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-base-200/50 rounded-lg">
                  <Clock className="h-5 w-5 text-primary" />
                  <div className="text-left">
                    <p className="text-sm text-base-content/60">Tid</p>
                    <p className="font-medium">
                      {format(new Date(slot.startTime), "HH:mm")} -{" "}
                      {format(new Date(slot.endTime), "HH:mm")}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-primary/10 rounded-lg">
                  <CreditCard className="h-5 w-5 text-primary" />
                  <div className="text-left">
                    <p className="text-sm text-base-content/60">Pris</p>
                    <p className="font-bold text-lg">{service.price} kr</p>
                  </div>
                </div>
              </div>

              <div className="card-actions justify-center mt-6 gap-2">
                <Link to="/dashboard" className="btn btn-ghost">
                  Till Dashboard
                </Link>
                <Link to="/bookings/history" className="btn btn-primary">
                  Mina bokningar
                </Link>
              </div>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  // Fetched booking from API
  return (
    <MainLayout>
      <div className="container mx-auto py-6 max-w-2xl">
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body items-center text-center">
            <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="h-10 w-10 text-success" />
            </div>
            <h2 className="card-title text-2xl">Bokningsbekräftelse</h2>
            <p className="text-base-content/70">
              Här är detaljerna för din bokning.
            </p>

            <div className="divider"></div>

            <div className="space-y-4 w-full">
              <div className="flex items-center gap-3 p-3 bg-base-200/50 rounded-lg">
                <Calendar className="h-5 w-5 text-primary" />
                <div className="text-left">
                  <p className="text-sm text-base-content/60">Tjänst</p>
                  <p className="font-medium">{getServiceName(booking!.serviceId)}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-base-200/50 rounded-lg">
                <Calendar className="h-5 w-5 text-primary" />
                <div className="text-left">
                  <p className="text-sm text-base-content/60">Datum</p>
                  <p className="font-medium">
                    {format(new Date(booking!.startTime), "EEEE d MMMM yyyy", {
                      locale: sv,
                    })}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-base-200/50 rounded-lg">
                <Clock className="h-5 w-5 text-primary" />
                <div className="text-left">
                  <p className="text-sm text-base-content/60">Tid</p>
                  <p className="font-medium">
                    {format(new Date(booking!.startTime), "HH:mm")} -{" "}
                    {format(new Date(booking!.endTime), "HH:mm")}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-primary/10 rounded-lg">
                <CreditCard className="h-5 w-5 text-primary" />
                <div className="text-left">
                  <p className="text-sm text-base-content/60">Pris</p>
                  <p className="font-bold text-lg">
                    {getServicePrice(booking!.serviceId)} kr
                  </p>
                </div>
              </div>
            </div>

            <div className="card-actions justify-center mt-6 gap-2">
              <Link to="/dashboard" className="btn btn-ghost">
                Till Dashboard
              </Link>
              <Link to="/bookings/history" className="btn btn-primary">
                Mina bokningar
              </Link>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default BookingConfirmationPage;
