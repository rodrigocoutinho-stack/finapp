"use client";

import type { Toast, ToastVariant } from "@/contexts/toast-context";

const variantStyles: Record<ToastVariant, string> = {
  success: "bg-emerald-600",
  error: "bg-red-600",
  info: "bg-blue-600",
};

function SuccessIcon() {
  return (
    <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function ErrorIcon() {
  return (
    <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="10" />
      <path strokeLinecap="round" d="M12 16v-4M12 8h.01" />
    </svg>
  );
}

const icons: Record<ToastVariant, () => React.ReactNode> = {
  success: SuccessIcon,
  error: ErrorIcon,
  info: InfoIcon,
};

function ToastItem({ toast }: { toast: Toast }) {
  const Icon = icons[toast.variant];
  const role = toast.variant === "error" ? "alert" : "status";

  return (
    <div
      role={role}
      className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg text-white text-sm font-medium transition-transform duration-300 ease-out ${
        variantStyles[toast.variant]
      } ${toast.leaving ? "translate-x-[120%]" : "translate-x-0"}`}
    >
      <Icon />
      <span>{toast.message}</span>
    </div>
  );
}

interface ToastContainerProps {
  toasts: Toast[];
}

export function ToastContainer({ toasts }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  );
}
