import React from "react";
import { Service, TimeSlot } from "@/services/api/apiService";
import { format } from "date-fns";

interface BookingSummaryProps {
  selectedService: Service | null;
  selectedDate: Date | undefined;
  selectedSlot: TimeSlot | null;
  onBookingSubmit: () => void;
  loading: boolean;
  formatTimeSlot: (slot: TimeSlot) => string;
}

const BookingSummary: React.FC<BookingSummaryProps> = ({
  selectedService,
  selectedDate,
  selectedSlot,
  onBookingSubmit,
  loading,
  formatTimeSlot,
}) => {
  if (!selectedSlot || !selectedService || !selectedDate) {
    return null;
  }

  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <h2 className="card-title">Booking Summary</h2>
        <dl className="mt-3 grid grid-cols-1 gap-y-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-base-content">Service:</dt>
            <dd className="font-medium">{selectedService.name}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-base-content">Date:</dt>
            <dd className="font-medium">{format(selectedDate, "PPP")}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-base-content">Time:</dt>
            <dd className="font-medium">{formatTimeSlot(selectedSlot)}</dd>
          </div>
          <div className="flex justify-between border-t pt-3 mt-2">
            <dt className="text-base-content font-medium">Price:</dt>
            <dd className="font-bold text-primary">
              {selectedService.price} kr
            </dd>
          </div>
        </dl>
        <button
          className="btn btn-primary w-full btn-lg mt-4"
          onClick={onBookingSubmit}
          disabled={loading}
        >
          {loading ? (
            <>
              <span className="loading loading-spinner mr-2"></span>
              Processing...
            </>
          ) : (
            "Confirm Booking"
          )}
        </button>
      </div>
    </div>
  );
};

export default BookingSummary;
