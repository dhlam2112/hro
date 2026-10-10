import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { loadFromSupabase, updatePaymentOnSupabase } from '../lib/db';

const Ctx = createContext(null);
export const useApp = () => useContext(Ctx);

const nowIso = () => new Date().toISOString();

function reducer(state, a) {
  // state = null khi chưa load xong
  if (!state && a.type !== 'init') return state;

  switch (a.type) {
    case 'init':
      return a.payload;

    // Thành viên gửi biên lai → awaiting (chờ admin)
    case 'submitProof': {
      const next = {
        ...state,
        payments: state.payments.map((p) =>
          p.id === a.id
            ? {
                ...p,
                status: 'awaiting',
                proofUrl: a.proofUrl || null,
                submittedAt: nowIso(),
                method: a.method || 'vietqr',
                adminNote: null,
              }
            : p,
        ),
      };
      const updated = next.payments.find((p) => p.id === a.id);
      if (updated) updatePaymentOnSupabase(updated); // đồng bộ lên Supabase
      return next;
    }

    // Admin duyệt
    case 'approvePayment': {
      const next = {
        ...state,
        payments: state.payments.map((p) =>
          p.id === a.id
            ? { ...p, status: 'paid', paidAt: nowIso(), adminNote: a.note || null }
            : p,
        ),
      };
      const updated = next.payments.find((p) => p.id === a.id);
      if (updated) updatePaymentOnSupabase(updated);
      return next;
    }

    // Admin từ chối
    case 'rejectPayment': {
      const next = {
        ...state,
        payments: state.payments.map((p) =>
          p.id === a.id
            ? {
                ...p,
                status: 'rejected',
                adminNote: a.note || null,
                proofUrl: null,
                submittedAt: null,
              }
            : p,
        ),
      };
      const updated = next.payments.find((p) => p.id === a.id);
      if (updated) updatePaymentOnSupabase(updated);
      return next;
    }

    case 'switchUser':
      return { ...state, currentUserId: a.id };

    default:
      return state;
  }
}

export function AppProvider({ children }) {
  const [db, dispatch] = useReducer(reducer, null);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState([]);
  const timers = useRef(new Set());

  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('clubfund.theme') || 'dark';
    } catch {
      return 'dark';
    }
  });

  const [isAdmin, setIsAdmin] = useState(() => {
    try {
      return sessionStorage.getItem('clubfund.admin') === '1';
    } catch {
      return false;
    }
  });

  // Load dữ liệu từ Supabase khi mở app
  useEffect(() => {
    let cancelled = false;
    loadFromSupabase()
      .then((data) => {
        if (!cancelled) {
          dispatch({ type: 'init', payload: data });
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Load Supabase failed:', err);
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    try {
      localStorage.setItem('clubfund.theme', theme);
    } catch {
      /* ignore */
    }
  }, [theme]);

  useEffect(() => {
    const set = timers.current;
    return () => set.forEach(clearTimeout);
  }, []);

  const toast = useCallback((message, type = 'success') => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t, { id, message, type }]);
    const timer = setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id));
      timers.current.delete(timer);
    }, 3800);
    timers.current.add(timer);
  }, []);

  const toggleTheme = useCallback(() => setTheme((t) => (t === 'dark' ? 'light' : 'dark')), []);

  const loginAdmin = useCallback((password) => {
    // Mật khẩu admin
    if (password === 'dhlam211207') {
      sessionStorage.setItem('clubfund.admin', '1');
      setIsAdmin(true);
      return true;
    }
    return false;
  }, []);

  const logoutAdmin = useCallback(() => {
    sessionStorage.removeItem('clubfund.admin');
    setIsAdmin(false);
  }, []);

  const value = useMemo(
    () => ({
      db,
      dispatch,
      loading,
      toasts,
      toast,
      theme,
      toggleTheme,
      isAdmin,
      loginAdmin,
      logoutAdmin,
    }),
    [db, loading, toasts, toast, theme, toggleTheme, isAdmin, loginAdmin, logoutAdmin],
  );

  // Chưa load xong thì hiện loading
  if (loading || !db) {
    return (
      <div className="grid min-h-screen place-items-center text-slate-500">
        Đang tải dữ liệu...
      </div>
    );
  }

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}