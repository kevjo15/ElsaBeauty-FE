import React from "react";
import DaisyUICalendar from "@/components/DaisyUICalendar";

interface DateSelectorProps {
  selectedDate: Date | undefined;
  onDateChange: (date: Date | undefined) => void;
  disabled?: boolean;
}

const DateSelector: React.FC<DateSelectorProps> = ({
  selectedDate,
  onDateChange,
  disabled,
}) => {
  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <h2 className="card-title">Välj Datum</h2>
        <div className="flex justify-center">
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
