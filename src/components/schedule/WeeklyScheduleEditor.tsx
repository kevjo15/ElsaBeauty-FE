import React, { useCallback, useEffect, useState } from "react";
import { addDays, format, getISOWeek, startOfWeek } from "date-fns";
import { sv } from "date-fns/locale";
import { CalendarDays, ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import { generateWorkDays, getWorkDays, setWorkDays } from "@/services/api/workDayAPI";
import type { WorkDay } from "@/services/api/types";

interface DayRow {
  date: string;
  label: string;
  active: boolean;
  startTime: string;
  endTime: string;
}

interface WeeklyScheduleEditorProps {
  employeeId: string;
  onSwitchToTemplate?: () => void;
}

const toDateStr = (d: Date) => format(d, "yyyy-MM-dd");
const toTimeInput = (ts: string) => ts.slice(0, 5);

const buildRows = (weekStart: Date, workDays: WorkDay[]): DayRow[] => {
  const byDate = Object.fromEntries(workDays.map((w) => [w.date, w]));
  return Array.from({ length: 7 }, (_, i) => {
    const date = addDays(weekStart, i);
    const dateStr = toDateStr(date);
    const wd = byDate[dateStr];
    return {
      date: dateStr,
      label: format(date, "EEEE d MMM", { locale: sv }),
      active: !!wd,
      startTime: wd ? toTimeInput(wd.startTime) : "09:00",
      endTime: wd ? toTimeInput(wd.endTime) : "17:00",
    };
  });
};

const BULK_OPTIONS = [
  { label: "Denna vecka", weeks: 1 },
  { label: "2 veckor", weeks: 2 },
  { label: "4 veckor", weeks: 4 },
  { label: "8 veckor", weeks: 8 },
];

const WeeklyScheduleEditor: React.FC<WeeklyScheduleEditorProps> = ({
  employeeId,
  onSwitchToTemplate,
}) => {
  const [weekStart, setWeekStart] = useState<Date>(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );
  const [rows, setRows] = useState<DayRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // For the week strip overview — 8 upcoming weeks from today
  const [upcomingDates, setUpcomingDates] = useState<Set<string>>(new Set());
  const [loadingOverview, setLoadingOverview] = useState(false);

  // Confirm overwrite dialog
  const [confirmOverwrite, setConfirmOverwrite] = useState<{ weeks: number } | null>(null);

  const weekEnd = addDays(weekStart, 6);
  const todayWeekStart = startOfWeek(new Date(), { weekStartsOn: 1 });

  const loadOverview = useCallback(async () => {
    setLoadingOverview(true);
    try {
      const from = toDateStr(todayWeekStart);
      const to = toDateStr(addDays(todayWeekStart, 7 * 8 - 1));
      const data = await getWorkDays(employeeId, from, to);
      setUpcomingDates(new Set(data.map((d) => d.date)));
    } finally {
      setLoadingOverview(false);
    }
  }, [employeeId]); // eslint-disable-line react-hooks/exhaustive-deps

  const weekHasDays = (ws: Date) =>
    Array.from({ length: 7 }, (_, i) => toDateStr(addDays(ws, i))).some((d) =>
      upcomingDates.has(d)
    );

  const weekDayCount = (ws: Date) =>
    Array.from({ length: 7 }, (_, i) => toDateStr(addDays(ws, i))).filter((d) =>
      upcomingDates.has(d)
    ).length;

  const loadWeek = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getWorkDays(employeeId, toDateStr(weekStart), toDateStr(weekEnd));
      setRows(buildRows(weekStart, data));
    } catch {
      setError("Kunde inte hämta schema.");
    } finally {
      setLoading(false);
    }
  }, [employeeId, weekStart]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    void loadWeek();
  }, [loadWeek]);

  useEffect(() => {
    void loadOverview();
  }, [loadOverview]);

  const prevWeek = () => setWeekStart((w) => addDays(w, -7));
  const nextWeek = () => setWeekStart((w) => addDays(w, 7));

  const toggleDay = (date: string) =>
    setRows((prev) => prev.map((r) => (r.date === date ? { ...r, active: !r.active } : r)));

  const updateTime = (date: string, field: "startTime" | "endTime", value: string) =>
    setRows((prev) => prev.map((r) => (r.date === date ? { ...r, [field]: value } : r)));

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    const ok = await setWorkDays(employeeId, {
      from: toDateStr(weekStart),
      to: toDateStr(weekEnd),
      workDays: rows
        .filter((r) => r.active)
        .map((r) => ({
          date: r.date,
          startTime: `${r.startTime}:00`,
          endTime: `${r.endTime}:00`,
        })),
    });
    setSaving(false);
    if (ok) {
      setSaved(true);
      void loadOverview();
      setTimeout(() => setSaved(false), 3000);
    } else {
      setError("Kunde inte spara. Försök igen.");
    }
  };

  const requestGenerate = (weeks: number) => {
    const hasExisting = rows.some((r) => r.active);
    if (hasExisting && weeks === 1) {
      setConfirmOverwrite({ weeks });
    } else {
      void doGenerate(weeks);
    }
  };

  const doGenerate = async (weeks: number) => {
    setConfirmOverwrite(null);
    setGenerating(true);
    setError(null);
    const from = toDateStr(weekStart);
    const to = toDateStr(addDays(weekStart, weeks * 7 - 1));
    const ok = await generateWorkDays(employeeId, { from, to });
    setGenerating(false);
    if (ok) {
      await loadWeek();
      void loadOverview();
    } else {
        setError("Ingen mall hittades. Sätt upp en mall under fliken 'Mall' först.");
    }
  };

  const hasActiveDays = rows.some((r) => r.active);

  return (
    <div className="space-y-5">
      {/* Upcoming weeks strip */}
      <div className="space-y-1">
        <p className="text-xs text-base-content/50 uppercase tracking-wide">Kommande veckor</p>
        <div className="flex gap-1.5 flex-wrap">
          {Array.from({ length: 8 }, (_, i) => {
            const ws = addDays(todayWeekStart, i * 7);
            const isSelected =
              toDateStr(ws) === toDateStr(weekStart);
            const count = weekDayCount(ws);
            const hasData = count > 0;
            return (
              <button
                key={i}
                onClick={() => setWeekStart(ws)}
                disabled={loadingOverview}
                className={[
                  "btn btn-xs gap-1 font-normal",
                  isSelected
                    ? "btn-primary"
                    : hasData
                    ? "btn-ghost border border-primary/40 text-primary"
                    : "btn-ghost border border-base-300 text-base-content/50",
                ].join(" ")}
                title={`v.${getISOWeek(ws)} — ${count} dagar inlagda`}
              >
                v.{getISOWeek(ws)}
                {hasData && (
                  <span
                    className={`badge badge-xs ${isSelected ? "badge-primary-content bg-white/30 text-white" : "badge-primary"}`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Week navigation */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1">
          <button
            className="btn btn-ghost btn-sm btn-circle"
            onClick={prevWeek}
            aria-label="Föregående vecka"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="font-medium text-sm min-w-[210px] text-center">
            {format(weekStart, "d MMM", { locale: sv })} –{" "}
            {format(weekEnd, "d MMM yyyy", { locale: sv })}
          </span>
          <button
            className="btn btn-ghost btn-sm btn-circle"
            onClick={nextWeek}
            aria-label="Nästa vecka"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Fyll från mall */}
        <div className="ml-auto flex items-center gap-2">
          <select
            className="select select-bordered select-xs"
            defaultValue="1"
            id="bulk-weeks-select"
          >
            {BULK_OPTIONS.map((o) => (
              <option key={o.weeks} value={o.weeks}>
                {o.label}
              </option>
            ))}
          </select>
          <button
            className="btn btn-ghost btn-sm gap-1"
            onClick={() => {
              const sel = document.getElementById("bulk-weeks-select") as HTMLSelectElement;
              requestGenerate(Number(sel?.value ?? 1));
            }}
            disabled={generating || loading}
          >
            <RefreshCw className={`h-4 w-4 ${generating ? "animate-spin" : ""}`} />
            Fyll från mall
          </button>
        </div>
      </div>

      {/* Table or empty state */}
      {loading ? (
        <div className="flex justify-center py-8">
          <span className="loading loading-spinner loading-md" />
        </div>
      ) : !hasActiveDays && !loading ? (
        <div className="rounded-xl border border-dashed border-base-300 bg-base-200/40 p-8 text-center space-y-3">
          <CalendarDays className="h-8 w-8 text-base-content/30 mx-auto" />
          <p className="font-medium text-base-content/70">Inga pass inlagda för den här veckan</p>
          <p className="text-sm text-base-content/50">
            Bocka i dagarna nedan, eller använd{" "}
            <button
              className="link link-primary"
              onClick={() => requestGenerate(1)}
              disabled={generating}
            >
              Fyll från mall
            </button>
            {onSwitchToTemplate && (
              <>
                {" "}
                (kräver att du{" "}
                <button className="link link-primary" onClick={onSwitchToTemplate}>
                  skapat en mall
                </button>
                )
              </>
            )}
            .
          </p>
          <div className="overflow-x-auto mt-4">
            <table className="table table-sm">
              <thead>
                <tr>
                  <th className="w-8">Aktiv</th>
                  <th>Dag</th>
                  <th>Starttid</th>
                  <th>Sluttid</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <DayTableRow
                    key={row.date}
                    row={row}
                    onToggle={toggleDay}
                    onUpdateTime={updateTime}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="table table-sm">
            <thead>
              <tr>
                <th className="w-8">Aktiv</th>
                <th>Dag</th>
                <th>Starttid</th>
                <th>Sluttid</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <DayTableRow
                  key={row.date}
                  row={row}
                  onToggle={toggleDay}
                  onUpdateTime={updateTime}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {error && (
        <div className="alert alert-error text-sm py-2">
          <span>{error}</span>
        </div>
      )}

      <button
        className="btn btn-primary btn-sm"
        onClick={handleSave}
        disabled={saving || loading}
      >
        {saving ? (
          <>
            <span className="loading loading-spinner loading-xs" /> Sparar...
          </>
        ) : saved ? (
          "Sparat!"
        ) : (
          "Spara vecka"
        )}
      </button>

      {/* Confirm overwrite dialog */}
      {confirmOverwrite && (
        <dialog className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg">Skriva över befintliga pass?</h3>
            <p className="py-3 text-sm text-base-content/70">
              Den här veckan har redan pass inlagda. Att fylla från mall ersätter dem med mallens
              tider.
            </p>
            <div className="modal-action">
              <button className="btn btn-ghost btn-sm" onClick={() => setConfirmOverwrite(null)}>
                Avbryt
              </button>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => doGenerate(confirmOverwrite.weeks)}
              >
                Ja, skriv över
              </button>
            </div>
          </div>
          <div
            className="modal-backdrop bg-black/30"
            onClick={() => setConfirmOverwrite(null)}
          />
        </dialog>
      )}
    </div>
  );
};

const DayTableRow: React.FC<{
  row: DayRow;
  onToggle: (date: string) => void;
  onUpdateTime: (date: string, field: "startTime" | "endTime", value: string) => void;
}> = ({ row, onToggle, onUpdateTime }) => (
  <tr className={row.active ? "" : "opacity-40"}>
    <td>
      <input
        type="checkbox"
        className="checkbox checkbox-primary checkbox-sm"
        checked={row.active}
        onChange={() => onToggle(row.date)}
      />
    </td>
    <td className={`capitalize ${row.active ? "font-medium" : ""}`}>{row.label}</td>
    <td>
      <input
        type="time"
        className="input input-bordered input-sm w-28"
        value={row.startTime}
        disabled={!row.active}
        onChange={(e) => onUpdateTime(row.date, "startTime", e.target.value)}
      />
    </td>
    <td>
      <input
        type="time"
        className="input input-bordered input-sm w-28"
        value={row.endTime}
        disabled={!row.active}
        onChange={(e) => onUpdateTime(row.date, "endTime", e.target.value)}
      />
    </td>
  </tr>
);

export default WeeklyScheduleEditor;
