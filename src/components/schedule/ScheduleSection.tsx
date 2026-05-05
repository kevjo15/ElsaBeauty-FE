import React, { useState } from "react";
import WeeklyScheduleEditor from "./WeeklyScheduleEditor";
import ScheduleEditor from "./ScheduleEditor";

interface ScheduleSectionProps {
  employeeId: string;
}

const ScheduleSection: React.FC<ScheduleSectionProps> = ({ employeeId }) => {
  const [tab, setTab] = useState<"week" | "template">("week");

  return (
    <div>
      <div role="tablist" className="tabs tabs-bordered mb-6">
        <button
          role="tab"
          className={`tab ${tab === "week" ? "tab-active font-semibold" : ""}`}
          onClick={() => setTab("week")}
        >
          Veckoschema
        </button>
        <button
          role="tab"
          className={`tab ${tab === "template" ? "tab-active font-semibold" : ""}`}
          onClick={() => setTab("template")}
        >
          Mall
        </button>
      </div>

      {tab === "week" && (
        <WeeklyScheduleEditor
          employeeId={employeeId}
          onSwitchToTemplate={() => setTab("template")}
        />
      )}

      {tab === "template" && (
        <div>
          <p className="text-sm text-base-content/60 mb-4">
            Ditt standardschema — vilka dagar och tider du normalt jobbar. Används som mall när
            du fyller kommande veckor under <strong>Veckoschema</strong>.
          </p>
          <ScheduleEditor employeeId={employeeId} />
        </div>
      )}
    </div>
  );
};

export default ScheduleSection;
