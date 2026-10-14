// src/components/Skeleton.jsx

export function KpiSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="h-4 w-24 rounded bg-slate-200 dark:bg-slate-800 mb-3" />
      <div className="h-8 w-32 rounded bg-slate-200 dark:bg-slate-800" />
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <div className="h-5 w-40 rounded bg-slate-200 dark:bg-slate-800" />
          <div className="h-4 w-56 rounded bg-slate-200 dark:bg-slate-800" />
        </div>
        <div className="h-6 w-20 rounded-full bg-slate-200 dark:bg-slate-800" />
      </div>
      <div className="h-28 w-full rounded-lg bg-slate-200 dark:bg-slate-800" />
    </div>
  );
}

export function TableRowSkeleton() {
  return (
    <tr className="animate-pulse border-b border-slate-200 dark:border-slate-800">
      <td className="px-5 py-4"><div className="h-4 w-16 rounded bg-slate-200 dark:bg-slate-800" /></td>
      <td className="px-5 py-4"><div className="h-4 w-24 rounded bg-slate-200 dark:bg-slate-800" /></td>
      <td className="px-5 py-4"><div className="h-4 w-20 rounded bg-slate-200 dark:bg-slate-800" /></td>
      <td className="px-5 py-4"><div className="h-6 w-16 rounded-full bg-slate-200 dark:bg-slate-800" /></td>
    </tr>
  );
}