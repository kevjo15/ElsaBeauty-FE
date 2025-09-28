import React from "react";
import { TimeSlot } from "@/services/api/apiService";

interface TimeSlotSelectorProps {
  loading: boolean;
  selectedService: boolean;
  selectedDate: boolean;
  availableSlots: TimeSlot[];
  selectedSlot: TimeSlot | null;
  onSlotSelect: (slot: TimeSlot) => void;
  formatTimeSlot: (slot: TimeSlot) => string;
}

const TimeSlotSelector: React.FC<TimeSlotSelectorProps> = ({
  loading,
  selectedService,
  selectedDate,
  availableSlots,
  selectedSlot,
  onSlotSelect,
  formatTimeSlot,
}) => {
  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <h2 className="card-title">Select Time Slot</h2>
        {loading ? (
          <div className="flex justify-center py-8">
            <span className="loading loading-spinner loading-lg text-primary"></span>
          </div>
        ) : selectedService && selectedDate ? (
          availableSlots.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
              {availableSlots.map((slot, index) => (
                <button
                  key={index}
                  className={`btn w-full ${
                    selectedSlot?.startTime === slot.startTime
                      ? "btn-primary"
                      : "btn-outline"
                  }`}
                  onClick={() => onSlotSelect(slot)}
                >
                  {formatTimeSlot(slot)}
                </button>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center">
              <p className="text-base-content">
                No available time slots for the selected date.
              </p>
              <p className="text-sm mt-2">Please select a different date.</p>
            </div>
          )
        ) : (
          <div className="py-8 text-center">
            <p className="text-base-content">
              Please select a service and date to view available time slots.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TimeSlotSelector;
