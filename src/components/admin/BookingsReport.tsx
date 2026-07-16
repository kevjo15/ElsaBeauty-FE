import React, { useCallback, useEffect, useState } from "react";
import { format, startOfMonth } from "date-fns";
import { toast } from "sonner";
import { Download, BarChart3 } from "lucide-react";
import {
  getBookingsReport,
  downloadBookingsReportCsv,
} from "@/services/api/bookingAPI";
import type { BookingsReport as BookingsReportData } from "@/services/api/types";

const formatKr = (value: number) =>
  new Intl.NumberFormat("sv-SE", { maximumFractionDigits: 0 }).format(value) +
  " kr";

/**
 * Bokningsrapport för adminpanelen: valfritt datumintervall,
 * nyckeltal, omsättning per behandling och CSV-export.
 */
const BookingsReport: React.FC = () => {
  const today = new Date();
  const [from, setFrom] = useState(format(startOfMonth(today), "yyyy-MM-dd"));
  const [to, setTo] = useState(format(today, "yyyy-MM-dd"));
  const [report, setReport] = useState<BookingsReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  const loadReport = useCallback(async (fromDate: string, toDate: string) => {
    if (!fromDate || !toDate) return;
    setLoading(true);
    try {
      setReport(await getBookingsReport(fromDate, toDate));
    } catch {
      toast.error("Kunde inte hämta rapporten");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReport(from, to);
    // Endast vid montering — därefter via "Visa"-knappen.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onExport = async () => {
    setExporting(true);
    try {
      await downloadBookingsReportCsv(from, to);
    } catch {
      toast.error("Kunde inte exportera CSV");
    } finally {
      setExporting(false);
    }
  };

  return (
    <section className="card bg-base-100 border border-base-300 shadow-sm rounded-xl">
      <div className="card-body">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="card-title">
            <BarChart3 className="h-5 w-5 text-primary" />
            Rapport & export
          </h2>

          <div className="flex flex-wrap items-end gap-2">
            <div>
              <label htmlFor="report-from" className="label py-0">
                <span className="label-text text-xs">Från</span>
              </label>
              <input
                id="report-from"
                type="date"
                className="input input-bordered input-sm"
                value={from}
                max={to}
                onChange={(e) => setFrom(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="report-to" className="label py-0">
                <span className="label-text text-xs">Till</span>
              </label>
              <input
                id="report-to"
                type="date"
                className="input input-bordered input-sm"
                value={to}
                min={from}
                onChange={(e) => setTo(e.target.value)}
              />
            </div>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => loadReport(from, to)}
              disabled={loading}
            >
              {loading ? (
                <span className="loading loading-spinner loading-xs" />
              ) : null}
              Visa
            </button>
            <button
              className="btn btn-outline btn-sm"
              onClick={onExport}
              disabled={exporting || loading || !report}
            >
              {exporting ? (
                <span className="loading loading-spinner loading-xs" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              Exportera CSV
            </button>
          </div>
        </div>

        {report && (
          <>
            {/* Nyckeltal */}
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 max-w-4xl">
              <div className="rounded-xl bg-primary/10 ring-1 ring-primary/20 p-4">
                <p className="text-sm text-base-content/70">Bokningar</p>
                <p className="text-2xl font-semibold text-primary">
                  {report.totalBookings}
                </p>
              </div>
              <div className="rounded-xl bg-accent/15 ring-1 ring-accent/30 p-4">
                <p className="text-sm text-base-content/70">Bokat värde</p>
                <p className="text-2xl font-semibold">
                  {formatKr(report.totalRevenue)}
                </p>
              </div>
              <div className="rounded-xl bg-success/10 ring-1 ring-success/20 p-4">
                <p className="text-sm text-base-content/70">Inbetalt (online)</p>
                <p className="text-2xl font-semibold text-success">
                  {formatKr(report.amountCollected)}
                </p>
              </div>
              <div className="rounded-xl bg-base-200 ring-1 ring-base-300 p-4">
                <p className="text-sm text-base-content/70">Avbokningar</p>
                <p className="text-2xl font-semibold text-base-content/80">
                  {report.cancelledBookings}
                </p>
              </div>
              <div className="rounded-xl bg-error/10 ring-1 ring-error/20 p-4">
                <p className="text-sm text-base-content/70">Uteblivna</p>
                <p className="text-2xl font-semibold text-error">
                  {report.noShowBookings}
                </p>
              </div>
            </div>

            {/* Per behandling */}
            {report.perService.length > 0 ? (
              <div className="mt-4 overflow-x-auto">
                <table className="table table-sm">
                  <thead>
                    <tr>
                      <th>Behandling</th>
                      <th className="text-right">Antal</th>
                      <th className="text-right">Bokat värde</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.perService.map((line) => (
                      <tr key={line.serviceName}>
                        <td>{line.serviceName}</td>
                        <td className="text-right">{line.count}</td>
                        <td className="text-right">{formatKr(line.revenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="font-semibold">
                      <td>Totalt</td>
                      <td className="text-right">{report.totalBookings}</td>
                      <td className="text-right">
                        {formatKr(report.totalRevenue)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            ) : (
              <p className="mt-4 text-sm text-base-content/60">
                Inga bokningar i valt intervall.
              </p>
            )}
          </>
        )}
      </div>
    </section>
  );
};

export default BookingsReport;
