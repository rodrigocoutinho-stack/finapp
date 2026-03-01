import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/**
 * Registra uma ação de auditoria (fire-and-forget).
 * Não bloqueia a operação principal — erros são silenciados.
 */
export function logAudit(
  supabase: SupabaseClient<Database>,
  action: string,
  entityType: string,
  entityId?: string | null,
  details?: Record<string, unknown>
): void {
  // Fire-and-forget — não awaitar
  supabase.auth.getUser().then(({ data }) => {
    const userId = data?.user?.id;
    if (!userId) return;

    supabase
      .from("audit_logs")
      .insert({
        user_id: userId,
        action,
        entity_type: entityType,
        entity_id: entityId ?? null,
        details: details ?? {},
      })
      .then(({ error }) => {
        if (error && process.env.NODE_ENV === "development") {
          console.error("[audit-log]", error.message);
        }
      });
  }).catch((err) => {
    if (process.env.NODE_ENV === "development") {
      console.error("[audit-log] auth error:", err);
    }
  });
}
