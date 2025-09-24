import React, { useState, useEffect } from "react";
import { useAuth } from "@/services/api/authContext";
import { useNavigate } from "react-router-dom";
import MainLayout from "@/components/layout/main-layout";
import { format } from "date-fns";
import {
  Service,
  TimeSlot,
  BookingRequest,
  getAllServices,
  getAvailableTimeSlots,
  createBooking,
} from "@/services/api/apiService";
import ServiceSelector from "@/components/booking/ServiceSelector";
import TimeSlotSelector from "@/components/booking/TimeSlotSelector";
import BookingSummary from "@/components/booking/BookingSummary";

const BookingPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const servicesData = await getAllServices();
        setServices(servicesData);
      } catch (error) {
        console.error("Error fetching services:", error);
        setError("Failed to load services. Please try again later.");
      }
    };

    fetchServices();
  }, []);

  useEffect(() => {
    const fetchTimeSlots = async () => {
      if (selectedService && selectedDate) {
        setLoading(true);
        setError(null);
        try {
          const formattedDate = format(selectedDate, "yyyy-MM-dd");

          const slots = await getAvailableTimeSlots(
            selectedService.id,
            formattedDate
          );

          const selectedDateSlots = slots.filter((slot) => {
            const slotDate = format(new Date(slot.startTime), "yyyy-MM-dd");
            return slotDate === formattedDate;
          });

          setAvailableSlots(selectedDateSlots);
          setSelectedSlot(null);
        } catch (error) {
          console.error("Error fetching time slots:", error);
          setError(
            "Failed to load available time slots. Please try again later."
          );
          setAvailableSlots([]);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchTimeSlots();
  }, [selectedService, selectedDate]);

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
      setError("Please select a service and time slot.");
      return;
    }

    setLoading(true);
    setError(null);
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
      setAvailableSlots([]);

      setTimeout(() => {
        navigate("/bookings");
      }, 2000);
    } catch (error) {
      console.error("Error creating booking:", error);
      setError("Failed to create booking. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const formatTimeSlot = (slot: TimeSlot) => {
    const startTime = new Date(slot.startTime);
    const endTime = new Date(slot.endTime);
    return `${format(startTime, "HH:mm")} - ${format(endTime, "HH:mm")}`;
  };

  return (
    <MainLayout>
      <div className="container mx-auto py-6">
        <h1 className="text-3xl font-bold mb-6">Book an Appointment</h1>

        <div className="space-y-6">
          <ServiceSelector
            services={services}
            selectedService={selectedService}
            onServiceChange={handleServiceChange}
            selectedDate={selectedDate}
            onDateChange={handleDateChange}
          />

          <TimeSlotSelector
            loading={loading}
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
            loading={loading}
            formatTimeSlot={formatTimeSlot}
          />
        </div>

        {error && (
          <div role="alert" className="alert alert-error mt-6">
            <h3 className="font-bold">Error</h3>
            <p>{error}</p>
          </div>
        )}

        {success && (
          <div role="alert" className="alert alert-success mt-6">
            <h3 className="font-bold">Success</h3>
            <p>{success}</p>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default BookingPage;
