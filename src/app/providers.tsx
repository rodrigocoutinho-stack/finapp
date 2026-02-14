"use client";

import { ToastProvider, useToast } from "@/contexts/toast-context";
import { ToastContainer } from "@/components/ui/toast";

function ToastOutlet() {
  const { toasts, dismissToast } = useToast();
  return <ToastContainer toasts={toasts} onDismiss={dismissToast} />;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      {children}
      <ToastOutlet />
    </ToastProvider>
  );
}
