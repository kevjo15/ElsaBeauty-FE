import React, { useEffect, useState } from "react";
import { getEmployeeSchedule, setEmployeeSchedule } from "@/services/api/scheduleAPI";
import type { EmployeeSchedule } from "@/services/api/types";

const DAYS: { value: number; label: string }[] = [
  { value: 1, label: "Måndag" },
  { value: 2, label: "Tisdag" },
  { value: 3, label: "Onsdag" },
  { value: 4, label: "Torsdag" },
  { value: 5, label: "Fredag" },
  { value: 6, label: "Lördag" },
  { value: 0, label: "Söndag" },
];

interface DayRow {
  dayOfWeek: number;
  active: boolean;
  startTime: string;
  endTime: string;
}

const toTimeInput = (ts: string) => ts.slice(0, 5);

interface ScheduleEditorProps {
  employeeId: string;
}

const ScheduleEditor: React.FC<ScheduleEditorProps> = ({ employeeId }) => {
  const [rows, setRows] = useState<DayRow[]>(
    DAYS.map((d) => ({ dayOfWeek: d.value, active: false, startTime: "09:00", endTime: "17:00" }))
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getEmployeeSchedule(employeeId).then((schedule) => {
      if (schedule.length === 0) return;
      setRows((prev) =>
        prev.map((row) => {
          const match = schedule.find((s) => s.dayOfWeek === row.dayOfWeek);
          if (match) {
            return {
              ...row,
              active: true,
              startTime: toTimeInput(match.startTime),
              endTime: toTimeInput(match.endTime),
            };
          }
          return row;
        })
      );
    });
  }, [employeeId]);

  const toggleDay = (dayOfWeek: number) =>
    setRows((prev) =>
      prev.map((r) => (r.dayOfWeek === dayOfWeek ? { ...r, active: !r.active } : r))
    );

  const updateTime = (dayOfWeek: number, field: "startTime" | "endTime", value: string) =>
    setRows((prev) =>
      prev.map((r) => (r.dayOfWeek === dayOfWeek ? { ...r, [field]: value } : r))
    );

  const handleSave = async () => {
    const schedule: EmployeeSchedule[] = rows
      .filter((r) => r.active)
      .map((r) => ({
        dayOfWeek: r.dayOfWeek,
        startTime: `${r.startTime}:00`,
        endTime: `${r.endTime}:00`,
      }));

    setSaving(true);
    setError(null);
    const ok = await setEmployeeSchedule(employeeId, schedule);
    setSaving(false);
    if (ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } else {
      setError("Kunde inte spara schemat. Försök igen.");
    }
  };

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="table table-sm">
          <thead>
            <tr>
              <th>Aktiv</th>
              <th>Dag</th>
              <th>Starttid</th>
              <th>Sluttid</th>
            </tr>
          </thead>
          <tbody>
            {DAYS.map((day) => {
              const row = rows.find((r) => r.dayOfWeek === day.value)!;
              return (
                <tr key={day.value}>
                  <td>
                    <input
                      type="checkbox"
                      className="checkbox checkbox-primary checkbox-sm"
                      checked={row.active}
                      onChange={() => toggleDay(day.value)}
                    />
                  </td>
                  <td className={row.active ? "font-medium" : "text-base-content/40"}>
                    {day.label}
                  </td>
                  <td>
                    <input
                      type="time"
                      className="input input-bordered input-sm w-28"
                      value={row.startTime}
                      disabled={!row.active}
                      onChange={(e) => updateTime(day.value, "startTime", e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      type="time"
                      className="input input-bordered input-sm w-28"
                      value={row.endTime}
                      disabled={!row.active}
                      onChange={(e) => updateTime(day.value, "endTime", e.target.value)}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {error && <div className="alert alert-error text-sm py-2"><span>{error}</span></div>}

      <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>
        {saving ? <><span className="loading loading-spinner loading-xs" /> Sparar...</> : saved ? "Sparat!" : "Spara mall"}
      </button>
    </div>
  );
};

export default ScheduleEditor;
