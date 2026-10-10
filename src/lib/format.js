const LOCALE = 'vi-VN';

export const vnd = (n) =>
  new Intl.NumberFormat(LOCALE, { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(n);

export const monthKey = (d = new Date()) =>
  `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}`;

export const addMonths = (key, n) => {
  const y = +key.slice(0, 4);
  const m = +key.slice(4) - 1 + n;
  return monthKey(new Date(y, m, 1));
};

// "Tháng 10/2026"
export const monthLabel = (key) => `Tháng ${key.slice(4).replace(/^0/, '')}/${key.slice(0, 4)}`;

export const dueDateOf = (key, day) => new Date(+key.slice(0, 4), +key.slice(4) - 1, 18, 23, 59, 59);

// "10/10/2026"
export const fmtDate = (iso) =>
  iso ? new Intl.DateTimeFormat(LOCALE, { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(iso)) : '—';

// "10/10 09:30"
export const fmtDateTime = (iso) =>
  iso
    ? new Intl.DateTimeFormat(LOCALE, {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date(iso))
    : '—';

export const daysBetween = (iso, from = new Date()) =>
  Math.ceil((new Date(iso).getTime() - from.getTime()) / 86400000);

export const initials = (name) =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(-2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

// Tên gọi ngắn: bỏ hậu tố "gen 4", lấy từ cuối. "Nguyễn Nam Khánh gen 4" -> "Khánh"
export const firstName = (name = '') =>
  name.replace(/\s+gen\s*\d+\s*$/i, '').trim().split(/\s+/).pop() || 'Thành viên';
