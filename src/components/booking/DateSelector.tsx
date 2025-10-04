import React from "react";
import DaisyUICalendar from "@/components/DaisyUICalendar";
import { Service } from "@/services/api/apiService";

interface DateSelectorProps {
  selectedDate: Date | undefined;
  onDateChange: (date: Date | undefined) => void;
  disabled?: boolean;
  title: string;
  selectedService: Service | null;
}

const DateSelector: React.FC<DateSelectorProps> = ({
  selectedDate,
  onDateChange,
  disabled,
  title,
  selectedService,
}) => {
  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body items-center p-6">
        <h2 className="card-title text-center text-2xl font-bold">{title}</h2>
        <p className="text-sm text-gray-500 text-center mb-6">
          {selectedService
            ? `Boka din ${selectedService.name}`
            : "Välj önskat datum för din behandling"}
        </p>
        <div className="flex justify-center w-full">
          <DaisyUICalendar
            selectedDate={selectedDate}
            onDateChange={onDateChange}
            disabled={disabled}
          />
        </div>
      </div>
    </div>
  );
};

export default DateSelector;
