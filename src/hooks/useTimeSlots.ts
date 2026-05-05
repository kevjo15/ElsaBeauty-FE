import { useState, useEffect } from "react";
import {
  getAvailableTimeSlots,
  type TimeSlot,
} from "@/services/api";
import { format } from "date-fns";

export const useTimeSlots = (
  serviceId: string | undefined,
  employeeId: string | undefined,
  date: Date | undefined
) => {
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTimeSlots = async () => {
      if (serviceId && employeeId && date) {
        setLoading(true);
        setError(null);
        try {
          const formattedDate = format(date, "yyyy-MM-dd");
          const slots = await getAvailableTimeSlots(serviceId, employeeId, formattedDate);
          const selectedDateSlots = slots.filter((slot) => {
            const slotDate = format(new Date(slot.startTime), "yyyy-MM-dd");
            return slotDate === formattedDate;
          });
          setAvailableSlots(selectedDateSlots);
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
  }, [serviceId, employeeId, date]);

  return { availableSlots, loading, error };
};
