import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { PDFDocument } from "pdf-lib";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit, PDF_IMPORT_LIMIT } from "@/lib/rate-limit";
import type { ParsedTransaction } from "@/lib/ofx-parser";

const MAX_PDF_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_PASSWORD_LENGTH = 50;

const EXTRACTION_FORMAT_AND_RULES = `Retorne APENAS um JSON array válido (sem markdown, sem blocos de código), no formato:
[
  {
    "date": "YYYY-MM-DD",
    "description": "descrição da transação",
    "amount": 123.45,
    "type": "despesa"
  }
]

Regras:
- date: formato YYYY-MM-DD
- amount: valor POSITIVO em reais (decimal com ponto, ex: 49.90)
- type: "despesa" para compras/débitos, "receita" para pagamentos/créditos/estornos
- description: texto da transação como aparece na fatura
- Se uma transação é parcelada (ex: "PARCELA 3/12"), inclua na descrição
- Ignore linhas de total, subtotal, saldo anterior, limite disponível
- Se não conseguir extrair transações, retorne []`;

const EXTRACTION_PROMPT = `Você é um extrator de dados de faturas e extratos bancários brasileiros.

Analise o PDF e extraia TODAS as transações individuais.

${EXTRACTION_FORMAT_AND_RULES}`;

const TEXT_EXTRACTION_PROMPT = `Você é um extrator de dados de faturas e extratos bancários brasileiros.

O texto abaixo foi extraído de um PDF de fatura/extrato bancário. Analise e extraia TODAS as transações individuais.

${EXTRACTION_FORMAT_AND_RULES}

Texto extraído do PDF:
`;

interface GeminiTransaction {
  date: unknown;
  description: unknown;
  amount: unknown;
  type: unknown;
}

function validateDate(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const match = value.match(/^\d{4}-\d{2}-\d{2}$/);
  if (!match) return null;
  const d = new Date(value);
  if (isNaN(d.getTime())) return null;
  return value;
}

function parseGeminiResponse(raw: string): {
  transactions: ParsedTransaction[];
  errors: string[];
} {
  const errors: string[] = [];
  const transactions: ParsedTransaction[] = [];

  // Strip markdown code fences if present
  let cleaned = raw.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "");
  }

  let parsed: GeminiTransaction[];
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    return {
      transactions: [],
      errors: ["Não foi possível interpretar a resposta da IA. Tente novamente ou use outro formato."],
    };
  }

  if (!Array.isArray(parsed)) {
    return {
      transactions: [],
      errors: ["Resposta da IA não é uma lista de transações."],
    };
  }

  for (let i = 0; i < parsed.length; i++) {
    const item = parsed[i];

    const date = validateDate(item.date);
    if (!date) {
      errors.push(`Transação ${i + 1}: data inválida "${String(item.date)}", ignorada.`);
      continue;
    }

    const amount = typeof item.amount === "number" ? item.amount : parseFloat(String(item.amount));
    if (isNaN(amount) || amount <= 0 || amount > 10_000_000) {
      errors.push(`Transação ${i + 1}: valor inválido ou fora do intervalo "${String(item.amount)}", ignorada.`);
      continue;
    }

    const type = item.type;
    if (type !== "receita" && type !== "despesa") {
      errors.push(`Transação ${i + 1}: tipo inválido "${String(type)}", ignorada.`);
      continue;
    }

    const description = typeof item.description === "string" ? item.description.trim() : "";
    if (!description) {
      errors.push(`Transação ${i + 1}: descrição vazia, ignorada.`);
      continue;
    }

    transactions.push({
      date,
      amount_cents: Math.round(amount * 100),
      type,
      description,
    });
  }

  return { transactions, errors };
}

function isOriginAllowed(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  if (origin) {
    const allowed = [
      process.env.NEXT_PUBLIC_APP_URL,
      "https://finapp-kohl.vercel.app",
      "http://localhost:3000",
    ].filter(Boolean);
    return allowed.includes(origin);
  }
  // No Origin header — check Referer as fallback (browser same-origin may omit Origin)
  const referer = request.headers.get("referer");
  if (!referer) return true; // Non-browser clients (server-to-server); auth check protects further
  const allowed = [
    process.env.NEXT_PUBLIC_APP_URL,
    "https://finapp-kohl.vercel.app",
    "http://localhost:3000",
  ].filter(Boolean);
  return allowed.some((url) => referer.startsWith(url!));
}

/**
 * Extract text from a password-protected PDF using pdfjs-dist.
 * Returns the concatenated text of all pages or null if extraction fails.
 */
async function extractTextWithPassword(
  pdfBytes: ArrayBuffer,
  password: string
): Promise<string | null> {
  // Dynamic import to avoid loading pdfjs-dist when not needed
  const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");

  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(pdfBytes),
    password,
    useSystemFonts: true,
  });

  const doc = await loadingTask.promise;
  const pageTexts: string[] = [];

  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .filter((item) => "str" in item && typeof (item as Record<string, unknown>).str === "string")
      .map((item) => (item as Record<string, unknown>).str as string)
      .join(" ");
    pageTexts.push(pageText);
  }

  doc.destroy();
  const fullText = pageTexts.join("\n\n");
  return fullText.trim().length > 0 ? fullText : null;
}

