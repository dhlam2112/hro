// Database CLB – dùng Supabase thay localStorage
import { supabase } from './supabase';
import { addMonths, dueDateOf, monthKey } from './format';

export const PLANS = {
  med: { name: 'Mức quỹ media', fee: 50000 },
  mana: { name: 'Mức quỹ manager', fee: 50000 },
  player: { name: 'Mức quỹ player', fee: 100000 },
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
  { name: 'Phạm Trung Hiếu', plan: 'player', dueDay: 10, paidNow: false },
];

const newPayment = (userId, month, amount, dueDay, paid) => ({
  id: `${userId}_${month}`,
  userId,
  month,
  amount,
  dueDate: dueDateOf(month, dueDay).toISOString(),
  status: paid ? 'paid' : 'pending',
  paidAt: paid
    ? new Date(+month.slice(0, 4), +month.slice(4) - 1, Math.max(1, dueDay - 1), 9, 30).toISOString()
    : null,
  method: paid ? 'vietqr' : null,
  proofUrl: null,
  adminNote: null,
  submittedAt: null,
});

/** Tạo dữ liệu seed local (dùng khi DB trống) */
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
    history.forEach((back) =>
      payments.push(newPayment(id, addMonths(now, -back), fee, u.dueDay, true)),
    );
    if (u.prevOverdue) payments.push(newPayment(id, addMonths(now, -1), fee, u.dueDay, false));
    if (u.status !== 'paused') payments.push(newPayment(id, now, fee, u.dueDay, u.paidNow));
  });
  return { users, payments, currentUserId: 'U003' };
}

// ===================== SUPABASE =====================

/** Map từ DB (snake_case) → app (camelCase) */
function mapUser(u) {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    plan: u.plan,
    status: u.status,
    dueDay: u.due_day,
    lastReminderAt: u.last_reminder_at,
  };
}

function mapPayment(p) {
  return {
    id: p.id,
    userId: p.user_id,
    month: p.month,
    amount: p.amount,
    dueDate: p.due_date,
    status: p.status,
    paidAt: p.paid_at,
    method: p.method,
    proofUrl: p.proof_url,
    adminNote: p.admin_note,
    submittedAt: p.submitted_at,
  };
}

/** Đẩy seed lên Supabase (chỉ chạy 1 lần khi bảng trống) */
async function seedToSupabase(db) {
  const { error: e1 } = await supabase.from('users').upsert(
    db.users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      plan: u.plan,
      status: u.status,
      due_day: u.dueDay,
      last_reminder_at: u.lastReminderAt,
    })),
  );
  if (e1) console.error('Seed users error:', e1);

  const { error: e2 } = await supabase.from('payments').upsert(
    db.payments.map((p) => ({
      id: p.id,
      user_id: p.userId,
      month: p.month,
      amount: p.amount,
      due_date: p.dueDate,
      status: p.status,
      paid_at: p.paidAt,
      method: p.method,
      proof_url: p.proofUrl,
      admin_note: p.adminNote,
      submitted_at: p.submittedAt,
    })),
  );
  if (e2) console.error('Seed payments error:', e2);
}

/** Load toàn bộ từ Supabase */
export async function loadFromSupabase() {
  const { data: users, error: e1 } = await supabase.from('users').select('*');
  const { data: payments, error: e2 } = await supabase.from('payments').select('*');

  if (e1 || e2) {
    console.error(e1 || e2);
    return seed(); // fallback nếu lỗi mạng / chưa tạo bảng
  }

  // Chưa có dữ liệu → seed một lần
  if (!users || users.length === 0) {
    const s = seed();
    await seedToSupabase(s);
    return s;
  }

  const mappedUsers = users.map(mapUser);
  let mappedPayments = (payments || []).map(mapPayment);

  // Đảm bảo mỗi user active có bill tháng hiện tại
  const now = monthKey();
  const extra = [];
  mappedUsers.forEach((u) => {
    if (u.status !== 'active') return;
    if (!mappedPayments.some((p) => p.userId === u.id && p.month === now)) {
      const p = newPayment(u.id, now, PLANS[u.plan].fee, u.dueDay, false);
      extra.push(p);
    }
  });

  if (extra.length) {
    await supabase.from('payments').upsert(
      extra.map((p) => ({
        id: p.id,
        user_id: p.userId,
        month: p.month,
        amount: p.amount,
        due_date: p.dueDate,
        status: p.status,
        paid_at: p.paidAt,
        method: p.method,
        proof_url: p.proofUrl,
        admin_note: p.adminNote,
        submitted_at: p.submittedAt,
      })),
    );
    mappedPayments = [...mappedPayments, ...extra];
  }

  return {
    users: mappedUsers,
    payments: mappedPayments,
    currentUserId: mappedUsers[0]?.id || 'U001',
  };
}

/** Cập nhật 1 payment lên Supabase */
export async function updatePaymentOnSupabase(payment) {
  const { error } = await supabase.from('payments').upsert({
    id: payment.id,
    user_id: payment.userId,
    month: payment.month,
    amount: payment.amount,
    due_date: payment.dueDate,
    status: payment.status,
    paid_at: payment.paidAt,
    method: payment.method,
    proof_url: payment.proofUrl,
    admin_note: payment.adminNote,
    submitted_at: payment.submittedAt,
  });
  if (error) console.error('updatePaymentOnSupabase error:', error);
  return !error;
}

// ===================== HELPERS (giữ nguyên API cũ) =====================

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