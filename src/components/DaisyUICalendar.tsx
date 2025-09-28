import React from "react";
import { DayPicker } from "react-day-picker";
// import "react-day-picker/dist/style.css"; // DaisyUI should handle styling

interface DaisyUICalendarProps {
  selectedDate: Date | undefined;
  onDateChange: (date: Date | undefined) => void;
  disabled?: boolean;
}

const DaisyUICalendar: React.FC<DaisyUICalendarProps> = ({
  selectedDate,
  onDateChange,
  disabled,
}) => {
  return (
    <DayPicker
      mode="single"
      selected={selectedDate}
      onSelect={onDateChange}
      disabled={disabled}
      className="react-day-picker p-4" // DaisyUI class for styling
      classNames={{
        // Custom classNames to integrate with DaisyUI
        months: "flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4",
        month: "space-y-4",
        caption: "flex justify-center relative items-center",
        caption_label: "text-sm font-medium",
        nav: "flex items-center",
        nav_button: "btn btn-ghost btn-sm",
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse border-spacing-1",
        head_row: "flex",
        head_cell: "text-base-content rounded-md w-9 font-normal text-[0.8rem]",
        row: "flex w-full mt-2",
        cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-range-start)]:rounded-l-md [&:has([aria-selected].day-range-middle)]:rounded-none [&:has([aria-selected])]:bg-base-200 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
        day: "day h-9 w-9 p-0 font-normal aria-selected:opacity-100",
        day_range_start: "day-range-start",
        day_range_end: "day-range-end",
        day_range_middle: "day-range-middle",
        day_selected: "btn btn-primary btn-sm rounded-full",
        day_today: "btn btn-sm rounded-full",
        day_outside: "text-base-content opacity-50",
        day_disabled: "text-base-content opacity-50 cursor-not-allowed",
        day_hidden: "invisible",
      }}
    />
  );
};

export default DaisyUICalendar;