export async function POST(request: NextRequest) {
  if (!isOriginAllowed(request)) {
    return NextResponse.json({ error: "Origem não permitida." }, { status: 403 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Serviço de importação temporariamente indisponível." },
      { status: 503 }
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "Corpo da requisição inválido. Envie o PDF via FormData." },
      { status: 400 }
    );
  }

  const pdfFile = formData.get("pdf");
  if (!pdfFile || !(pdfFile instanceof File)) {
    return NextResponse.json(
      { error: "PDF não enviado." },
      { status: 400 }
    );
  }

  if (pdfFile.size > MAX_PDF_SIZE) {
    return NextResponse.json(
      { error: "PDF excede o limite de 10MB." },
      { status: 400 }
    );
  }

  // Validate MIME type (strict: only application/pdf, no extension fallback)
  if (pdfFile.type !== "application/pdf") {
    return NextResponse.json(
      { error: "Apenas arquivos PDF são aceitos." },
      { status: 400 }
    );
  }

  // Read and validate password (optional, max 50 chars)
  const rawPassword = formData.get("password");
  const pdfPassword =
    typeof rawPassword === "string" && rawPassword.length > 0
      ? rawPassword.slice(0, MAX_PASSWORD_LENGTH)
      : undefined;

  // Authenticate BEFORE reading file into memory
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { error: "Não autenticado." },
      { status: 401 }
    );
  }

  // Rate limiting: 2 requests per 5 minutes per user
  const rateCheck = checkRateLimit(user.id, PDF_IMPORT_LIMIT);
  if (!rateCheck.allowed) {
    const retrySeconds = Math.ceil(rateCheck.retryAfterMs / 1000);
    return NextResponse.json(
      { error: `Muitas importações. Tente novamente em ${retrySeconds}s.` },
      { status: 429, headers: { "Retry-After": String(retrySeconds) } }
    );
  }

  // Convert file to bytes AFTER auth check (prevents unauthenticated resource consumption)
  const arrayBuffer = await pdfFile.arrayBuffer();

  // Validate PDF magic bytes (%PDF-)
  const header = new Uint8Array(arrayBuffer.slice(0, 5));
  const magic = String.fromCharCode(...header);
  if (magic !== "%PDF-") {
    return NextResponse.json(
      { error: "Arquivo não é um PDF válido." },
      { status: 400 }
    );
  }

  // ── Path A: Password provided → decrypt with pdfjs-dist, send text to Gemini ──
  if (pdfPassword) {
    let extractedText: string | null;
    try {
      extractedText = await extractTextWithPassword(arrayBuffer, pdfPassword);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("Incorrect Password") || msg.includes("password")) {
        return NextResponse.json(
          { error: "Senha incorreta. Verifique e tente novamente." },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: "Erro ao abrir o PDF com a senha informada. Verifique se o arquivo é válido." },
        { status: 400 }
      );
    }

    if (!extractedText) {
      return NextResponse.json({
        success: false,
        transactions: [],
        errors: ["O PDF foi aberto com a senha, mas não contém texto extraível."],
      });
    }

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

      const result = await model.generateContent(
        {
          contents: [
            {
              role: "user",
              parts: [{ text: TEXT_EXTRACTION_PROMPT + extractedText }],
            },
          ],
        },
        { timeout: 60000 }
      );

      const responseText = result.response.text();

      if (!responseText || responseText.trim().length === 0) {
        return NextResponse.json({
          success: false,
          transactions: [],
          errors: ["A IA não retornou dados a partir do texto extraído."],
        });
      }

      const { transactions, errors } = parseGeminiResponse(responseText);

      return NextResponse.json({
        success: transactions.length > 0,
        transactions,
        errors,
      });
    } catch (err) {
      console.error("PDF text import error:", err);
      return NextResponse.json(
        { error: "Erro ao processar o texto extraído do PDF. Tente novamente." },
        { status: 500 }
      );
    }
  }

  // ── Path B: No password → pdf-lib ignoreEncryption + send PDF bytes to Gemini ──

  // Try to remove owner-password encryption transparently
  let finalPdfBytes: ArrayBuffer | Uint8Array = arrayBuffer;

  try {
    const doc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
    if (doc.isEncrypted) {
      finalPdfBytes = await doc.save();
    }
  } catch {
    // If pdf-lib can't handle it, send original bytes to Gemini
    finalPdfBytes = arrayBuffer;
  }

  const pdfBase64 = Buffer.from(
    finalPdfBytes instanceof Uint8Array ? finalPdfBytes : new Uint8Array(finalPdfBytes)
  ).toString("base64");

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const result = await model.generateContent(
      {
        contents: [
          {
            role: "user",
            parts: [
              {
                inlineData: {
                  mimeType: "application/pdf",
                  data: pdfBase64,
                },
              },
              { text: EXTRACTION_PROMPT },
            ],
          },
        ],
      },
      { timeout: 60000 }
    );

    const responseText = result.response.text();

    if (!responseText || responseText.trim().length === 0) {
      return NextResponse.json({
        success: false,
        transactions: [],
        errors: ["A IA não retornou dados. O PDF pode estar vazio ou ilegível."],
      });
    }

    const { transactions, errors } = parseGeminiResponse(responseText);

    return NextResponse.json({
      success: transactions.length > 0,
      transactions,
      errors,
    });
  } catch (err) {
    console.error("PDF import error:", err);
    const message = err instanceof Error ? err.message : "Erro desconhecido";

    // Detect password-protected or unreadable PDFs
    if (
      message.includes("no pages") ||
      message.includes("could not be opened") ||
      message.includes("password") ||
      message.includes("encrypted")
    ) {
      return NextResponse.json(
        {
          error:
            "Não foi possível ler o PDF. Ele pode estar protegido por senha. " +
            "Tente novamente informando a senha do documento.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Erro ao processar o PDF. Verifique se o arquivo é legível e tente novamente." },
      { status: 500 }
    );
  }
}
