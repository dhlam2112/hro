// Database demo của CLB, lưu trong localStorage.
import { addMonths, dueDateOf, monthKey } from './format';

const KEY = 'clubfund.db.v1';

export const PLANS = {
  med: { name: 'Mức quỹ media', fee: 75000 },
  mana: { name: 'Mức quỹ manager', fee: 75000 },
  player: { name: 'Mức quỹ player', fee: 150000 },
};

const SEED_USERS = [
  { name: 'Nguyễn Thế Kiên', plan: 'player', dueDay: 10, paidNow: false },
  { name: 'Trịnh Minh Hiếu', plan: 'player', dueDay: 10, paidNow: false },
  { name: 'Dương Anh Quân', plan: 'player', dueDay: 10, paidNow: false },
  { name: 'Trần Tiến Đạt', plan: 'player', dueDay: 10, paidNow: false },
  { name: 'Đoàn Phùng Việt Hoàng', plan: 'player', dueDay: 10, paidNow: false },
  { name: 'Nguyễn Văn Thế Bách', plan: 'player', dueDay: 10, paidNow: false },
  { name: 'Nguyễn Thành Vinh', plan: 'player', dueDay: 10, paidNow: false },
  { name: 'Nguyễn Linh Chi', plan: 'med', dueDay: 10, paidNow: false },
  { name: 'Trương Quang Thái', plan: 'player', dueDay: 10, paidNow: false },
  { name: 'Trần Nhật Minh', plan: 'player', dueDay: 10, paidNow: false },
  { name: 'Nguyễn Nam Khánh gen 4', plan: 'player', dueDay: 10, paidNow: false },
  { name: 'Vũ Trọng Giáp', plan: 'player', dueDay: 10, paidNow: false },
  { name: 'Lê Khánh Linh', plan: 'player', dueDay: 10, paidNow: false },
  { name: 'Nguyễn Trịnh Minh Hiếu', plan: 'player', dueDay: 10, paidNow: false },
  { name: 'Bảo Hoàng Long', plan: 'player', dueDay: 10, paidNow: false },
  { name: 'Lê Anh Quân', plan: 'player', dueDay: 10, paidNow: false },
  { name: 'Nguyễn Đình Bách', plan: 'player', dueDay: 10, paidNow: false },
  { name: 'Nghiêm Đức Anh', plan: 'player', dueDay: 10, paidNow: false },
  { name: 'Nguyễn Minh Hiếu', plan: 'player', dueDay: 10, paidNow: false },
  { name: 'Đàm Lê Nguyên Phương', plan: 'player', dueDay: 10, paidNow: false },
  { name: 'Cao Diệu Thủy', plan: 'mana', dueDay: 10, paidNow: false },
  { name: 'Lê Phan Quân', plan: 'player', dueDay: 10, paidNow: false },
  { name: 'Nguyễn Nam Khánh gen 6', plan: 'player', dueDay: 10, paidNow: false },
  { name: 'Đặng Thành Trung', plan: 'player', dueDay: 10, paidNow: false },
  { name: 'Vũ Trần Tuấn Dũng', plan: 'player', dueDay: 10, paidNow: false },
  { name: 'Nguyễn Minh Phúc', plan: 'player', dueDay: 10, paidNow: false },
  { name: 'Đỗ Hiểu Lam', plan: 'med', dueDay: 10, paidNow: false },
  { name: 'Phùng Quang Hưng', plan: 'player', dueDay: 10, paidNow: false },
  { name: 'Nguyễn Phan Hiển', plan: 'player', dueDay: 10, paidNow: false },
  { name: 'Lê Trần An Hải', plan: 'mana', dueDay: 10, paidNow: false },
  { name: 'Nguyễn Tuấn Phong', plan: 'player', dueDay: 10, paidNow: false },
  { name: 'Nguyễn Thành Trung', plan: 'player', dueDay: 10, paidNow: false },
  { name: 'Lại Thế Hiển', plan: 'player', dueDay: 10, paidNow: false },
  { name: 'Phạm Trung Hiếu', plan: 'player', dueDay: 10, paidNow: false }
];

const newPayment = (userId, month, amount, dueDay, paid) => ({
  id: `${userId}_${month}`,
  userId,
  month,
  amount,
  dueDate: dueDateOf(month, dueDay).toISOString(),
  status: paid ? 'paid' : 'pending',
  paidAt: paid ? new Date(+month.slice(0, 4), +month.slice(4) - 1, Math.max(1, dueDay - 1), 9, 30).toISOString() : null,
  method: paid ? 'vietqr' : null,
  proofUrl: null,
  adminNote: null,
  submittedAt: null,
});

export function seed() {
  const now = monthKey();
  const users = [];
  const payments = [];
  SEED_USERS.forEach((u, i) => {
    const id = `U${String(i + 1).padStart(3, '0')}`;
    const fee = PLANS[u.plan].fee;
    users.push({
      id,
      name: u.name,
      email: `${id.toLowerCase()}@clb.com`,
      plan: u.plan,
      status: u.status || 'active',
      dueDay: u.dueDay,
      lastReminderAt: null,
    });
    const history = u.prevOverdue ? [4, 3, 2] : [3, 2, 1];
    history.forEach((back) => payments.push(newPayment(id, addMonths(now, -back), fee, u.dueDay, true)));
    if (u.prevOverdue) payments.push(newPayment(id, addMonths(now, -1), fee, u.dueDay, false));
    if (u.status !== 'paused') payments.push(newPayment(id, now, fee, u.dueDay, u.paidNow));
  });
  return { users, payments, currentUserId: 'U003' };
}

function ensureCurrentMonth(db) {
  const now = monthKey();
  const extra = [];
  db.users.forEach((u) => {
    if (u.status !== 'active') return;
    if (!db.payments.some((p) => p.userId === u.id && p.month === now)) {
      extra.push(newPayment(u.id, now, PLANS[u.plan].fee, u.dueDay, false));
    }
  });
  return extra.length ? { ...db, payments: [...db.payments, ...extra] } : db;
}

export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return ensureCurrentMonth(JSON.parse(raw));
  } catch {
    /* ignore */
  }
  return seed();
}

export function save(db) {
  try {
    localStorage.setItem(KEY, JSON.stringify(db));
  } catch {
    /* ignore */
  }
}

/**
 * pending  → chưa nộp
 * awaiting → đã gửi biên lai, chờ admin duyệt
 * paid     → admin đã duyệt
 * rejected → admin từ chối
 * overdue  → (derived) pending + quá hạn
 */
export const statusOf = (p) => {
  if (p.status === 'paid') return 'paid';
  if (p.status === 'awaiting') return 'awaiting';
  if (p.status === 'rejected') return 'rejected';
  return new Date(p.dueDate).getTime() < Date.now() ? 'overdue' : 'pending';
};

export const currentPaymentOf = (db, userId) =>
  db.payments.find((p) => p.userId === userId && p.month === monthKey());

export const payableOf = (db, userId) =>
  db.payments
    .filter((p) => p.userId === userId && p.status !== 'paid' && p.status !== 'awaiting')
    .sort((a, b) => a.month.localeCompare(b.month))[0];
