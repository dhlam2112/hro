import { CheckCircle2, Info, XCircle } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';

const ICONS = { success: CheckCircle2, info: Info, error: XCircle };
const COLORS = {
  success: 'text-emerald-500',
  info: 'text-sky-500',
  error: 'text-rose-500',
};

export default function Toasts() {
  const { toasts } = useApp();
  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2 px-4 sm:items-end sm:pr-6"
    >
      {toasts.map((t) => {
        const Icon = ICONS[t.type] || Info;
        return (
          <div
            key={t.id}
            role={t.type === 'error' ? 'alert' : 'status'}
            className="animate-pop-in pointer-events-auto flex max-w-sm items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-xl dark:border-slate-700 dark:bg-slate-900"
          >
            <Icon size={18} className={`shrink-0 ${COLORS[t.type] || COLORS.info}`} aria-hidden="true" />
            <span>{t.message}</span>
          </div>
        );
      })}
    </div>
  );
}
