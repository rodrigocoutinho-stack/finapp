"use client";

import { useInactivity } from "@/contexts/inactivity-context";
import { Modal } from "@/components/ui/modal";

export function InactivityModal() {
  const { showWarning, remainingSeconds, dismissWarning } = useInactivity();

  return (
    <Modal open={showWarning} onClose={dismissWarning} title="Sessão inativa">
      <div className="space-y-4">
        <p className="text-on-surface-secondary">
          Sua sessão expira em{" "}
          <span className="font-bold text-rose-600 dark:text-rose-400 tabular-nums">
            {remainingSeconds}
          </span>{" "}
          {remainingSeconds === 1 ? "segundo" : "segundos"} por inatividade.
        </p>

        <div className="w-full bg-skeleton rounded-full h-2">
          <div
            className="bg-rose-500 h-2 rounded-full transition-all duration-1000 ease-linear"
            style={{ width: `${(remainingSeconds / 60) * 100}%` }}
          />
        </div>

        <div className="flex justify-end">
          <button
            onClick={dismissWarning}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
          >
            Continuar usando
          </button>
        </div>
      </div>
    </Modal>
  );
}
