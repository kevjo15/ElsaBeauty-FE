import React, { useState, useEffect } from "react";
import { useAuth } from "@/services/api/authContext";
import { useNavigate, useLocation } from "react-router-dom";
import MainLayout from "@/components/layout/main-layout";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import {
  createBooking,
  type Service,
  type TimeSlot,
  type BookingRequest,
} from "@/services/api";
import ServiceSelector from "@/components/booking/ServiceSelector";
import EmployeeSelector from "@/components/booking/EmployeeSelector";
import TimeSlotSelector from "@/components/booking/TimeSlotSelector";
import BookingSummary from "@/components/booking/BookingSummary";
import DateSelector from "@/components/booking/DateSelector";
import BookingConfirmationModal from "@/components/booking/BookingConfirmationModal";
import PaymentChoiceModal, {
  type PaymentChoiceResult,
} from "@/components/booking/PaymentChoiceModal";
import { isStripeEnabled } from "@/services/stripe";
import { useServices } from "@/hooks/useServices";
import { useTimeSlots } from "@/hooks/useTimeSlots";
import { CheckCircle2, Clock, X } from "lucide-react";
import { isPast, startOfDay } from "date-fns";
import { getEmployees } from "@/services/api/userAPI";
import type { Employee } from "@/services/api/types";

interface ApiError {
  response?: {
    data?: string | { error?: string };
  };
}

const extractErrorMessage = (error: unknown): string => {
  const apiError = error as ApiError;
  const data = apiError?.response?.data;
  if (typeof data === "string" && data.length > 0) return data;
  if (typeof data === "object" && data?.error) return data.error;
  return "Misslyckades med att skapa bokning. Försök igen.";
};

const BOOKING_STORAGE_KEY = "elsabeauty_booking_draft";
const DRAFT_MAX_AGE_HOURS = 24;

interface BookingDraft {
  serviceId?: string;
  serviceName?: string;
  employeeId?: string;
  date?: string;
  step: number;
  savedAt: number;
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
    if (saved) return JSON.parse(saved) as BookingDraft;
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
  const ageInHours = (Date.now() - draft.savedAt) / (1000 * 60 * 60);
  if (ageInHours > DRAFT_MAX_AGE_HOURS) return false;
  if (draft.date) {
    const draftDate = startOfDay(new Date(draft.date));
    if (isPast(draftDate) && draftDate < startOfDay(new Date())) return false;
  }
  return true;
};

const stepsConfig = [
  { id: 1, label: "Välj behandling" },
  { id: 2, label: "Välj medarbetare" },
  { id: 3, label: "Välj datum" },
  { id: 4, label: "Välj tid" },
];

const BookingPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { services, error: servicesError } = useServices();
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [employeesLoading, setEmployeesLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const {
    availableSlots,
    loading: timeSlotsLoading,
    error: timeSlotsError,
  } = useTimeSlots(selectedService?.id, selectedEmployee?.id, selectedDate);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [step, setStep] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showCardModal, setShowCardModal] = useState(false);
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [showDraftBanner, setShowDraftBanner] = useState(false);
  const [pendingDraft, setPendingDraft] = useState<BookingDraft | null>(null);

  useEffect(() => {
    setEmployeesLoading(true);
    getEmployees()
      .then(setEmployees)
      .finally(() => setEmployeesLoading(false));
  }, []);

  useEffect(() => {
    if (draftLoaded || services.length === 0) return;

    const navState = location.state as {
      preselectedServiceId?: string;
      startAtStep?: number;
    } | null;

    if (navState?.preselectedServiceId) {
      const pre = services.find((s) => s.id === navState.preselectedServiceId) || null;
      if (pre) {
        setSelectedService(pre);
        setSelectedSlot(null);
        setStep(navState.startAtStep ?? 2);
        clearBookingDraft();
        setDraftLoaded(true);
        return;
      }
    }

    const draft = loadBookingDraft();
    if (draft?.serviceId) {
      if (!isDraftValid(draft)) {
        clearBookingDraft();
        setDraftLoaded(true);
        return;
      }
      const savedService = services.find((s) => s.id === draft.serviceId);
      if (savedService) {
        setPendingDraft({ ...draft, serviceName: savedService.name });
        setShowDraftBanner(true);
      }
    }
    setDraftLoaded(true);
  }, [services, location.state, draftLoaded]);

  const handleContinueDraft = () => {
    if (!pendingDraft) return;
    const savedService = services.find((s) => s.id === pendingDraft.serviceId) || null;
    if (savedService) setSelectedService(savedService);
    if (pendingDraft.employeeId) {
      const emp = employees.find((e) => e.id === pendingDraft.employeeId) || null;
      if (emp) setSelectedEmployee(emp);
    }
    if (pendingDraft.date) setSelectedDate(new Date(pendingDraft.date));
    if (pendingDraft.step) setStep(pendingDraft.step);
    setShowDraftBanner(false);
    setPendingDraft(null);
  };

  const handleStartFresh = () => {
    clearBookingDraft();
    setShowDraftBanner(false);
    setPendingDraft(null);
    setSelectedService(null);
    setSelectedEmployee(null);
    setSelectedDate(undefined);
    setSelectedSlot(null);
    setStep(1);
  };

  useEffect(() => {
    if (!draftLoaded || showDraftBanner) return;
    if (selectedService) {
      const draft: BookingDraft = {
        serviceId: selectedService.id,
        serviceName: selectedService.name,
        employeeId: selectedEmployee?.id,
        date: selectedDate?.toISOString(),
        step,
        savedAt: Date.now(),
      };
      saveBookingDraft(draft);
    }
  }, [selectedService, selectedEmployee, selectedDate, step, draftLoaded, showDraftBanner]);

  const handleServiceChange = (serviceId: string) => {
    setSelectedService(services.find((s) => s.id === serviceId) || null);
    setSelectedEmployee(null);
    setSelectedSlot(null);
  };

  const handleEmployeeChange = (employee: Employee) => {
    setSelectedEmployee(employee);
    setSelectedSlot(null);
  };

  const handleDateChange = (date: Date | undefined) => {
    setSelectedDate(date);
    setSelectedSlot(null);
  };

  const canNavigateToStep = (targetStep: number) => {
    if (targetStep <= 1) return true;
    if (targetStep === 2) return !!selectedService;
    if (targetStep === 3) return !!selectedService && !!selectedEmployee;
    if (targetStep === 4) return !!selectedService && !!selectedEmployee && !!selectedDate;
    return false;
  };

  const handleStepNavigation = (targetStep: number) => {
    if (step === targetStep) return;
    if (canNavigateToStep(targetStep)) setStep(targetStep);
  };

  const handleOpenModal = () => {
    if (!selectedService || !selectedEmployee || !selectedDate || !selectedSlot) {
      setBookingError("Vänligen välj behandling, medarbetare, datum och tid.");
      return;
    }
    setIsModalOpen(true);
  };

  // Skapar bokningen. paymentMethodId sätts när kort-på-fil-steget körts.
  const finalizeBooking = async (payment: PaymentChoiceResult = {}) => {
    if (!user || !selectedService || !selectedEmployee || !selectedSlot) {
      setBookingError("Vänligen välj behandling, medarbetare, datum och tid.");
      return;
    }

    setBookingLoading(true);
    setBookingError(null);

    try {
      const bookingData: BookingRequest = {
        userId: user.id,
        serviceId: selectedService.id,
        employeeId: selectedEmployee.id,
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
        paymentMethodId: payment.paymentMethodId,
        paymentIntentId: payment.paymentIntentId,
      };

      const bookingResponse = await createBooking(bookingData);
      clearBookingDraft();

      setSelectedService(null);
      setSelectedEmployee(null);
      setSelectedDate(undefined);
      setSelectedSlot(null);

      navigate(`/booking-confirmation/${bookingResponse?.id || ""}`, {
        state: {
          bookingDetails: {
            service: selectedService,
            employee: selectedEmployee,
            date: selectedDate,
            slot: selectedSlot,
            paymentStatus: bookingResponse?.paymentStatus,
            amountPaid: bookingResponse?.amountPaid,
            hasSavedCard: bookingResponse?.hasSavedCard,
          },
        },
      });
    } catch (error: unknown) {
      const msg = extractErrorMessage(error);
      setBookingError(msg);
      // If the slot was taken by someone else, clear it so the user picks a new one
      if (msg.includes("inte längre tillgänglig")) {
        setSelectedSlot(null);
      }
    } finally {
      setBookingLoading(false);
      setIsModalOpen(false);
      setShowCardModal(false);
    }
  };

  const handleConfirmBooking = async () => {
    if (!user || !selectedService || !selectedEmployee || !selectedSlot) {
      setBookingError("Vänligen välj behandling, medarbetare, datum och tid.");
      return;
    }

    // Kort-på-fil: när Stripe är konfigurerat sparas kortet/betalningen först, sedan
    // skapas bokningen. Utan Stripe (ingen publik nyckel) bokas kortlöst — steget hoppas
    // över. Redirect-betalsätt (Klarna) hanteras via PI-metadatan + /payment-return.
    if (isStripeEnabled) {
      setIsModalOpen(false);
      setShowCardModal(true);
      return;
    }

    await finalizeBooking();
  };

  const formatTimeSlot = (slot: TimeSlot) =>
    `${format(new Date(slot.startTime), "HH:mm")} - ${format(new Date(slot.endTime), "HH:mm")}`;

  return (
    <MainLayout>
      <div className="container mx-auto max-w-4xl py-6">
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
              <button className="btn btn-ghost btn-sm" onClick={handleStartFresh}>
                Börja om
              </button>
              <button className="btn btn-primary btn-sm" onClick={handleContinueDraft}>
                Fortsätt
              </button>
            </div>
            <button className="btn btn-ghost btn-sm btn-circle" onClick={handleStartFresh} aria-label="Stäng">
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
                isClickable ? "cursor-pointer hover:border-primary" : "cursor-default",
              ].join(" ");
              const labelClasses = [
                "mt-3 text-center text-sm font-medium transition-colors",
                isActive ? "text-base-content" : isCompleted ? "text-base-content/80" : "text-base-content/60",
              ].join(" ");

              return (
                <React.Fragment key={item.id}>
                  <div className="flex min-w-0 flex-col items-center">
                    <button
                      type="button"
                      onClick={() => handleStepNavigation(item.id)}
                      disabled={!isClickable}
                      className={circleClasses}
                    >
                      {isCompleted ? <CheckCircle2 className="h-4 w-4" /> : item.id}
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
                <button className="btn btn-ghost" onClick={() => { clearBookingDraft(); navigate("/dashboard"); }}>
                  Avbryt
                </button>
                <button className="btn btn-primary" onClick={() => setStep(2)} disabled={!selectedService}>
                  Nästa
                </button>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <EmployeeSelector
                employees={employees}
                selectedEmployee={selectedEmployee}
                onEmployeeChange={handleEmployeeChange}
                loading={employeesLoading}
                title="Välj medarbetare"
              />
              <div className="mt-4 flex justify-between">
                <button className="btn btn-ghost" onClick={() => setStep(1)}>Tillbaka</button>
                <button className="btn btn-primary" onClick={() => setStep(3)} disabled={!selectedEmployee}>
                  Nästa
                </button>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <DateSelector
                selectedDate={selectedDate}
                onDateChange={handleDateChange}
                disabled={!selectedService}
                title="Välj datum"
                selectedService={selectedService}
              />
              <div className="mt-4 flex justify-between">
                <button className="btn btn-ghost" onClick={() => setStep(2)}>Tillbaka</button>
                <button className="btn btn-primary" onClick={() => setStep(4)} disabled={!selectedDate}>
                  Nästa
                </button>
              </div>
            </>
          )}

          {step === 4 && (
            <>
              <TimeSlotSelector
                loading={timeSlotsLoading}
                selectedService={!!selectedService}
                selectedDate={!!selectedDate}
                availableSlots={availableSlots}
                selectedSlot={selectedSlot}
                onSlotSelect={setSelectedSlot}
                formatTimeSlot={formatTimeSlot}
                title="Välj tid"
                subtitle={
                  selectedDate
                    ? `Lediga tider för ${format(selectedDate, "EEEE d MMMM yyyy", { locale: sv })}`
                    : ""
                }
              />
              <BookingSummary
                selectedService={selectedService}
                selectedEmployee={selectedEmployee}
                selectedDate={selectedDate}
                selectedSlot={selectedSlot}
                formatTimeSlot={formatTimeSlot}
              />
              <div className="mt-4 flex justify-between">
                <button className="btn btn-ghost" onClick={() => setStep(3)}>Tillbaka</button>
                <button
                  className="btn btn-primary"
                  onClick={handleOpenModal}
                  disabled={!selectedSlot || bookingLoading}
                >
                  {bookingLoading ? (
                    <><span className="loading loading-spinner mr-2" />Bekräftar...</>
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
          onClose={() => setIsModalOpen(false)}
          onConfirm={handleConfirmBooking}
          selectedService={selectedService}
          selectedEmployee={selectedEmployee}
          selectedDate={selectedDate}
          selectedSlot={selectedSlot}
          loading={bookingLoading}
          formatTimeSlot={formatTimeSlot}
        />

        <PaymentChoiceModal
          isOpen={showCardModal}
          onClose={() => setShowCardModal(false)}
          serviceId={selectedService?.id ?? ""}
          servicePrice={selectedService?.price ?? 0}
          employeeId={selectedEmployee?.id ?? ""}
          startTime={selectedSlot?.startTime ?? ""}
          endTime={selectedSlot?.endTime ?? ""}
          onComplete={(result) => finalizeBooking(result)}
        />
      </div>
    </MainLayout>
  );
};

export default BookingPage;
