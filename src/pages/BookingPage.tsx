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
import { CheckCircle2, Clock, X } from "lucide-react";
import { isPast, startOfDay } from "date-fns";

interface ApiError {
  response?: {
    data?: {
      error?: string;
    };
  };
}

const BOOKING_STORAGE_KEY = "elsabeauty_booking_draft";
const DRAFT_MAX_AGE_HOURS = 24;

interface BookingDraft {
  serviceId?: string;
  serviceName?: string;
  date?: string; // ISO string
  step: number;
  savedAt: number; // timestamp
}

const saveBookingDraft = (draft: BookingDraft) => {
  try {
    sessionStorage.setItem(BOOKING_STORAGE_KEY, JSON.stringify(draft));
  } catch {
    // sessionStorage might be unavailable
  }
};

const loadBookingDraft = (): BookingDraft | null => {
  try {
    const saved = sessionStorage.getItem(BOOKING_STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved) as BookingDraft;
    }
  } catch {
    // sessionStorage might be unavailable
  }
  return null;
};

const clearBookingDraft = () => {
  try {
    sessionStorage.removeItem(BOOKING_STORAGE_KEY);
  } catch {
    // sessionStorage might be unavailable
  }
};

const isDraftValid = (draft: BookingDraft): boolean => {
  // Check if draft is too old (> 24 hours)
  const ageInHours = (Date.now() - draft.savedAt) / (1000 * 60 * 60);
  if (ageInHours > DRAFT_MAX_AGE_HOURS) {
    return false;
  }

  // Check if selected date is in the past
  if (draft.date) {
    const draftDate = startOfDay(new Date(draft.date));
    if (isPast(draftDate) && draftDate < startOfDay(new Date())) {
      return false;
    }
  }

  return true;
};

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
  const [step, setStep] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [showDraftBanner, setShowDraftBanner] = useState(false);
  const [pendingDraft, setPendingDraft] = useState<BookingDraft | null>(null);

  // Load saved draft from sessionStorage on mount
  useEffect(() => {
    if (draftLoaded || services.length === 0) return;

    // Check for preselected service from navigation state first
    const navState = location.state as {
      preselectedServiceId?: string;
      startAtStep?: number;
    } | null;

    if (navState?.preselectedServiceId) {
      const pre = services.find((s) => s.id === navState.preselectedServiceId) || null;
      if (pre) {
        setSelectedService(pre);
        setSelectedSlot(null);
        setStep(
          navState.startAtStep && navState.startAtStep >= 1 && navState.startAtStep <= 3
            ? navState.startAtStep
            : 2
        );
        clearBookingDraft(); // Clear old draft when coming from service page
        setDraftLoaded(true);
        return;
      }
    }

    // Otherwise, check for saved draft in sessionStorage
    const draft = loadBookingDraft();
    if (draft && draft.serviceId) {
      // Validate the draft
      if (!isDraftValid(draft)) {
        // Draft is invalid (too old or date in past) - clear silently
        clearBookingDraft();
        setDraftLoaded(true);
        return;
      }

      // Draft is valid - show banner to let user choose
      const savedService = services.find((s) => s.id === draft.serviceId);
      if (savedService) {
        setPendingDraft({
          ...draft,
          serviceName: savedService.name,
        });
        setShowDraftBanner(true);
      }
    }
    setDraftLoaded(true);
  }, [services, location.state, draftLoaded]);

  // Handle user choosing to continue with draft
  const handleContinueDraft = () => {
    if (!pendingDraft) return;

    const savedService = services.find((s) => s.id === pendingDraft.serviceId) || null;
    if (savedService) {
      setSelectedService(savedService);
    }
    if (pendingDraft.date) {
      setSelectedDate(new Date(pendingDraft.date));
    }
    if (pendingDraft.step) {
      setStep(pendingDraft.step);
    }
    setShowDraftBanner(false);
    setPendingDraft(null);
  };

  // Handle user choosing to start fresh
  const handleStartFresh = () => {
    clearBookingDraft();
    setShowDraftBanner(false);
    setPendingDraft(null);
    setSelectedService(null);
    setSelectedDate(undefined);
    setSelectedSlot(null);
    setStep(1);
  };

  // Save draft to sessionStorage when state changes
  useEffect(() => {
    if (!draftLoaded || showDraftBanner) return;

    // Only save if there's something to save
    if (selectedService) {
      const draft: BookingDraft = {
        serviceId: selectedService.id,
        serviceName: selectedService.name,
        date: selectedDate?.toISOString(),
        step,
        savedAt: Date.now(),
      };
      saveBookingDraft(draft);
    }
  }, [selectedService, selectedDate, step, draftLoaded, showDraftBanner]);

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

    try {
      const bookingData: BookingRequest = {
        userId: user?.id || "test-user-id",
        serviceId: selectedService.id,
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
      };

      const bookingResponse = await createBooking(bookingData);
      const bookingId = bookingResponse?.id;

      // Clear draft from sessionStorage after successful booking
      clearBookingDraft();

      setSelectedService(null);
      setSelectedDate(undefined);
      setSelectedSlot(null);

      navigate(`/booking-confirmation/${bookingId || ""}`, {
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
        {/* Banner för påbörjad bokning */}
        {showDraftBanner && pendingDraft && (
          <div className="mb-6 alert bg-primary/10 border border-primary/20">
            <Clock className="h-5 w-5 text-primary" />
            <div className="flex-1">
              <p className="font-medium">Du har en påbörjad bokning</p>
              <p className="text-sm text-base-content/70">
                {pendingDraft.serviceName}
                {pendingDraft.date && (
                  <> • {format(new Date(pendingDraft.date), "d MMMM", { locale: sv })}</>
                )}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                className="btn btn-ghost btn-sm"
                onClick={handleStartFresh}
              >
                Börja om
              </button>
              <button
                className="btn btn-primary btn-sm"
                onClick={handleContinueDraft}
              >
                Fortsätt
              </button>
            </div>
            <button
              className="btn btn-ghost btn-sm btn-circle"
              onClick={handleStartFresh}
              aria-label="Stäng"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

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
              <div className="mt-4 flex justify-between">
                <button
                  className="btn btn-ghost"
                  onClick={() => {
                    clearBookingDraft();
                    navigate("/dashboard");
                  }}
                >
                  Avbryt
                </button>
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
