"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { PageHeader } from "@/components/ui/page-header";
import { TableSkeleton } from "@/components/ui/skeleton";
import { DebtForm } from "@/components/dividas/debt-form";
import { DebtList } from "@/components/dividas/debt-list";
import { useToast } from "@/contexts/toast-context";
import type { Debt } from "@/types/database";

export default function DividasPage() {
  const supabase = createClient();
  const { addToast } = useToast();
  const [debts, setDebts] = useState<Debt[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);

    const { data } = await supabase
      .from("debts")
      .select("*")
      .order("is_active", { ascending: false })
      .order("remaining_amount_cents", { ascending: false })
      .limit(100);

    setDebts((data as Debt[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div>
      <PageHeader
        title="Dívidas"
        description="Controle suas dívidas, parcelas e simule pagamentos extras"
        action={<Button onClick={() => setShowForm(true)}>Nova dívida</Button>}
      />

      {loading ? (
        <TableSkeleton rows={3} cols={4} />
      ) : (
        <DebtList debts={debts} onRefresh={fetchData} />
      )}

      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title="Nova dívida"
      >
        <DebtForm
          onSuccess={() => {
            setShowForm(false);
            fetchData();
            addToast("Dívida cadastrada com sucesso.");
          }}
          onCancel={() => setShowForm(false)}
        />
      </Modal>
    </div>
  );
}
