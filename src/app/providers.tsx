"use client";

import { PreferencesProvider } from "@/contexts/preferences-context";
import { ToastProvider, useToast } from "@/contexts/toast-context";
import { ToastContainer } from "@/components/ui/toast";

function ToastOutlet() {
  const { toasts, dismissToast } = useToast();
  return <ToastContainer toasts={toasts} onDismiss={dismissToast} />;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <PreferencesProvider>
      <ToastProvider>
        {children}
        <ToastOutlet />
      </ToastProvider>
    </PreferencesProvider>
  );
}
