import { useMemo, useState } from 'react';
import { BadgeCheck, CalendarClock, CheckCircle2, Receipt, Wallet, Zap } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { PLANS, currentPaymentOf, payableOf, statusOf } from '../lib/db';
import { daysBetween, firstName, fmtDate, monthLabel, vnd } from '../lib/format';
import StatusBadge from '../components/StatusBadge.jsx';
import CheckoutModal from '../components/CheckoutModal.jsx';

export default function UserDashboard() {
  const { db, dispatch, toast } = useApp();
  const [checkout, setCheckout] = useState(null);

  const users = useMemo(
    () => [...(db?.users || [])].sort((a, b) => a.name.localeCompare(b.name, 'vi')),
    [db?.users],
  );

  const user = db?.users?.find((u) => u.id === db.currentUserId) || db?.users?.[0] || {};
  const fundLevel = PLANS[user?.plan] || { name: 'Mức quỹ thành viên', fee: 0 };

  const payable = payableOf(db, user.id);
  const current = currentPaymentOf(db, user.id) || payable;
  const history = (db?.payments || [])
    .filter((p) => p.userId === user.id)
    .sort((a, b) => b.month.localeCompare(a.month));
  const unpaidCount = history.filter((p) => p.status !== 'paid' && p.status !== 'awaiting').length;
  const awaitingPayment = history.find((p) => p.status === 'awaiting');

  const target = payable || current;
  const targetStatus = target ? statusOf(target) : 'paid';
  const days = target ? daysBetween(target.dueDate) : 0;
  const allPaid = !payable && !awaitingPayment;
  const lastPaidAt = history.find((p) => p.paidAt)?.paidAt;

  const dueText = allPaid
    ? 'Bạn đã hoàn thành các khoản quỹ'
    : awaitingPayment
      ? 'Đang chờ Admin duyệt biên lai'
      : targetStatus === 'overdue'
        ? `Quá hạn ${Math.abs(days)} ngày`
        : days <= 0
          ? 'Hạn đóng hôm nay'
          : `Còn ${days} ngày đến hạn`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Xin chào, {firstName(user?.name)} 👋</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Theo dõi và đóng quỹ hoạt động của CLB.</p>
        </div>
        <label className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          Thành viên
          <select
            value={user?.id || ''}
            onChange={(e) => dispatch({ type: 'switchUser', id: e.target.value })}
            className="max-w-[14rem] rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          >
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.id})
              </option>
            ))}
          </select>
        </label>
      </div>

      <section
        aria-label="Tình trạng đóng quỹ"
        className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
      >
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="relative grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
          <div className="grid gap-5 sm:grid-cols-3">
            <div>
              <p className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
                <BadgeCheck size={14} aria-hidden="true" /> Mức đóng quỹ
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="text-lg font-semibold">{fundLevel.name}</span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    user?.status === 'active'
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      : 'bg-slate-500/10 text-slate-500'
                  }`}
                >
                  {user?.status === 'active' ? 'Đang tham gia' : 'Tạm dừng'}
                </span>
              </div>
            </div>
            <div>
              <p className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
                <CalendarClock size={14} aria-hidden="true" /> {allPaid ? 'Lần đóng gần nhất' : 'Hạn đóng'}
              </p>
              <p className="mt-2 text-xl font-semibold tabular-nums">
                {allPaid ? fmtDate(lastPaidAt) : fmtDate(target?.dueDate)}
              </p>
              <p
                className={`text-xs ${
                  targetStatus === 'overdue' && !allPaid ? 'text-rose-500' : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                {dueText}
              </p>
            </div>
            <div>
              <p className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
                <Wallet size={14} aria-hidden="true" /> Mức quỹ mỗi tháng
              </p>
              <p className="mt-2 text-xl font-semibold tabular-nums">{vnd(fundLevel.fee)}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">quỹ hoạt động CLB</p>
            </div>
          </div>

          {allPaid ? (
            <div className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-500/10 px-6 py-4 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 size={20} aria-hidden="true" />
              {current ? `Đã đóng ${monthLabel(current.month)}` : 'Không có khoản cần đóng'}
            </div>
          ) : awaitingPayment ? (
            <div className="flex items-center justify-center gap-2 rounded-2xl bg-sky-500/10 px-6 py-4 text-sm font-semibold text-sky-600 dark:text-sky-400">
              <CheckCircle2 size={20} aria-hidden="true" />
              Đã gửi biên lai – đang chờ Admin duyệt
            </div>
          ) : (
            <div className="flex flex-col items-stretch gap-2">
              <button
                onClick={() => setCheckout(payable)}
                className="group flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-emerald-500/25 transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 active:scale-[0.98]"
              >
                <Zap size={20} aria-hidden="true" className="transition group-hover:scale-110" />
                Đóng quỹ {monthLabel(payable.month)} · {vnd(payable.amount)}
              </button>
              {unpaidCount > 1 && (
                <p className="text-center text-xs text-slate-500 dark:text-slate-400">
                  Còn {unpaidCount - 1} khoản khác chưa đóng, sẽ đóng lần lượt từ khoản cũ nhất.
                </p>
              )}
            </div>
          )}
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-2 border-b border-slate-200 px-5 py-4 dark:border-slate-800">
          <Receipt size={18} className="text-slate-400" aria-hidden="true" />
          <h2 className="font-semibold">Lịch sử đóng quỹ</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">Lịch sử đóng quỹ của {user?.name}</caption>
            <thead className="text-xs text-slate-500 dark:text-slate-400">
              <tr>
                <th scope="col" className="px-5 py-3 font-medium">Tháng</th>
                <th scope="col" className="px-5 py-3 font-medium">Số tiền</th>
                <th scope="col" className="hidden px-5 py-3 font-medium sm:table-cell">Hạn đóng</th>
                <th scope="col" className="hidden px-5 py-3 font-medium md:table-cell">Ngày đóng</th>
                <th scope="col" className="px-5 py-3 font-medium">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {history.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <th scope="row" className="whitespace-nowrap px-5 py-3.5 text-left font-medium">{monthLabel(p.month)}</th>
                  <td className="px-5 py-3.5 tabular-nums">{vnd(p.amount)}</td>
                  <td className="hidden px-5 py-3.5 tabular-nums text-slate-500 sm:table-cell dark:text-slate-400">{fmtDate(p.dueDate)}</td>
                  <td className="hidden px-5 py-3.5 tabular-nums text-slate-500 md:table-cell dark:text-slate-400">{fmtDate(p.paidAt)}</td>
                  <td className="px-5 py-3.5"><StatusBadge status={statusOf(p)} /></td>
                </tr>
              ))}
              {history.length === 0 && (
                <tr><td colSpan={5} className="px-5 py-10 text-center text-slate-500">Chưa có lịch sử đóng quỹ.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {checkout && (
        <CheckoutModal
          user={user}
          payment={checkout}
          onClose={() => setCheckout(null)}
          onSubmit={(id, proofUrl) => {
            dispatch({ type: 'submitProof', id, proofUrl, method: 'vietqr' });
            toast('Đã gửi biên lai – đang chờ Admin duyệt');
          }}
        />
      )}
    </div>
  );
}
