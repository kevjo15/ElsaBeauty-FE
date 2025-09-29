import React from "react";
import { Service, TimeSlot } from "@/services/api/apiService";
import { format } from "date-fns";

interface BookingConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  selectedService: Service | null;
  selectedDate: Date | undefined;
  selectedSlot: TimeSlot | null;
  loading: boolean;
  formatTimeSlot: (slot: TimeSlot) => string;
}

const BookingConfirmationModal: React.FC<BookingConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  selectedService,
  selectedDate,
  selectedSlot,
  loading,
  formatTimeSlot,
}) => {
  if (!isOpen || !selectedService || !selectedDate || !selectedSlot) {
    return null;
  }

  return (
    <dialog className="modal" open={isOpen}>
      <div className="modal-box">
        <h3 className="font-bold text-lg">Bekräfta din bokning</h3>
        <p className="py-4">Vänligen granska dina bokningsdetaljer:</p>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="font-medium">Tjänst:</span>
            <span>{selectedService.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">Datum:</span>
            <span>{format(selectedDate, "PPP")}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">Tid:</span>
            <span>{formatTimeSlot(selectedSlot)}</span>
          </div>
          <div className="flex justify-between font-bold text-lg mt-4">
            <span>Pris:</span>
            <span>{selectedService.price} kr</span>
          </div>
        </div>

        <div className="modal-action">
          <button
            className="btn btn-ghost"
            onClick={onClose}
            disabled={loading}
          >
            Avbryt
          </button>
          <button
            className="btn btn-primary"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="loading loading-spinner mr-2"></span>
                Bekräftar...
              </>
            ) : (
              "Bekräfta"
            )}
          </button>
        </div>
      </div>
    </dialog>
  );
};

export default BookingConfirmationModal;
