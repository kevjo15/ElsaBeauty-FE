import React from "react";
import { type TimeSlot } from "@/services/api";

interface TimeSlotSelectorProps {
  loading: boolean;
  selectedService: boolean;
  selectedDate: boolean;
  availableSlots: TimeSlot[];
  selectedSlot: TimeSlot | null;
  onSlotSelect: (slot: TimeSlot) => void;
  formatTimeSlot: (slot: TimeSlot) => string;
  title: string;
  subtitle: string;
}

const TimeSlotSelector: React.FC<TimeSlotSelectorProps> = ({
  loading,
  selectedService,
  selectedDate,
  availableSlots,
  selectedSlot,
  onSlotSelect,
  formatTimeSlot,
  title,
  subtitle,
}) => {
  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body p-4 items-center">
        <h2 className="card-title text-center text-2xl font-bold">{title}</h2>
        <p className="text-sm text-gray-500 text-center mb-6">{subtitle}</p>
        {loading ? (
          <div className="flex justify-center py-8">
            <span className="loading loading-spinner loading-lg text-primary"></span>
          </div>
        ) : selectedService && selectedDate ? (
          availableSlots.length > 0 ? (
            <div className="self-stretch w-full grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-2">
              {availableSlots.map((slot, index) => (
                <button
                  key={index}
                  className={`btn transition-all duration-200 ease-in-out ${
                    selectedSlot?.startTime === slot.startTime
                      ? "btn-primary shadow-lg scale-[1.02]"
                      : "btn-block hover:shadow-lg hover:scale-[1.01]"
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
                Inga lediga tider för det valda datumet.
              </p>
              <p className="text-sm mt-2">Vänligen välj ett annat datum.</p>
            </div>
          )
        ) : (
          <div className="py-8 text-center">
            <p className="text-base-content">
              Vänligen välj en behandling och ett datum för att se lediga tider.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TimeSlotSelector;
