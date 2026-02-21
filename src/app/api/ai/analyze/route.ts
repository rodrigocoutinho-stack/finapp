import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@/lib/supabase/server";
import { calculateForecast } from "@/lib/forecast";
import { buildFinancialContext } from "@/lib/ai/financial-context";
import { FINANCIAL_ADVISOR_SYSTEM_PROMPT } from "@/lib/ai/system-prompt";
import { checkRateLimit, AI_CHAT_LIMIT } from "@/lib/rate-limit";
import type {
  Account,
  Category,
  Transaction,
  RecurringTransaction,
  Investment,
  InvestmentEntry,
} from "@/types/database";

export async function POST(request: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Serviço de IA temporariamente indisponível." },
      { status: 503 }
    );
  }

  let body: { message?: string; history?: { role: string; content: string }[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Corpo da requisição inválido." },
      { status: 400 }
    );
  }

  const message = body.message;
  if (!message || typeof message !== "string" || message.trim().length === 0) {
    return NextResponse.json(
      { error: "Mensagem é obrigatória." },
      { status: 400 }
    );
  }
  if (message.length > 2000) {
    return NextResponse.json(
      { error: "Mensagem muito longa (máximo 2000 caracteres)." },
      { status: 400 }
    );
  }

  // Validate history (optional, max 10 items)
  const history: { role: string; content: string }[] = [];
  if (Array.isArray(body.history)) {
    for (const item of body.history.slice(-10)) {
      if (
        item &&
        typeof item.content === "string" &&
        item.content.length > 0 &&
        item.content.length <= 4000 &&
        (item.role === "user" || item.role === "assistant")
      ) {
        history.push({ role: item.role, content: item.content });
      }
    }
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { error: "Não autenticado." },
      { status: 401 }
    );
  }

  // Rate limiting: 5 requests per minute per user
  const rateCheck = checkRateLimit(user.id, AI_CHAT_LIMIT);
  if (!rateCheck.allowed) {
    const retrySeconds = Math.ceil(rateCheck.retryAfterMs / 1000);
    return NextResponse.json(
      { error: `Muitas requisições. Tente novamente em ${retrySeconds}s.` },
      { status: 429, headers: { "Retry-After": String(retrySeconds) } }
    );
  }

  try {
    // Fetch financial data in parallel (bounded date ranges)
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
    const sixtyDaysAgoStr = sixtyDaysAgo.toISOString().split("T")[0];

    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
    const twelveMonthsAgoStr = twelveMonthsAgo.toISOString().split("T")[0];

    const [
      profileRes,
      accountsRes,
      categoriesRes,
      transactionsRes,
      recurringRes,
      investmentsRes,
      entriesRes,
    ] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).single(),
      supabase.from("accounts").select("*"),
      supabase.from("categories").select("*"),
      supabase
        .from("transactions")
        .select("*")
        .gte("date", sixtyDaysAgoStr)
        .order("date", { ascending: false })
        .limit(2000),
      supabase
        .from("recurring_transactions")
        .select("*")
        .eq("is_active", true)
        .limit(1000),
      supabase.from("investments").select("*").eq("is_active", true).limit(500),
      supabase
        .from("investment_entries")
        .select("*")
        .gte("date", twelveMonthsAgoStr)
        .order("date", { ascending: false })
        .limit(5000),
    ]);

    const profile = profileRes.data as { closing_day?: number; full_name?: string | null } | null;
    const closingDay = profile?.closing_day ?? 1;
    const fullName = profile?.full_name ?? "";

    // Calculate forecast (4 months including current)
    const forecastResult = await calculateForecast(
      supabase,
      3,
      true,
      closingDay
    );

    const context = buildFinancialContext({
      fullName,
      closingDay,
      accounts: (accountsRes.data as Account[]) ?? [],
      categories: (categoriesRes.data as Category[]) ?? [],
      recentTransactions: (transactionsRes.data as Transaction[]) ?? [],
      recurringTransactions:
        (recurringRes.data as RecurringTransaction[]) ?? [],
      forecast: forecastResult.months,
      investments: (investmentsRes.data as Investment[]) ?? [],
      investmentEntries: (entriesRes.data as InvestmentEntry[]) ?? [],
    });

    // Call Gemini
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // Build multi-turn contents
    const contents: { role: "user" | "model"; parts: { text: string }[] }[] = [];

    if (history.length > 0) {
      // First message: financial context + first user message from history
      const firstUserMsg = history.find((h) => h.role === "user");
      contents.push({
        role: "user",
        parts: [
          {
            text: `## Dados Financeiros do Usuário\n${context}\n\n## Pergunta\n${firstUserMsg?.content ?? message.trim()}`,
          },
        ],
      });

      // Add remaining history messages (skip the first user message already added)
      let skippedFirst = false;
      for (const h of history) {
        if (!skippedFirst && h.role === "user") {
          skippedFirst = true;
          continue;
        }
        contents.push({
          role: h.role === "assistant" ? "model" : "user",
          parts: [{ text: h.content }],
        });
      }

      // Current question
      contents.push({
        role: "user",
        parts: [{ text: message.trim() }],
      });
    } else {
      // No history — single message with financial context
      contents.push({
        role: "user",
        parts: [
          {
            text: `## Dados Financeiros do Usuário\n${context}\n\n## Pergunta\n${message.trim()}`,
          },
        ],
      });
    }

    const result = await model.generateContentStream(
      {
        systemInstruction: FINANCIAL_ADVISOR_SYSTEM_PROMPT,
        contents,
      },
      { timeout: 30000 }
    );

    // Stream response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of result.stream) {
            const text = chunk.text();
            if (text) {
              controller.enqueue(encoder.encode(text));
            }
          }
          controller.close();
        } catch (err) {
          console.error("AI streaming error:", err);
          controller.enqueue(
            encoder.encode(`\n\n---\nNão foi possível gerar a resposta. Tente novamente.`)
          );
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (err) {
    console.error("AI analyze error:", err);
    return NextResponse.json(
      { error: "Erro interno ao processar a análise." },
      { status: 500 }
    );
  }
}
