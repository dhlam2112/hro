import { AlertTriangle, CheckCircle2, Clock, Hourglass } from 'lucide-react';

const MAP = {
  paid: {
    label: 'Đã đóng',
    Icon: CheckCircle2,
    cls: 'bg-emerald-500/10 text-emerald-600 ring-emerald-500/20 dark:text-emerald-400',
  },
  awaiting: {
    label: 'Chờ duyệt',
    Icon: Hourglass,
    cls: 'bg-sky-500/10 text-sky-600 ring-sky-500/20 dark:text-sky-400',
  },
  pending: {
    label: 'Chưa đóng',
    Icon: Clock,
    cls: 'bg-amber-500/10 text-amber-600 ring-amber-500/20 dark:text-amber-400',
  },
  overdue: {
    label: 'Quá hạn',
    Icon: AlertTriangle,
    cls: 'bg-rose-500/10 text-rose-600 ring-rose-500/20 dark:text-rose-400',
  },
  rejected: {
    label: 'Bị từ chối',
    Icon: AlertTriangle,
    cls: 'bg-rose-500/10 text-rose-600 ring-rose-500/20 dark:text-rose-400',
  },
};

export default function StatusBadge({ status }) {
  const { label, Icon, cls } = MAP[status] || MAP.pending;
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${cls}`}
    >
      <Icon size={13} aria-hidden="true" />
      {label}
    </span>
  );
}
