import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { load, save } from '../lib/db';

const Ctx = createContext(null);
export const useApp = () => useContext(Ctx);

const nowIso = () => new Date().toISOString();

function reducer(state, a) {
  switch (a.type) {
    // Thành viên gửi biên lai → awaiting (chờ admin)
    case 'submitProof':
      return {
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

    // Admin duyệt
    case 'approvePayment':
      return {
        ...state,
        payments: state.payments.map((p) =>
          p.id === a.id
            ? { ...p, status: 'paid', paidAt: nowIso(), adminNote: a.note || null }
            : p,
        ),
      };

    // Admin từ chối
    case 'rejectPayment':
      return {
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

    case 'switchUser':
      return { ...state, currentUserId: a.id };

    default:
      return state;
  }
}

export function AppProvider({ children }) {
  const [db, dispatch] = useReducer(reducer, null, load);
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

  useEffect(() => save(db), [db]);

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
    // Mật khẩu admin – đổi tại đây nếu muốn
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
      toasts,
      toast,
      theme,
      toggleTheme,
      isAdmin,
      loginAdmin,
      logoutAdmin,
    }),
    [db, toasts, toast, theme, toggleTheme, isAdmin, loginAdmin, logoutAdmin],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
