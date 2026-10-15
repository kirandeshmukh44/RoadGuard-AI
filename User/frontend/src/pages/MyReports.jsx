import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertCircle, ArrowDownToLine, ArrowRight, ClipboardList, FileText, MapPin, Plus, RefreshCw } from 'lucide-react';
import { reportAPI } from '../api';

const apiOrigin = import.meta.env.VITE_API_URL || '';

const MyReports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchReports = useCallback(async ({ quiet = false } = {}) => {
    if (quiet) setRefreshing(true);
    else setLoading(true);
    setError('');
    try {
      const response = await reportAPI.getAll();
      setReports(Array.isArray(response.data) ? response.data : []);
    } catch (requestError) {
      setError(requestError.response?.data?.detail || (requestError.code === 'ERR_NETWORK'
        ? 'Could not connect to the server. Please check that the app is running.'
        : 'Your reports could not be loaded. Please try again.'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  const downloadReport = (reportPath) => {
    if (!reportPath) return;
    const url = /^https?:\/\//i.test(reportPath) ? reportPath : `${apiOrigin}${reportPath.startsWith('/') ? '' : '/'}${reportPath}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const generatedCount = reports.filter((report) => report.status?.toLowerCase() === 'generated').length;

  return (
    <div className="space-y-8 pb-10">
      <motion.section
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-900 p-7 text-white shadow-xl shadow-blue-950/15 sm:p-10"
      >
        <div className="pointer-events-none absolute -right-12 -top-24 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="relative flex flex-col gap-7 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold text-cyan-100">
              <ClipboardList className="h-4 w-4" /> REPORT CENTER
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">My road reports</h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-blue-100/80 sm:text-base">Track the potholes you have reported and download a copy of each generated report.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={() => fetchReports({ quiet: true })} disabled={refreshing} className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/15 disabled:opacity-60">
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} /> Refresh
            </button>
            <Link to="/report" className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-300 px-4 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-200">
              <Plus className="h-4 w-4" /> New report
            </Link>
          </div>
        </div>
      </motion.section>

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Total reports</p>
          <p className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">{loading ? '—' : reports.length}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Ready to download</p>
          <p className="mt-2 text-3xl font-extrabold tracking-tight text-emerald-600">{loading ? '—' : generatedCount}</p>
        </div>
        <div className="flex items-center justify-between rounded-2xl border border-blue-100 bg-blue-50 p-5">
          <div><p className="text-sm font-semibold text-blue-950">Found a road issue?</p><p className="mt-1 text-sm text-blue-800/75">Send a new report with its location.</p></div>
          <Link to="/report" aria-label="Create a report" className="rounded-xl bg-white p-3 text-blue-700 shadow-sm transition hover:-translate-y-0.5"><ArrowRight className="h-5 w-5" /></Link>
        </div>
      </section>

      {error && <div role="alert" className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800"><AlertCircle className="mt-0.5 h-5 w-5 shrink-0" /><div className="flex-1">{error}</div><button type="button" onClick={() => fetchReports()} className="font-bold underline underline-offset-2">Try again</button></div>}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
          <div><h2 className="font-bold text-slate-900">Submitted reports</h2><p className="mt-1 text-sm text-slate-500">Your latest reports appear first.</p></div>
          {!loading && <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{reports.length} {reports.length === 1 ? 'report' : 'reports'}</span>}
        </div>

        {loading ? (
          <div className="flex min-h-64 flex-col items-center justify-center gap-3 text-slate-500"><span className="loading loading-spinner loading-lg text-blue-600" /><p className="text-sm">Loading your reports…</p></div>
        ) : reports.length === 0 ? (
          <div className="flex min-h-72 flex-col items-center justify-center px-6 py-12 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600"><FileText className="h-7 w-7" /></div>
            <h3 className="text-lg font-bold text-slate-900">No reports yet</h3>
            <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">Your reports will show up here after you submit a pothole location.</p>
            <Link to="/report" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700"><Plus className="h-4 w-4" /> Report a pothole</Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {reports.map((report) => {
              const status = (report.status || 'generated').toLowerCase();
              const ready = status === 'generated' && Boolean(report.report_path);
              return (
                <article key={report.id} className="flex flex-col gap-4 px-5 py-5 transition hover:bg-slate-50/70 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                  <div className="flex min-w-0 items-start gap-4">
                    <div className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600"><FileText className="h-5 w-5" /></div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2"><h3 className="font-bold text-slate-900">Report #{report.id}</h3><span className={`rounded-full px-2.5 py-1 text-xs font-bold capitalize ${ready ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{status}</span></div>
                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
                        <span className="inline-flex items-center gap-1.5"><MapPin className="h-4 w-4" /> Pothole #{report.pothole_id ?? '—'}</span>
                        <span>{report.generated_at ? new Date(report.generated_at).toLocaleString() : 'Date unavailable'}</span>
                      </div>
                    </div>
                  </div>
                  <button type="button" onClick={() => downloadReport(report.report_path)} disabled={!ready} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-45"><ArrowDownToLine className="h-4 w-4" /> Download PDF</button>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

export default MyReports;
