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
import { CheckCircle2 } from "lucide-react";

interface ApiError {
  response?: {
    data?: {
      error?: string;
    };
  };
}

const stepsConfig = [
  { id: 1, label: "Välj behandling" },
  { id: 2, label: "Välj datum" },
  { id: 3, label: "Välj tid" },
];

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

  const canNavigateToStep = (targetStep: number) => {
    if (targetStep <= 1) return true;
    if (targetStep === 2) return !!selectedService;
    if (targetStep === 3) return !!selectedService && !!selectedDate;
    return false;
  };

  const handleStepNavigation = (targetStep: number) => {
    if (step === targetStep) return;
    if (canNavigateToStep(targetStep)) {
      setStep(targetStep);
    }
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
      <div className="container mx-auto max-w-4xl py-6">
        {/* Stegindikator */}
        <div className="mb-12 mr-14 px-4 sm:px-6">
          <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-4 sm:gap-6">
            {stepsConfig.map((item, index) => {
              const isActive = step === item.id;
              const isCompleted = step > item.id;
              const isClickable = canNavigateToStep(item.id) && step >= item.id;
              const circleClasses = [
                "relative flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-semibold transition-all duration-300 sm:h-11 sm:w-11",
                isActive
                  ? "border-primary bg-primary text-primary-content shadow-lg shadow-primary/30"
                  : isCompleted
                  ? "border-primary/40 bg-primary/10 text-primary"
                  : "border-base-300 bg-base-100 text-base-content/50",
                isClickable
                  ? "cursor-pointer hover:border-primary"
                  : "cursor-default",
              ].join(" ");
              const labelClasses = [
                "mt-3 text-center text-sm font-medium transition-colors",
                isActive
                  ? "text-base-content"
                  : isCompleted
                  ? "text-base-content/80"
                  : "text-base-content/60",
              ].join(" ");

              return (
                <React.Fragment key={item.id}>
                  <div className="flex min-w-0 flex-col items-center">
                    <button
                      type="button"
                      data-step={item.id}
                      onClick={() => handleStepNavigation(item.id)}
                      disabled={!isClickable}
                      className={circleClasses}
                    >
                      {isCompleted ? (
                        <span className="flex h-5 w-5 items-center justify-center">
                          <CheckCircle2 className="h-4 w-4" />
                        </span>
                      ) : (
                        item.id
                      )}
                    </button>
                    <span className={labelClasses}>{item.label}</span>
                  </div>
                  {index < stepsConfig.length - 1 && (
                    <div className="flex-1">
                      <div
                        className={`mx-auto mb-8 h-[2px] w-full rounded-full transition-all duration-500 ${
                          step > item.id
                            ? "bg-gradient-to-r from-primary via-primary/70 to-primary/40"
                            : "bg-base-300/60"
                        }`}
                      />
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        <div className="space-y-6">
          {step === 1 && (
            <>
              <ServiceSelector
                services={services}
                selectedService={selectedService}
                onServiceChange={handleServiceChange}
                title="Välj din behandling"
              />
              <div className="mt-4 flex justify-end">
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
              <div className="mt-4 flex justify-between">
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
                        { locale: sv }
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
              <div className="mt-4 flex justify-between">
                <button className="btn btn-ghost" onClick={() => setStep(2)}>
                  Tillbaka
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handleOpenModal}
                  disabled={!selectedSlot || bookingLoading}
                >
                  {bookingLoading ? (
                    <>
                      <span className="loading loading-spinner mr-2" />
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
