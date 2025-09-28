import React, { useState } from "react";
import { useAuth } from "@/services/api/authContext";
import { useNavigate } from "react-router-dom";
import MainLayout from "@/components/layout/main-layout";
import { format } from "date-fns";
import {
  Service,
  TimeSlot,
  BookingRequest,
  createBooking,
} from "@/services/api/apiService";
import ServiceSelector from "@/components/booking/ServiceSelector";
import TimeSlotSelector from "@/components/booking/TimeSlotSelector";
import BookingSummary from "@/components/booking/BookingSummary";
import DateSelector from "@/components/booking/DateSelector";
import { useServices } from "@/hooks/useServices";
import { useTimeSlots } from "@/hooks/useTimeSlots";

interface ApiError {
  response?: {
    data?: {
      error?: string;
    };
  };
}

const BookingPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { services, error: servicesError } = useServices();
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const {
    availableSlots,
    loading: timeSlotsLoading,
    error: timeSlotsError,
  } = useTimeSlots(selectedService?.id, selectedDate);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [step, setStep] = useState(1);

  const handleServiceChange = (serviceId: string) => {
    const service = services.find((s) => s.id === serviceId) || null;
    setSelectedService(service);
    setSelectedSlot(null);
  };

  const handleDateChange = (date: Date | undefined) => {
    setSelectedDate(date);
    setSelectedSlot(null);
  };

  const handleSlotSelect = (slot: TimeSlot) => {
    setSelectedSlot(slot);
  };

  const handleBookingSubmit = async () => {
    if (!user || !selectedService || !selectedSlot) {
      setBookingError("Please select a service and time slot.");
      return;
    }

    setBookingLoading(true);
    setBookingError(null);
    setSuccess(null);

    try {
      const bookingData: BookingRequest = {
        userId: user?.id || "test-user-id",
        serviceId: selectedService.id,
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
      };

      await createBooking(bookingData);
      setSuccess("Booking created successfully!");

      setSelectedService(null);
      setSelectedDate(undefined);
      setSelectedSlot(null);

      setTimeout(() => {
        navigate("/bookings");
      }, 2000);
    } catch (error: unknown) {
      console.error("Error creating booking:", error);
      const apiError = error as ApiError;
      if (apiError.response?.data?.error) {
        setBookingError(apiError.response.data.error);
      } else {
        setBookingError("Failed to create booking. Please try again.");
      }
    } finally {
      setBookingLoading(false);
    }
  };

  const formatTimeSlot = (slot: TimeSlot) => {
    const startTime = new Date(slot.startTime);
    const endTime = new Date(slot.endTime);
    return `${format(startTime, "HH:mm")} - ${format(endTime, "HH:mm")}`;
  };

  return (
    <MainLayout>
      <div className="container mx-auto py-6 max-w-2xl">
        <h1 className="text-3xl font-bold mb-6 text-center">Boka en tid</h1>

        {/* Processbar */}
        <ul className="steps steps-horizontal w-full mb-8">
          <li className={`step ${step >= 1 ? "step-primary" : ""}`}>
            Välj behandling
          </li>
          <li className={`step ${step >= 2 ? "step-primary" : ""}`}>
            Välj datum
          </li>
          <li className={`step ${step >= 3 ? "step-primary" : ""}`}>
            Välj tid
          </li>
        </ul>

        <div className="space-y-6">
          {step === 1 && (
            <>
              <ServiceSelector
                services={services}
                selectedService={selectedService}
                onServiceChange={handleServiceChange}
              />
              <div className="flex justify-end mt-4">
                <button
                  className="btn btn-primary"
                  onClick={() => setStep(2)}
                  disabled={!selectedService}
                >
                  Nästa
                </button>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <DateSelector
                selectedDate={selectedDate}
                onDateChange={handleDateChange}
                disabled={!selectedService}
              />
              <div className="flex justify-between mt-4">
                <button className="btn btn-ghost" onClick={() => setStep(1)}>
                  Tillbaka
                </button>
                <button
                  className="btn btn-primary"
                  onClick={() => setStep(3)}
                  disabled={!selectedDate}
                >
                  Nästa
                </button>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <TimeSlotSelector
                loading={timeSlotsLoading}
                selectedService={!!selectedService}
                selectedDate={!!selectedDate}
                availableSlots={availableSlots}
                selectedSlot={selectedSlot}
                onSlotSelect={handleSlotSelect}
                formatTimeSlot={formatTimeSlot}
              />

              <BookingSummary
                selectedService={selectedService}
                selectedDate={selectedDate}
                selectedSlot={selectedSlot}
                onBookingSubmit={handleBookingSubmit}
                loading={bookingLoading}
                formatTimeSlot={formatTimeSlot}
              />
              <div className="flex justify-between mt-4">
                <button className="btn btn-ghost" onClick={() => setStep(2)}>
                  Tillbaka
                </button>
              </div>
            </>
          )}
        </div>

        {(servicesError || timeSlotsError || bookingError) && (
          <div role="alert" className="alert alert-error mt-6">
            <h3 className="font-bold">Fel</h3>
            <p>{servicesError || timeSlotsError || bookingError}</p>
          </div>
        )}

        {success && (
          <div role="alert" className="alert alert-success mt-6">
            <h3 className="font-bold">Framgång!</h3>
            <p>{success}</p>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default BookingPage;
