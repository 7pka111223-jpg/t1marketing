"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

type Tone = "info" | "success" | "error";
type ToastItem = { id: number; message: string; tone: Tone };
type ToastContextValue = { push: (message: string, tone?: Tone) => void };

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used inside ToastProvider");
  return context;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const push = useCallback((message: string, tone: Tone = "info") => {
    const id = Date.now() + Math.random();
    setToasts((current) => [...current, { id, message, tone }]);
    setTimeout(() => setToasts((current) => current.filter((toast) => toast.id !== id)), 5000);
  }, []);

  const value = useMemo(() => ({ push }), [push]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-stack" role="status" aria-live="polite">
        {toasts.map((toast) => <div className={`toast toast-${toast.tone}`} key={toast.id}>{toast.message}</div>)}
      </div>
    </ToastContext.Provider>
  );
}
