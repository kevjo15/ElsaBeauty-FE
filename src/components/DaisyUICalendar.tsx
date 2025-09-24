import React, { useState, useRef, useEffect } from "react";
import { format } from "date-fns";
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
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleDaySelect = (date: Date | undefined) => {
    onDateChange(date);
    setIsOpen(false); // Close the dropdown after selecting a date
  };

  return (
    <div className="form-control w-full relative">
      <label className="label">
        <span className="label-text">Select Date</span>
      </label>
      <button
        ref={buttonRef}
        type="button"
        className="input input-bordered w-full flex justify-between items-center"
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
      >
        {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`h-5 w-5 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isOpen && (
        <div
          ref={dropdownRef}
          className="dropdown-content z-[1] shadow-lg bg-base-100 rounded-box w-full mt-2 absolute top-full left-0"
        >
          <DayPicker
            mode="single"
            selected={selectedDate}
            onSelect={handleDaySelect}
            className="react-day-picker p-4" // DaisyUI class for styling
            classNames={{
              // Custom classNames to integrate with DaisyUI
              months:
                "flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4",
              month: "space-y-4",
              caption: "flex justify-center relative items-center",
              caption_label: "text-sm font-medium",
              nav: "flex items-center",
              nav_button: "btn btn-ghost btn-sm",
              nav_button_previous: "absolute left-1",
              nav_button_next: "absolute right-1",
              table: "w-full border-collapse border-spacing-1",
              head_row: "flex",
              head_cell:
                "text-base-content rounded-md w-9 font-normal text-[0.8rem]",
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
        </div>
      )}
    </div>
  );
};

export default DaisyUICalendar;
