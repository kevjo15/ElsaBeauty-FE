import React from "react";
import { useLocation, Link } from "react-router-dom";
import MainLayout from "@/components/layout/main-layout";
import { format } from "date-fns";

const BookingConfirmationPage: React.FC = () => {
  const location = useLocation();
  const { bookingDetails } = location.state || {};

  if (!bookingDetails) {
    return (
      <MainLayout>
        <div className="container mx-auto py-6 text-center">
          <h1 className="text-3xl font-bold mb-6">Bokningsbekräftelse</h1>
          <p>Inga bokningsdetaljer hittades.</p>
          <Link to="/bookings" className="btn btn-primary mt-4">
            Gå till Mina bokningar
          </Link>
        </div>
      </MainLayout>
    );
  }

  const { service, date, slot } = bookingDetails;

  return (
    <MainLayout>
      <div className="container mx-auto py-6 max-w-2xl">
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body items-center text-center">
            <h2 className="card-title text-2xl">Tack för din bokning!</h2>
            <p>En bekräftelse har skickats till din e-post.</p>
            <div className="divider"></div>
            <div className="space-y-2 text-left w-full">
              <div className="flex justify-between">
                <span className="font-medium">Tjänst:</span>
                <span>{service.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Datum:</span>
                <span>{format(new Date(date), "PPP")}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Tid:</span>
                <span>{`${format(new Date(slot.startTime), "HH:mm")} - ${format(
                  new Date(slot.endTime),
                  "HH:mm"
                )}`}</span>
              </div>
              <div className="flex justify-between font-bold text-lg mt-4">
                <span>Pris:</span>
                <span>{service.price} kr</span>
              </div>
            </div>
            <div className="card-actions justify-end mt-6">
              <Link to="/home" className="btn btn-ghost">
                Tillbaka till startsidan
              </Link>
              <Link to="/bookings" className="btn btn-primary">
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
