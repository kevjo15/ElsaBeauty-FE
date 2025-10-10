import React, { useState, useEffect } from "react";
import { useAuth } from "@/services/api/authContext";
import { useNavigate, useLocation } from "react-router-dom";
import MainLayout from "@/components/layout/main-layout";
import { format } from "date-fns";
import { sv } from "date-fns/locale"; // Importera svensk locale
import {
  createBooking,
  type Service,
  type TimeSlot,
  type BookingRequest,
} from "@/services/api";
import ServiceSelector from "@/components/booking/ServiceSelector";
import TimeSlotSelector from "@/components/booking/TimeSlotSelector";
import BookingSummary from "@/components/booking/BookingSummary";
import DateSelector from "@/components/booking/DateSelector";
import BookingConfirmationModal from "@/components/booking/BookingConfirmationModal";
import { useServicesWithImages } from "@/hooks/useServicesWithImages";
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
  const location = useLocation();
  const { services, error: servicesError } = useServicesWithImages();
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
  const [isModalOpen, setIsModalOpen] = useState(false); // Lägg till state för modal

  // If coming from a Service details page, preselect service and jump to step 2 (choose date)
  useEffect(() => {
    const state = location.state as {
      preselectedServiceId?: string;
      startAtStep?: number;
    } | null;
    if (state?.preselectedServiceId && services.length > 0) {
      const pre =
        services.find((s) => s.id === state.preselectedServiceId) || null;
      if (pre) {
        setSelectedService(pre);
        setSelectedSlot(null);
        setStep(
          state.startAtStep && state.startAtStep >= 1 && state.startAtStep <= 3
            ? state.startAtStep
            : 2
        );
      }
    }
  }, [location.state, services]);

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

  const handleOpenModal = () => {
    if (!selectedService || !selectedDate || !selectedSlot) {
      setBookingError("Vänligen välj tjänst, datum och tid.");
      return;
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleConfirmBooking = async () => {
    if (!user || !selectedService || !selectedSlot) {
      setBookingError("Vänligen välj tjänst, datum och tid.");
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
      setSuccess("Bokning skapad framgångsrikt!");

      setSelectedService(null);
      setSelectedDate(undefined);
      setSelectedSlot(null);

      navigate("/booking-confirmation", {
        state: {
          bookingDetails: {
            service: selectedService,
            date: selectedDate,
            slot: selectedSlot,
          },
        },
      });
    } catch (error: unknown) {
      console.error("Error creating booking:", error);
      const apiError = error as ApiError;
      if (apiError.response?.data?.error) {
        setBookingError(apiError.response.data.error);
      } else {
        setBookingError("Misslyckades med att skapa bokning. Försök igen.");
      }
    } finally {
      setBookingLoading(false);
      setIsModalOpen(false); // Stäng modalen efter bekräftelse/fel
    }
  };

  const formatTimeSlot = (slot: TimeSlot) => {
    const startTime = new Date(slot.startTime);
    const endTime = new Date(slot.endTime);
    return `${format(startTime, "HH:mm")} - ${format(endTime, "HH:mm")}`;
  };

  return (
    <MainLayout>
      <div className="container mx-auto py-6 max-w-4xl">
        {/* Processbar */}
        <ul className="steps steps-horizontal w-full mb-12">
          <li
            className={`step text-base-content font-medium transition-all duration-300 ease-in-out ${
              step >= 1 ? "step-primary" : ""
            }`}
          >
            Välj behandling
          </li>
          <li
            className={`step text-base-content font-medium transition-all duration-300 ease-in-out ${
              step >= 2 ? "step-primary" : ""
            }`}
          >
            Välj datum
          </li>
          <li
            className={`step text-base-content font-medium transition-all duration-300 ease-in-out ${
              step >= 3 ? "step-primary" : ""
            }`}
          >
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
                title="Välj din behandling"
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
                title="Välj datum"
                selectedService={selectedService}
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
                title="Välj tid"
                subtitle={
                  selectedDate
                    ? `Lediga tider för ${format(
                        selectedDate,
                        "EEEE d MMMM yyyy",
                        {
                          locale: sv,
                        }
                      )}`
                    : ""
                }
              />

              <BookingSummary
                selectedService={selectedService}
                selectedDate={selectedDate}
                selectedSlot={selectedSlot}
                formatTimeSlot={formatTimeSlot}
              />
              <div className="flex justify-between mt-4">
                <button className="btn btn-ghost" onClick={() => setStep(2)}>
                  Tillbaka
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handleOpenModal} // Öppna modalen istället för att skicka direkt
                  disabled={!selectedSlot || bookingLoading}
                >
                  {bookingLoading ? (
                    <>
                      <span className="loading loading-spinner mr-2"></span>
                      Bekräftar...
                    </>
                  ) : (
                    "Bekräfta bokning"
                  )}
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

        <BookingConfirmationModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onConfirm={handleConfirmBooking}
          selectedService={selectedService}
          selectedDate={selectedDate}
          selectedSlot={selectedSlot}
          loading={bookingLoading}
          formatTimeSlot={formatTimeSlot}
        />
      </div>
    </MainLayout>
  );
};

export default BookingPage;
