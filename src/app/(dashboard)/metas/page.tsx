"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { PageHeader } from "@/components/ui/page-header";
import { TableSkeleton } from "@/components/ui/skeleton";
import { GoalForm } from "@/components/metas/goal-form";
import { GoalList } from "@/components/metas/goal-list";
import { useToast } from "@/contexts/toast-context";
import type { Goal, Account } from "@/types/database";

export default function MetasPage() {
  const supabase = createClient();
  const { addToast } = useToast();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);

    const [goalsRes, accountsRes] = await Promise.all([
      supabase
        .from("goals")
        .select("*")
        .order("priority")
        .order("deadline")
        .limit(100),
      supabase.from("accounts").select("*").order("name"),
    ]);

    setGoals((goalsRes.data as Goal[]) ?? []);
    setAccounts((accountsRes.data as Account[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div>
      <PageHeader
        title="Metas Financeiras"
        description="Defina objetivos, acompanhe o progresso e alcance suas metas"
        action={<Button onClick={() => setShowForm(true)}>Nova meta</Button>}
      />

      {loading ? (
        <TableSkeleton rows={3} cols={4} />
      ) : (
        <GoalList goals={goals} accounts={accounts} onRefresh={fetchData} />
      )}

      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title="Nova meta"
      >
        <GoalForm
          accounts={accounts}
          onSuccess={() => {
            setShowForm(false);
            fetchData();
            addToast("Meta criada com sucesso.");
          }}
          onCancel={() => setShowForm(false)}
        />
      </Modal>
    </div>
  );
}
