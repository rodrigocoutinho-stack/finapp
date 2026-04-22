#!/usr/bin/env node
// Reclassifica categorias de despesa que na verdade são aportes/investimento,
// mudando type 'despesa' -> 'investimento' na categoria e em todas as
// transações e recorrências vinculadas. Saldos NÃO mudam (delta de despesa
// e investimento é idêntico: ambos debitam a conta).
//
// Uso:
//   node scripts/reclassify-investments.mjs                         # dry-run
//   node scripts/reclassify-investments.mjs --commit                # aplica
//   node scripts/reclassify-investments.mjs --patterns="Aporte,CDB" # padrões custom
//   node scripts/reclassify-investments.mjs --email=outro@x.com     # outro usuário
//
// Padrões default (match por substring, case-insensitive no nome da categoria):
//   - "Investimento" (pega "PF | Investimentos", "Investimentos e Reserva", etc)
//   - "Reserva"      (pega "PF | Reserva", "Reserva de emergência", etc)

import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const DEFAULT_EMAIL = "rodrigo.coutinho@raizeducacao.com.br";
const DEFAULT_PATTERNS = ["Investimento", "Reserva"];

const args = process.argv.slice(2);
const COMMIT = args.includes("--commit");
const emailArg = args.find((a) => a.startsWith("--email="));
const patternsArg = args.find((a) => a.startsWith("--patterns="));

const USER_EMAIL = emailArg ? emailArg.slice(8) : DEFAULT_EMAIL;
const PATTERNS = patternsArg
  ? patternsArg.slice(11).split(",").map((s) => s.trim()).filter(Boolean)
  : DEFAULT_PATTERNS;

function loadEnv() {
  const raw = readFileSync(join(ROOT, ".env.local"), "utf-8");
  const out = {};
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (!m) continue;
    let v = m[2];
    if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
    out[m[1]] = v;
  }
  return out;
}

