import { useEffect, useRef, useState, useMemo } from 'react';
import { Check, Copy, Loader2, QrCode, RefreshCw, Upload, X, Search, ChevronDown } from 'lucide-react';
import { BANK } from '../config';
import { buildVietQrUrl, transferContent } from '../lib/vietqr';
import { monthLabel, vnd } from '../lib/format';
import { useApp } from '../context/AppContext.jsx';

function CopyRow({ label, value, mono }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef();

  useEffect(() => () => clearTimeout(timer.current), []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 1400);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <div className="flex items-center justify-between gap-3 py-2.5">
      <div className="min-w-0">
        <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
        <p className={`break-all text-sm font-medium ${mono ? 'font-mono' : ''}`}>{value}</p>
      </div>
      <button
        onClick={copy}
        aria-label={copied ? `Đã sao chép ${label}` : `Sao chép ${label}`}
        className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:hover:bg-slate-800 dark:hover:text-slate-200"
      >
        {copied ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
      </button>
    </div>
  );
}

export default function CheckoutModal({ user: initialUser, payment, onClose, onSubmit }) {
  const { db, dispatch } = useApp();
  const [step, setStep] = useState('qr'); // qr | submitting | success
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [qrAttempt, setQrAttempt] = useState(0);
  const [proofFile, setProofFile] = useState(null);
  const [proofPreview, setProofPreview] = useState(null);
  const dialogRef = useRef(null);

  // Quản lý chọn thành viên trong Modal
  const [selectedUserId, setSelectedUserId] = useState(initialUser?.id);
  const [memberSearchOpen, setMemberSearchOpen] = useState(false);
  const [memberQuery, setMemberQuery] = useState('');
  const dropdownRef = useRef(null);

  const users = useMemo(
    () => [...(db?.users || [])].sort((a, b) => a.name.localeCompare(b.name, 'vi')),
    [db?.users],
  );

  const currentUser = useMemo(
    () => users.find((u) => u.id === selectedUserId) || initialUser || {},
    [users, selectedUserId, initialUser],
  );

  const filteredUsers = useMemo(() => {
    const q = memberQuery.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) => u.name.toLowerCase().includes(q) || u.id.toLowerCase().includes(q),
    );
  }, [users, memberQuery]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setMemberSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const content = transferContent(currentUser.id, payment.month);
  const baseQrUrl = buildVietQrUrl({ amount: payment.amount, content });
  const qrUrl = qrAttempt ? `${baseQrUrl}${baseQrUrl.includes('?') ? '&' : '?'}r=${qrAttempt}` : baseQrUrl;

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && step !== 'submitting' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, step]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialogRef.current?.focus();
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const handleProof = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setProofFile(file);
    const reader = new FileReader();
    reader.onload = () => setProofPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const submit = () => {
    if (!proofPreview) return;
    setStep('submitting');
    setTimeout(() => {
      onSubmit(payment.id, proofPreview);
      setStep('success');
    }, 900);
  };

  const retryQr = () => {
    setImgError(false);
    setImgLoaded(false);
    setQrAttempt((n) => n + 1);
  };

  return (
    <div
      className="fixed inset-0 z-40 flex items-end justify-center bg-slate-950/70 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onMouseDown={(e) => e.target === e.currentTarget && step !== 'submitting' && onClose()}
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="checkout-title"
        className="animate-pop-in max-h-[95vh] w-full max-w-md overflow-y-auto rounded-t-3xl border border-slate-200 bg-white shadow-2xl outline-none sm:rounded-3xl dark:border-slate-800 dark:bg-slate-900"
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
          <div>
            <h2 id="checkout-title" className="text-base font-semibold">
              Đóng quỹ CLB
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Khoản quỹ {monthLabel(payment.month)}
            </p>
          </div>
          {step !== 'submitting' && (
            <button
              onClick={onClose}
              aria-label="Đóng"
              className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:hover:bg-slate-800"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {step === 'success' ? (
          <div className="flex flex-col items-center px-6 py-12 text-center" role="status">
            <span className="grid h-16 w-16 place-items-center rounded-full bg-sky-500/10 text-sky-600">
              <Check size={32} />
            </span>
            <h3 className="mt-4 text-lg font-semibold">Đã gửi biên lai!</h3>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Giao dịch của <strong>{currentUser.name}</strong> đang chờ Admin duyệt.
            </p>
            <button
              onClick={onClose}
              className="mt-6 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-500"
            >
              Đóng
            </button>
          </div>
        ) : (
          <div className="space-y-5 px-5 py-5">
            {/* Chọn thành viên gửi nộp */}
            <div className="relative" ref={dropdownRef}>
              <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">
                Thành viên nộp quỹ
              </label>
              <button
                type="button"
                onClick={() => setMemberSearchOpen(!memberSearchOpen)}
                className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-900 shadow-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              >
                <span className="truncate">
                  {currentUser.name} ({currentUser.id})
                </span>
                <ChevronDown size={16} className="text-slate-400" />
              </button>

              {memberSearchOpen && (
                <div className="absolute left-0 right-0 z-50 mt-1 rounded-xl border border-slate-200 bg-white p-2 shadow-xl dark:border-slate-700 dark:bg-slate-900">
                  <div className="mb-2 flex items-center gap-2 border-b border-slate-100 px-2 pb-2 dark:border-slate-800">
                    <Search size={16} className="text-slate-400" />
                    <input
                      type="text"
                      value={memberQuery}
                      onChange={(e) => setMemberQuery(e.target.value)}
                      placeholder="Tìm theo tên hoặc mã..."
                      className="w-full bg-transparent text-sm focus:outline-none dark:text-slate-100"
                      autoFocus
                    />
                  </div>
                  <div className="max-h-48 overflow-y-auto space-y-1">
                    {filteredUsers.length === 0 ? (
                      <p className="py-3 text-center text-xs text-slate-400">
                        Không tìm thấy thành viên
                      </p>
                    ) : (
                      filteredUsers.map((u) => (
                        <div
                          key={u.id}
                          onClick={() => {
                            setSelectedUserId(u.id);
                            dispatch({ type: 'switchUser', id: u.id });
                            setMemberSearchOpen(false);
                            setMemberQuery('');
                          }}
                          className={`flex cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-sm transition ${
                            u.id === currentUser.id
                              ? 'bg-emerald-500/10 font-medium text-emerald-600 dark:text-emerald-400'
                              : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                        >
                          <span className="truncate">{u.name}</span>
                          <span className="ml-2 text-xs text-slate-400">{u.id}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Thông tin chuyển khoản */}
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 dark:border-slate-700 dark:bg-slate-800/50">
              <CopyRow label="Ngân hàng" value={BANK.BANK_ID} />
              <CopyRow label="Số tài khoản" value={BANK.ACCOUNT_NO} mono />
              <CopyRow label="Chủ tài khoản" value={BANK.ACCOUNT_NAME} />
              <CopyRow label="Nội dung CK" value={content} mono />
              <div className="flex items-center justify-between py-2.5">
                <p className="text-xs text-slate-500">Số tiền</p>
                <p className="text-sm font-semibold text-emerald-600">{vnd(payment.amount)}</p>
              </div>
            </div>

            {/* VietQR */}
            <div className="text-center">
              <p className="mb-2 flex items-center justify-center gap-1.5 text-sm font-medium">
                <QrCode size={16} /> Quét mã VietQR
              </p>
              <div className="relative mx-auto h-56 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-700">
                {!imgLoaded && !imgError && (
                  <div className="absolute inset-0 grid place-items-center">
                    <Loader2 className="animate-spin text-slate-400" size={28} />
                  </div>
                )}
                {imgError ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 text-center">
                    <p className="text-xs text-slate-500">Không tải được mã QR</p>
                    <button onClick={retryQr} className="flex items-center gap-1 text-xs text-emerald-600">
                      <RefreshCw size={12} /> Thử lại
                    </button>
                  </div>
                ) : (
                  <img
                    src={qrUrl}
                    alt="VietQR"
                    className={`h-full w-full object-contain transition-opacity ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
                    onLoad={() => setImgLoaded(true)}
                    onError={() => setImgError(true)}
                  />
                )}
              </div>
            </div>

            {/* Upload biên lai */}
            <div>
              <label className="mb-2 block text-sm font-medium">
                Ảnh biên lai chuyển khoản <span className="text-rose-500">*</span>
              </label>
              <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-6 transition hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800/40 dark:hover:bg-slate-800">
                <input type="file" accept="image/*" className="hidden" onChange={handleProof} />
                {proofPreview ? (
                  <img src={proofPreview} alt="Biên lai" className="max-h-40 rounded-lg object-contain" />
                ) : (
                  <>
                    <Upload size={28} className="mb-2 text-slate-400" />
                    <span className="text-sm text-slate-500">Chọn ảnh biên lai</span>
                  </>
                )}
              </label>
            </div>

            <button
              onClick={submit}
              disabled={!proofPreview || step === 'submitting'}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-medium text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {step === 'submitting' ? (
                <>
                  <Loader2 size={18} className="animate-spin" /> Đang gửi...
                </>
              ) : (
                'Gửi biên lai & Chờ Admin duyệt'
              )}
            </button>

            <p className="text-center text-xs text-slate-500 dark:text-slate-400">
              Bạn <strong>không thể tự xác nhận</strong> thanh toán. Chỉ Admin mới được duyệt.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}