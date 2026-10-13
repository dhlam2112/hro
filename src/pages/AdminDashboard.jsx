import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  Eye,
  Lock,
  LogOut,
  Shield,
  Users,
  Wallet,
  XCircle,
  Download,
} from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { statusOf } from '../lib/db';
import { fmtDate, monthLabel, vnd } from '../lib/format';
import StatusBadge from '../components/StatusBadge.jsx';
import KpiCard from '../components/KpiCard.jsx';

export default function AdminDashboard() {
  const { db, dispatch, toast, isAdmin, loginAdmin, logoutAdmin } = useApp();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [preview, setPreview] = useState(null);
  const [rejectId, setRejectId] = useState(null);
  const [rejectNote, setRejectNote] = useState('');
  const [filter, setFilter] = useState('awaiting');

  // ===== TẤT CẢ hooks / tính toán TRƯỚC early return =====
  const payments = db?.payments || [];
  const users = db?.users || [];

  const awaitingList = useMemo(
    () =>
      payments
        .filter((p) => p.status === 'awaiting')
        .sort((a, b) => (b.submittedAt || '').localeCompare(a.submittedAt || '')),
    [payments],
  );

  const paidTotal = payments.filter((p) => p.status === 'paid').reduce((s, p) => s + p.amount, 0);
  const awaitingTotal = awaitingList.reduce((s, p) => s + p.amount, 0);

  const unpaidUsers = users.filter((u) => {
    if (u.status !== 'active') return false;
    return payments.some(
      (p) =>
        p.userId === u.id &&
        (p.status === 'pending' || p.status === 'rejected' || statusOf(p) === 'overdue'),
    );
  });

  const displayList = useMemo(() => {
    if (filter === 'awaiting') return awaitingList;
    if (filter === 'unpaid') {
      return payments
        .filter(
          (p) => p.status === 'pending' || p.status === 'rejected' || statusOf(p) === 'overdue',
        )
        .sort((a, b) => a.month.localeCompare(b.month));
    }
    return [...payments].sort((a, b) => b.month.localeCompare(a.month)).slice(0, 50);
  }, [filter, awaitingList, payments]);

  const handleLogin = () => {
    if (loginAdmin(password)) {
      toast('Đăng nhập Admin thành công');
      setPassword('');
    } else {
      setError('Sai mật khẩu! Vui lòng thử lại.');
      setPassword('');
    }
  };

  const userOf = (id) => users.find((u) => u.id === id) || { name: '—', id };

  const approve = (id) => {
    dispatch({ type: 'approvePayment', id });
    toast('Đã duyệt giao dịch');
  };

  const openReject = (id) => {
    setRejectId(id);
    setRejectNote('');
  };

  const confirmReject = () => {
    if (!rejectId) return;
    dispatch({ type: 'rejectPayment', id: rejectId, note: rejectNote });
    toast('Đã từ chối giao dịch', 'error');
    setRejectId(null);
  };

  const exportCSV = () => {
    const headers = ['Mã GD', 'Thành viên', 'Tháng', 'Số tiền', 'Trạng thái', 'Ngày gửi', 'Ngày duyệt'];
    const rows = payments.map((p) => {
      const u = userOf(p.userId);
      return [p.id, u.name, p.month, p.amount, statusOf(p), p.submittedAt || '', p.paidAt || ''].join(',');
    });
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `thong-ke-quy-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    toast('Đã xuất file CSV');
  };

  // ===== Early return SAU hooks =====
  if (!isAdmin) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center px-4 py-16">
        <div className="w-full rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-6 text-center">
            <span className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-emerald-500/10 text-emerald-600">
              <Shield size={28} />
            </span>
            <h1 className="text-xl font-semibold">Đăng nhập Admin</h1>
            <p className="mt-1 text-sm text-slate-500">Chỉ dành cho Thủ quỹ / Ban quản trị</p>
          </div>

          <label className="mb-1 block text-sm font-medium">Mật khẩu</label>
          <input
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError('');
            }}
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            placeholder="Nhập mật khẩu admin..."
            className="mb-3 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-950"
            autoFocus
          />
          {error && <p className="mb-3 text-sm text-rose-500">{error}</p>}

          <button
            onClick={handleLogin}
            className="mb-3 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-medium text-white hover:bg-emerald-500"
          >
            <Lock size={16} /> Đăng nhập
          </button>
          <button
            onClick={() => navigate('/app')}
            className="w-full rounded-xl border border-slate-200 py-3 text-sm font-medium hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
          >
            ← Quay lại trang Thành viên
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Bảng điều khiển Admin</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Duyệt giao dịch & thống kê quỹ CLB</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={exportCSV}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
          >
            <Download size={16} /> Xuất CSV
          </button>
          <button
            onClick={() => {
              logoutAdmin();
              toast('Đã đăng xuất Admin');
            }}
            className="inline-flex items-center gap-2 rounded-lg bg-rose-500/10 px-3 py-2 text-sm font-medium text-rose-600 hover:bg-rose-500/20"
          >
            <LogOut size={16} /> Đăng xuất
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard icon={Wallet} label="Tổng đã duyệt" value={vnd(paidTotal)} tone="emerald" />
        <KpiCard icon={CheckCircle2} label="Chờ duyệt" value={awaitingList.length} hint={vnd(awaitingTotal)} tone="sky" />
        <KpiCard icon={Users} label="Thành viên chưa đóng" value={unpaidUsers.length} tone="amber" />
        <KpiCard icon={Shield} label="Tổng thành viên" value={users.filter((u) => u.status === 'active').length} tone="emerald" />
      </div>

      <div className="flex flex-wrap gap-2">
        {[
          { key: 'awaiting', label: `Chờ duyệt (${awaitingList.length})` },
          { key: 'unpaid', label: 'Chưa đóng' },
          { key: 'all', label: 'Tất cả gần đây' },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
              filter === f.key
                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {displayList.length === 0 && (
          <p className="py-12 text-center text-slate-500">Không có giao dịch nào.</p>
        )}

        {displayList.map((p) => {
          const u = userOf(p.userId);
          const st = statusOf(p);
          return (
            <div
              key={p.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{u.name}</p>
                  <p className="text-sm text-slate-500">
                    {monthLabel(p.month)} · {vnd(p.amount)} · Hạn {fmtDate(p.dueDate)}
                  </p>
                  {p.submittedAt && (
                    <p className="mt-0.5 text-xs text-slate-400">Gửi lúc {fmtDate(p.submittedAt)}</p>
                  )}
                  {p.adminNote && (
                    <p className="mt-1 text-xs text-rose-500">Ghi chú: {p.adminNote}</p>
                  )}
                </div>
                <StatusBadge status={st} />
              </div>

              {p.proofUrl && (
                <div className="mt-3">
                  <img
                    src={p.proofUrl}
                    alt="Biên lai"
                    className="h-36 cursor-pointer rounded-lg border object-cover dark:border-slate-700"
                    onClick={() => setPreview(p.proofUrl)}
                  />
                  <button
                    onClick={() => setPreview(p.proofUrl)}
                    className="mt-1 inline-flex items-center gap-1 text-xs text-sky-600"
                  >
                    <Eye size={12} /> Xem phóng to
                  </button>
                </div>
              )}

              {p.status === 'awaiting' && (
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => approve(p.id)}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-2.5 text-sm font-medium text-white hover:bg-emerald-500"
                  >
                    <CheckCircle2 size={16} /> Duyệt
                  </button>
                  <button
                    onClick={() => openReject(p.id)}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-rose-600 py-2.5 text-sm font-medium text-white hover:bg-rose-500"
                  >
                    <XCircle size={16} /> Từ chối
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {preview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setPreview(null)}
        >
          <img src={preview} alt="Biên lai full" className="max-h-[90vh] max-w-full rounded-lg" />
        </div>
      )}

      {rejectId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
            <h3 className="mb-3 text-lg font-semibold">Lý do từ chối</h3>
            <textarea
              value={rejectNote}
              onChange={(e) => setRejectNote(e.target.value)}
              rows={3}
              placeholder="Nhập lý do từ chối..."
              className="mb-4 w-full rounded-xl border border-slate-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 dark:border-slate-700 dark:bg-slate-950"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setRejectId(null)}
                className="flex-1 rounded-xl border py-2.5 text-sm font-medium dark:border-slate-700"
              >
                Hủy
              </button>
              <button
                onClick={confirmReject}
                className="flex-1 rounded-xl bg-rose-600 py-2.5 text-sm font-medium text-white hover:bg-rose-500"
              >
                Xác nhận từ chối
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}