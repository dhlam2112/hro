const TONES = {
  emerald: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  sky: 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
  rose: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
  amber: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
};

export default function KpiCard({ icon: Icon, label, value, hint, tone = 'emerald' }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
        <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${TONES[tone] || TONES.emerald}`}>
          {Icon && <Icon size={18} aria-hidden="true" />}
        </span>
      </div>
      <p className="mt-3 text-2xl font-semibold tracking-tight tabular-nums sm:text-3xl">{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{hint}</p>}
    </div>
  );
}
