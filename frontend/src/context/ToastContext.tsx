"use client";
import React, { createContext, useContext, useMemo, useState } from 'react';

type Toast = { id: string; message: string; type: 'success' | 'error' | 'info' };

type ToastCtx = {
  success: (msg: string) => void;
  error: (msg: string) => void;
  info: (msg: string) => void;
};

const ToastContext = createContext<ToastCtx | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  function push(type: Toast['type'], message: string) {
    const id = String(Date.now()) + Math.random().toString(36).slice(2, 8);
    const t: Toast = { id, message, type };
    setToasts((s) => [...s, t]);
    // auto-remove
    setTimeout(() => {
      setToasts((s) => s.filter((x) => x.id !== id));
    }, 3000);
  }

  const api = useMemo(() => ({
    success: (m: string) => push('success', m),
    error: (m: string) => push('error', m),
    info: (m: string) => push('info', m),
  }), []);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div aria-live="polite" className="fixed right-6 top-6 z-50 flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`rounded-md px-4 py-2 text-white shadow ${
              t.type === 'success' ? 'bg-emerald-600' : t.type === 'error' ? 'bg-rose-600' : 'bg-slate-700'
            }`}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

export default ToastContext;