const env = loadEnv();
if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error("❌ .env.local não tem NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supa = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function formatBRL(c) {
  return (c / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

async function resolveUserId(email) {
  const { data, error } = await supa.auth.admin.listUsers({ page: 1, perPage: 200 });
  if (error) throw new Error(`Falha ao listar usuários: ${error.message}`);
  const hit = data.users.find((u) => (u.email || "").toLowerCase() === email.toLowerCase());
  if (!hit) throw new Error(`Usuário ${email} não encontrado`);
  return hit.id;
}

function matchesAnyPattern(name, patterns) {
  const lower = name.toLowerCase();
  return patterns.some((p) => lower.includes(p.toLowerCase()));
}

async function main() {
  const mode = COMMIT ? "COMMIT (aplicando)" : "DRY-RUN";
  console.log(`\n💼 Reclassify Investments — ${mode}`);
  console.log(`   Usuário:   ${USER_EMAIL}`);
  console.log(`   Padrões:   ${PATTERNS.join(", ")}\n`);

  const userId = await resolveUserId(USER_EMAIL);

  // 1. Categorias candidatas: type='despesa' + nome match padrão
  const { data: allCats, error: catsErr } = await supa
    .from("categories")
    .select("id, name, type, category_group")
    .eq("user_id", userId)
    .eq("type", "despesa");
  if (catsErr) throw new Error(`Erro ao buscar categorias: ${catsErr.message}`);

  const candidates = (allCats ?? []).filter((c) => matchesAnyPattern(c.name, PATTERNS));

  if (candidates.length === 0) {
    console.log("Nenhuma categoria de despesa com nome matching foi encontrada.");
    console.log("Nada a reclassificar.\n");
    return;
  }

  console.log(`📂 Categorias candidatas (${candidates.length}):`);
  for (const c of candidates) {
    console.log(`   - ${c.name}  [${c.category_group ?? "sem grupo"}]`);
  }
  console.log();

  // 2. Para cada, contar transações e somar
  const catIds = candidates.map((c) => c.id);

  const { data: txns, error: txErr } = await supa
    .from("transactions")
    .select("id, category_id, amount_cents, date, description, type")
    .eq("user_id", userId)
    .in("category_id", catIds);
  if (txErr) throw new Error(`Erro ao buscar transações: ${txErr.message}`);

  const { data: recs, error: recErr } = await supa
    .from("recurring_transactions")
    .select("id, category_id, amount_cents, description, type")
    .eq("user_id", userId)
    .in("category_id", catIds);
  if (recErr) throw new Error(`Erro ao buscar recorrências: ${recErr.message}`);

  const txnsByCat = new Map();
  for (const t of txns ?? []) {
    if (!txnsByCat.has(t.category_id)) txnsByCat.set(t.category_id, []);
    txnsByCat.get(t.category_id).push(t);
  }
  const recsByCat = new Map();
  for (const r of recs ?? []) {
    if (!recsByCat.has(r.category_id)) recsByCat.set(r.category_id, []);
    recsByCat.get(r.category_id).push(r);
  }

  let totalTxns = 0;
  let totalTxnsCents = 0;
  let totalRecs = 0;
  let totalRecsCents = 0;
  let txnsAlreadyInvestimento = 0;

  console.log(`📊 Impacto por categoria:\n`);
  for (const c of candidates) {
    const ts = txnsByCat.get(c.id) ?? [];
    const rs = recsByCat.get(c.id) ?? [];
    const catTxnSum = ts.reduce((s, t) => s + (t.type === "despesa" ? t.amount_cents : 0), 0);
    const catRecSum = rs.reduce((s, r) => s + (r.type === "despesa" ? r.amount_cents : 0), 0);
    const alreadyInv = ts.filter((t) => t.type === "investimento").length;
    txnsAlreadyInvestimento += alreadyInv;
    console.log(`   ${c.name}`);
    console.log(`      └─ ${ts.length} transações   · ${formatBRL(catTxnSum)}${alreadyInv > 0 ? `   (${alreadyInv} já são investimento)` : ""}`);
    console.log(`      └─ ${rs.length} recorrências · ${formatBRL(catRecSum)}`);
    totalTxns += ts.length;
    totalTxnsCents += catTxnSum;
    totalRecs += rs.length;
    totalRecsCents += catRecSum;
  }
  console.log();
  console.log(`📈 Total:`);
  console.log(`   ${candidates.length} categorias   → type 'despesa' vira 'investimento'`);
  console.log(`   ${totalTxns} transações   → ${formatBRL(totalTxnsCents)}`);
  console.log(`   ${totalRecs} recorrências → ${formatBRL(totalRecsCents)}`);
  if (txnsAlreadyInvestimento > 0) {
    console.log(`   (${txnsAlreadyInvestimento} transações já estavam em 'investimento' — serão ignoradas pelo UPDATE)`);
  }
  console.log();
  console.log(`💰 Saldos das contas: NÃO SERÃO ALTERADOS (delta de despesa = delta de investimento).`);
  console.log();

  if (!COMMIT) {
    console.log(`⚠️  DRY-RUN — nada foi alterado. Para aplicar, rode com --commit.\n`);
    return;
  }

  // 3. APLICAR
  console.log(`🚀 Aplicando mudanças...\n`);

  let catOk = 0;
  let txOk = 0;
  let recOk = 0;

  for (const c of candidates) {
    // Update category
    const { error: cErr } = await supa
      .from("categories")
      .update({ type: "investimento" })
      .eq("id", c.id)
      .eq("user_id", userId);
    if (cErr) {
      console.error(`   ❌ Categoria ${c.name}: ${cErr.message}`);
      continue;
    }
    catOk++;

    // Update transactions (apenas as que ainda são despesa — safe re-run)
    const { error: tErr, count: tCount } = await supa
      .from("transactions")
      .update({ type: "investimento" }, { count: "exact" })
      .eq("user_id", userId)
      .eq("category_id", c.id)
      .eq("type", "despesa");
    if (tErr) {
      console.error(`   ❌ Transações de ${c.name}: ${tErr.message}`);
    } else {
      txOk += tCount ?? 0;
    }

    // Update recurring
    const { error: rErr, count: rCount } = await supa
      .from("recurring_transactions")
      .update({ type: "investimento" }, { count: "exact" })
      .eq("user_id", userId)
      .eq("category_id", c.id)
      .eq("type", "despesa");
    if (rErr) {
      console.error(`   ❌ Recorrências de ${c.name}: ${rErr.message}`);
    } else {
      recOk += rCount ?? 0;
    }

    console.log(`   ✅ ${c.name}`);
  }

  // 4. Audit log
  await supa.from("audit_logs").insert({
    user_id: userId,
    action: "reclassify.investimento",
    entity_type: "category",
    entity_id: null,
    details: {
      categories_affected: catOk,
      transactions_updated: txOk,
      recurring_updated: recOk,
      patterns: PATTERNS,
      script: "reclassify-investments.mjs",
    },
  });

  console.log();
  console.log(`✅ Concluído.`);
  console.log(`   ${catOk} categorias reclassificadas`);
  console.log(`   ${txOk} transações atualizadas`);
  console.log(`   ${recOk} recorrências atualizadas\n`);
}

main().catch((err) => {
  console.error(`\n❌ Erro: ${err.message}`);
  if (err.stack) console.error(err.stack);
  process.exit(1);
});
