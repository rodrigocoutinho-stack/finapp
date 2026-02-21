"use client";

import { PreferencesProvider } from "@/contexts/preferences-context";
import { SidebarProvider } from "@/contexts/sidebar-context";
import { ToastProvider, useToast } from "@/contexts/toast-context";
import { InactivityProvider } from "@/contexts/inactivity-context";
import { ToastContainer } from "@/components/ui/toast";
import { InactivityModal } from "@/components/ui/inactivity-modal";

function ToastOutlet() {
  const { toasts, dismissToast } = useToast();
  return <ToastContainer toasts={toasts} onDismiss={dismissToast} />;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <PreferencesProvider>
      <SidebarProvider>
        <ToastProvider>
          <InactivityProvider>
            {children}
            <InactivityModal />
          </InactivityProvider>
          <ToastOutlet />
        </ToastProvider>
      </SidebarProvider>
    </PreferencesProvider>
  );
}
