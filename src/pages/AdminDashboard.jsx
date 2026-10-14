import { useEffect, useMemo, useState } from 'react';
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
  Search,
  Trash2,
} from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import {
  statusOf,
  loadPlans,
  updatePlanOnSupabase,
  createMonthBills,
  addUserOnSupabase,
} from '../lib/db';
import { fmtDate, monthLabel, vnd } from '../lib/format';
import StatusBadge from '../components/StatusBadge.jsx';
import KpiCard from '../components/KpiCard.jsx';

// Component Skeleton Loading cho danh sách giao dịch
function CardSkeleton() {
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

export default function AdminDashboard() {
  const { db, dispatch, toast, isAdmin, loginAdmin, logoutAdmin } = useApp();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [preview, setPreview] = useState(null);
  const [rejectId, setRejectId] = useState(null);
  const [rejectNote, setRejectNote] = useState('');
  const [filter, setFilter] = useState('awaiting');
  const [adminTab, setAdminTab] = useState('payments'); // 'payments' | 'plans' | 'members'
  const [plans, setPlans] = useState(null);
  const [planDraft, setPlanDraft] = useState({});
  const [savingPlan, setSavingPlan] = useState(null);
  const [newMonth, setNewMonth] = useState('');
  const [creatingMonth, setCreatingMonth] = useState(false);
  
  // State quản lý ô tìm kiếm tên/mã thành viên trong tab giao dịch & thành viên
  const [memberSearch, setMemberSearch] = useState('');

  const [newUser, setNewUser] = useState({
    id: '',
    name: '',
    plan: 'player',
    dueDay: 10,
  });
  const [addingUser, setAddingUser] = useState(false);

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

  // Lọc danh sách thành viên theo từ khóa tìm kiếm
  const filteredMembers = useMemo(() => {
    const q = memberSearch.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) => u.name.toLowerCase().includes(q) || u.id.toLowerCase().includes(q)
    );
  }, [users, memberSearch]);

  // Lọc giao dịch theo tab trạng thái
  const displayList = useMemo(() => {
    let list = [];
    if (filter === 'awaiting') list = awaitingList;
    else if (filter === 'unpaid') {
      list = payments
        .filter(
          (p) => p.status === 'pending' || p.status === 'rejected' || statusOf(p) === 'overdue',
        )
        .sort((a, b) => a.month.localeCompare(b.month));
    } else {
      list = [...payments].sort((a, b) => b.month.localeCompare(a.month)).slice(0, 50);
    }

    const q = memberSearch.trim().toLowerCase();
    if (!q) return list;

    return list.filter((p) => {
      const u = users.find((item) => item.id === p.userId) || { name: '', id: '' };
      return u.name.toLowerCase().includes(q) || u.id.toLowerCase().includes(q);
    });
  }, [filter, awaitingList, payments, memberSearch, users]);

  useEffect(() => {
    loadPlans().then((p) => {
      setPlans(p);
      setPlanDraft({
        player: { name: p.player?.name || 'Mức quỹ player', fee: p.player?.fee ?? 0 },
        'player gen 7': { name: p['player gen 7']?.name || 'Mức quỹ player', fee: p['player gen 7']?.fee ?? 100000 },
        med: { name: p.med?.name || 'Mức quỹ media', fee: p.med?.fee ?? 0 },
        mana: { name: p.mana?.name || 'Mức quỹ manager', fee: p.mana?.fee ?? 0 },
      });
    });
  }, []);

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

  const savePlan = async (id) => {
    const draft = planDraft[id];
    if (!draft) return;
    setSavingPlan(id);
    const ok = await updatePlanOnSupabase(id, {
      name: draft.name,
      fee: Number(draft.fee) || 0,
    });
    setSavingPlan(null);
    if (ok) {
      setPlans((prev) => ({
        ...prev,
        [id]: { name: draft.name, fee: Number(draft.fee) || 0 },
      }));
      toast('Đã lưu gói ' + id);
    } else {
      toast('Lỗi lưu gói — kiểm tra bảng plans trên Supabase', 'error');
    }
  };

  const handleCreateMonth = async () => {
    if (!/^\d{6}$/.test(newMonth)) {
      toast('Nhập tháng dạng YYYYMM (vd: 202611)', 'error');
      return;
    }
    const usePlans = plans || {
      player: { fee: 100000 },
      'player gen 7': { fee: 100000 },
      med: { fee: 50000 },
      mana: { fee: 50000 },
    };
    setCreatingMonth(true);
    const ok = await createMonthBills(newMonth, usePlans, users);
    setCreatingMonth(false);
    if (ok) {
      toast('Đã tạo quỹ tháng ' + newMonth);
      window.location.reload();
    } else {
      toast('Lỗi tạo tháng', 'error');
    }
  };

  const handleAddUser = async () => {
    const id = newUser.id.trim().toUpperCase();
    const name = newUser.name.trim();
    if (!id || !name) {
      toast('Nhập mã và họ tên', 'error');
      return;
    }
    if (users.some((u) => u.id === id)) {
      toast('Mã thành viên đã tồn tại', 'error');
      return;
    }
    setAddingUser(true);
    const { ok, error } = await addUserOnSupabase(
      {
        id,
        name,
        plan: newUser.plan,
        dueDay: Number(newUser.dueDay) || 10,
        status: 'active',
      },
      { createCurrentBill: true, plans },
    );
    setAddingUser(false);
    if (ok) {
      toast('Đã thêm thành viên ' + name);
      setNewUser({ id: '', name: '', plan: 'player', dueDay: 10 });
      window.location.reload();
    } else {
      toast(error || 'Lỗi thêm thành viên', 'error');
    }
  };

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
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Duyệt giao dịch & thống kê quỹ CLB
          </p>
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

      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2 dark:border-slate-800">
        <button
          onClick={() => setAdminTab('payments')}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
            adminTab === 'payments'
              ? 'bg-emerald-500/15 text-emerald-600'
              : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Giao dịch
        </button>
        <button
          onClick={() => setAdminTab('members')}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
            adminTab === 'members'
              ? 'bg-emerald-500/15 text-emerald-600'
              : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Quản lý thành viên
        </button>
        <button
          onClick={() => setAdminTab('plans')}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
            adminTab === 'plans'
              ? 'bg-emerald-500/15 text-emerald-600'
              : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Gói đóng & Tháng
        </button>
      </div>

      {adminTab === 'members' && (
        <div className="space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">Danh sách thành viên CLB</h2>
                <p className="text-sm text-slate-500">Quản lý và xóa thành viên khỏi hệ thống.</p>
              </div>
              <div className="relative w-full sm:w-72">
                <Search size={16} className="absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                  placeholder="Tìm theo tên hoặc mã..."
                  className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-950"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-xs text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-5 py-3 font-medium">Thành viên</th>
                    <th className="px-5 py-3 font-medium">Mã TV</th>
                    <th className="px-5 py-3 font-medium">Gói quỹ</th>
                    <th className="px-5 py-3 font-medium">Trạng thái</th>
                    <th className="px-5 py-3 font-medium text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {filteredMembers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="px-5 py-3.5 font-medium">{u.name}</td>
                      <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400">{u.id}</td>
                      <td className="px-5 py-3.5 uppercase">{u.plan}</td>
                      <td className="px-5 py-3.5">
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          u.status === 'active' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-slate-500/10 text-slate-500'
                        }`}>
                          {u.status === 'active' ? 'Đang tham gia' : 'Tạm dừng'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          onClick={() => {
                            if (window.confirm(`Bạn có chắc chắn muốn xóa thành viên "${u.name}" (${u.id}) không?`)) {
                              dispatch({ type: 'deleteUser', id: u.id });
                              toast(`Đã xóa thành viên ${u.name}`);
                            }
                          }}
                          className="rounded-lg p-2 text-slate-400 hover:bg-rose-500/10 hover:text-rose-500 transition"
                          title="Xóa thành viên"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredMembers.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-500">Không tìm thấy thành viên nào.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}

      {adminTab === 'plans' && (
        <div className="space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <h2 className="mb-2 text-lg font-semibold">Gói đóng quỹ</h2>
            <p className="mb-4 text-sm text-slate-500">
              Đổi tên / giá. Áp dụng khi tạo tháng mới hoặc bill mới.
            </p>
            <div className="space-y-4">
              {['player', 'player gen 7', 'med', 'mana'].map((id) => (
                <div
                  key={id}
                  className="flex flex-col gap-2 rounded-xl border border-slate-200 p-4 sm:flex-row sm:items-end dark:border-slate-700"
                >
                  <div className="min-w-[5rem] text-sm font-medium uppercase text-slate-500">
                    {id}
                  </div>
                  <div className="flex-1">
                    <label className="mb-1 block text-xs text-slate-500">Tên hiển thị</label>
                    <input
                      value={planDraft[id]?.name ?? ''}
                      onChange={(e) =>
                        setPlanDraft((d) => ({
                          ...d,
                          [id]: { ...d[id], name: e.target.value },
                        }))
                      }
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                    />
                  </div>
                  <div className="w-full sm:w-36">
                    <label className="mb-1 block text-xs text-slate-500">Giá (VND)</label>
                    <input
                      type="number"
                      value={planDraft[id]?.fee ?? ''}
                      onChange={(e) =>
                        setPlanDraft((d) => ({
                          ...d,
                          [id]: { ...d[id], fee: e.target.value },
                        }))
                      }
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                    />
                  </div>
                  <button
                    onClick={() => savePlan(id)}
                    disabled={savingPlan === id}
                    className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
                  >
                    {savingPlan === id ? 'Đang lưu...' : 'Lưu'}
                  </button>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <h2 className="mb-2 text-lg font-semibold">Thêm tháng quỹ</h2>
            <p className="mb-4 text-sm text-slate-500">
              Tạo bill cho mọi thành viên active. Ví dụ:{' '}
              <code className="rounded bg-slate-100 px-1 dark:bg-slate-800">202611</code> = tháng
              11/2026.
            </p>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <input
                value={newMonth}
                onChange={(e) => setNewMonth(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="YYYYMM (vd: 202611)"
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
              />
              <button
                onClick={handleCreateMonth}
                disabled={creatingMonth}
                className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-500 disabled:opacity-50"
              >
                {creatingMonth ? 'Đang tạo...' : 'Tạo quỹ tháng này'}
              </button>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <h2 className="mb-2 text-lg font-semibold">Thêm thành viên</h2>
            <p className="mb-4 text-sm text-slate-500">
              Tạo thành viên mới và bill tháng hiện tại.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs text-slate-500">Mã (vd: U035)</label>
                <input
                  value={newUser.id}
                  onChange={(e) => setNewUser((u) => ({ ...u, id: e.target.value }))}
                  placeholder="U035"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-slate-500">Họ và tên</label>
                <input
                  value={newUser.name}
                  onChange={(e) => setNewUser((u) => ({ ...u, name: e.target.value }))}
                  placeholder="Nguyễn Văn A"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-slate-500">Gói đóng</label>
                <select
                  value={newUser.plan}
                  onChange={(e) => setNewUser((u) => ({ ...u, plan: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                >
                  <option value="player">Player</option>
                  <option value="player gen 7">Player Gen 7</option>
                  <option value="med">Media</option>
                  <option value="mana">Manager</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs text-slate-500">Ngày hạn đóng (1–28)</label>
                <input
                  type="number"
                  min={1}
                  max={28}
                  value={newUser.dueDay}
                  onChange={(e) => setNewUser((u) => ({ ...u, dueDay: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                />
              </div>
            </div>
            <button
              onClick={handleAddUser}
              disabled={addingUser}
              className="mt-4 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
            >
              {addingUser ? 'Đang thêm...' : 'Thêm thành viên'}
            </button>
          </section>
        </div>
      )}

      {adminTab === 'payments' && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard icon={Wallet} label="Tổng đã duyệt" value={vnd(paidTotal)} tone="emerald" />
            <KpiCard
              icon={CheckCircle2}
              label="Chờ duyệt"
              value={awaitingList.length}
              hint={vnd(awaitingTotal)}
              tone="sky"
            />
            <KpiCard
              icon={Users}
              label="Thành viên chưa đóng"
              value={unpaidUsers.length}
              tone="amber"
            />
            <KpiCard
              icon={Shield}
              label="Tổng thành viên"
              value={users.filter((u) => u.status === 'active').length}
              tone="emerald"
            />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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

            {/* Ô tìm kiếm tên/mã thành viên cho danh sách giao dịch */}
            <div className="relative w-full sm:w-72">
              <Search size={16} className="absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                placeholder="Tìm theo tên hoặc mã..."
                className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-950"
              />
            </div>
          </div>

          <div className="space-y-3">
            {!db ? (
              <>
                <CardSkeleton />
                <CardSkeleton />
                <CardSkeleton />
              </>
            ) : displayList.length === 0 ? (
              <p className="py-12 text-center text-slate-500">Không có giao dịch nào phù hợp.</p>
            ) : (
              displayList.map((p) => {
                const u = userOf(p.userId);
                const st = statusOf(p);
                return (
                  <div
                    key={p.id}
                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold">{u.name} <span className="text-xs text-slate-400">({u.id})</span></p>
                        <p className="text-sm text-slate-500">
                          {monthLabel(p.month)} · {vnd(p.amount)} · Hạn {fmtDate(p.dueDate)}
                        </p>
                        {p.submittedAt && (
                          <p className="mt-0.5 text-xs text-slate-400">
                            Gửi lúc {fmtDate(p.submittedAt)}
                          </p>
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
              })
            )}
          </div>
        </>
      )}

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