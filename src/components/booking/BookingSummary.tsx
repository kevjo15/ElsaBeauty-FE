import React from "react";
import { type Service, type TimeSlot } from "@/services/api";
import type { Employee } from "@/services/api/types";
import { format } from "date-fns";
import { sv } from "date-fns/locale";

interface BookingSummaryProps {
  selectedService: Service | null;
  selectedEmployee: Employee | null;
  selectedDate: Date | undefined;
  selectedSlot: TimeSlot | null;
  formatTimeSlot: (slot: TimeSlot) => string;
}

const BookingSummary: React.FC<BookingSummaryProps> = ({
  selectedService,
  selectedEmployee,
  selectedDate,
  selectedSlot,
  formatTimeSlot,
}) => {
  if (!selectedSlot || !selectedService || !selectedDate) {
    return null;
  }

  const employeeName = selectedEmployee
    ? [selectedEmployee.firstName, selectedEmployee.lastName].filter(Boolean).join(" ") || selectedEmployee.email
    : null;

  return (
    <div className="card bg-base-200 shadow-xl border-1 border-base-300">
      <div className="card-body p-6">
        <h2 className="card-title text-l font-bold mb-4">Bokningssammanfattning</h2>
        <dl className="mt-3 grid grid-cols-1 gap-y-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-base-content">Behandling:</dt>
            <dd className="font-medium">{selectedService.name}</dd>
          </div>
          {employeeName && (
            <div className="flex justify-between">
              <dt className="text-base-content">Medarbetare:</dt>
              <dd className="font-medium">{employeeName}</dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt className="text-base-content">Pris:</dt>
            <dd className="font-bold text-secondary">{selectedService.price} kr</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-base-content">Datum:</dt>
            <dd className="font-medium">
              {format(selectedDate, "EEEE d MMMM yyyy", { locale: sv })}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-base-content">Tid:</dt>
            <dd className="font-medium">{formatTimeSlot(selectedSlot)}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
};

export default BookingSummary;
