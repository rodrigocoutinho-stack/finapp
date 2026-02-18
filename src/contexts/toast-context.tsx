"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

export type ToastVariant = "success" | "error" | "info";

export interface Toast {
  id: number;
  message: string;
  variant: ToastVariant;
  leaving: boolean;
}

interface ToastContextValue {
  toasts: Toast[];
  addToast: (message: string, variant?: ToastVariant) => void;
  removeToast: (id: number) => void;
  dismissToast: (id: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let nextId = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timersRef = useRef<Map<number, ReturnType<typeof setTimeout>[]>>(new Map());

  // Cleanup all timers on unmount
  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      for (const timerList of timers.values()) {
        timerList.forEach(clearTimeout);
      }
      timers.clear();
    };
  }, []);

  const clearTimersForToast = useCallback((id: number) => {
    const timerList = timersRef.current.get(id);
    if (timerList) {
      timerList.forEach(clearTimeout);
      timersRef.current.delete(id);
    }
  }, []);

  const removeToast = useCallback((id: number) => {
    clearTimersForToast(id);
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, [clearTimersForToast]);

  const dismissToast = useCallback(
    (id: number) => {
      clearTimersForToast(id);
      setToasts((prev) =>
        prev.map((t) => (t.id === id ? { ...t, leaving: true } : t))
      );
      const timer = setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 300);
      timersRef.current.set(id, [timer]);
    },
    [clearTimersForToast]
  );

  const addToast = useCallback(
    (message: string, variant: ToastVariant = "success") => {
      const id = nextId++;
      const duration = variant === "error" ? 8000 : 4000;
      setToasts((prev) => [...prev, { id, message, variant, leaving: false }]);

      // Start exit animation 500ms before removal
      const leaveTimer = setTimeout(() => {
        setToasts((prev) =>
          prev.map((t) => (t.id === id ? { ...t, leaving: true } : t))
        );
      }, duration - 500);

      // Remove after duration
      const removeTimer = setTimeout(() => {
        timersRef.current.delete(id);
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);

      timersRef.current.set(id, [leaveTimer, removeTimer]);
    },
    []
  );

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, dismissToast }}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
