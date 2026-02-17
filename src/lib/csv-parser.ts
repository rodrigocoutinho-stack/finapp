import type { ParsedTransaction } from "@/lib/ofx-parser";

export interface CSVColumnMapping {
  date: number;
  amount: number;
  description: number;
  type?: number;
}

export interface CSVParseResult {
  success: boolean;
  transactions: ParsedTransaction[];
  errors: string[];
}

export interface CSVPreview {
  headers: string[];
  rows: string[][];
  totalRows: number;
  delimiter: string;
  headerRowIndex: number;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

/**
 * Detects the delimiter used in a CSV file by counting occurrences in the first line.
 */
function detectDelimiter(firstLine: string): string {
  const semicolons = (firstLine.match(/;/g) || []).length;
  const commas = (firstLine.match(/,/g) || []).length;
  const tabs = (firstLine.match(/\t/g) || []).length;

  if (tabs >= semicolons && tabs >= commas && tabs > 0) return "\t";
  if (semicolons >= commas && semicolons > 0) return ";";
  return ",";
}

/**
 * Splits a CSV line respecting quoted fields.
 */
function splitCSVLine(line: string, delimiter: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      fields.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  fields.push(current.trim());
  return fields;
}

/** Known header patterns for auto-detecting the header row. */
const HEADER_PATTERNS = [
  "data", "date", "dt", "dia",
  "valor", "amount", "value", "vlr",
  "descricao", "descri\u00e7\u00e3o", "description", "memo", "historico", "hist\u00f3rico",
  "tipo", "type", "natureza",
  "saldo", "balance",
  "lancamento", "lan\u00e7amento",
];

/**
 * Detects the header row index by scanning lines for known header patterns.
 * Returns the index of the first line that has >= 3 fields and at least one
 * field matching a known header pattern. Falls back to the first line with >= 3 fields,
 * then to line 0.
 */
function detectHeaderRow(lines: string[]): { index: number; delimiter: string } {
  let firstMultiColLine = -1;
  let firstMultiColDelimiter = ",";

  for (let i = 0; i < Math.min(lines.length, 20); i++) {
    const delimiter = detectDelimiter(lines[i]);
    const fields = splitCSVLine(lines[i], delimiter);

    if (fields.length < 3) continue;

    if (firstMultiColLine === -1) {
      firstMultiColLine = i;
      firstMultiColDelimiter = delimiter;
    }

    // Check if any field matches a known header pattern
    const normalized = fields.map((f) =>
      f.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim()
    );

    const hasHeaderMatch = normalized.some((field) =>
      HEADER_PATTERNS.some((pattern) => {
        const normalizedPattern = pattern.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        return field.includes(normalizedPattern);
      })
    );

    if (hasHeaderMatch) {
      return { index: i, delimiter };
    }
  }

  if (firstMultiColLine !== -1) {
    return { index: firstMultiColLine, delimiter: firstMultiColDelimiter };
  }

  return { index: 0, delimiter: detectDelimiter(lines[0] || "") };
}

/**
 * Previews a CSV file: auto-detects header row, delimiter, extracts headers and first 5 data rows.
 */
export function previewCSV(content: string): CSVPreview {
  const lines = content
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) {
    return { headers: [], rows: [], totalRows: 0, delimiter: ",", headerRowIndex: 0 };
  }

  const { index: headerRowIndex, delimiter } = detectHeaderRow(lines);
  const headers = splitCSVLine(lines[headerRowIndex], delimiter);
  const dataLines = lines.slice(headerRowIndex + 1);
  const previewRows = dataLines.slice(0, 5).map((line) => splitCSVLine(line, delimiter));

  return {
    headers,
    rows: previewRows,
    totalRows: dataLines.length,
    delimiter,
    headerRowIndex,
  };
}

/**
 * Parses a monetary value string (BR or US format) to cents.
 * Supports: 1.234,56 | 1234,56 | 1234.56 | -1.234,56 | R$ 1.234,56 | (1.234,56)
 */
function parseAmount(raw: string): { cents: number; negative: boolean } | null {
  let cleaned = raw.trim();

  // Strip currency prefix
  cleaned = cleaned.replace(/^R\$\s*/i, "");

  // Detect parenthetical negatives: (1.234,56)
  let negative = false;
  if (cleaned.startsWith("(") && cleaned.endsWith(")")) {
    negative = true;
    cleaned = cleaned.slice(1, -1).trim();
  }

  // Detect minus sign
  if (cleaned.startsWith("-")) {
    negative = true;
    cleaned = cleaned.slice(1).trim();
  }

  // Remove spaces
  cleaned = cleaned.replace(/\s/g, "");

  if (cleaned.length === 0) return null;

  // Determine format: BR (1.234,56) vs US (1,234.56) vs plain (1234.56 or 1234,56)
  const lastComma = cleaned.lastIndexOf(",");
  const lastDot = cleaned.lastIndexOf(".");

  let numericValue: number;

  if (lastComma > lastDot) {
    // BR format: dots are thousands, comma is decimal
    const normalized = cleaned.replace(/\./g, "").replace(",", ".");
    numericValue = parseFloat(normalized);
  } else if (lastDot > lastComma) {
    // US format: commas are thousands, dot is decimal
    const normalized = cleaned.replace(/,/g, "");
    numericValue = parseFloat(normalized);
  } else if (lastComma !== -1 && lastDot === -1) {
    // Only comma: treat as decimal separator (1234,56)
    const normalized = cleaned.replace(",", ".");
    numericValue = parseFloat(normalized);
  } else if (lastDot !== -1 && lastComma === -1) {
    // Only dot: treat as decimal separator (1234.56)
    numericValue = parseFloat(cleaned);
  } else {
    // No separator: integer
    numericValue = parseFloat(cleaned);
  }

  if (isNaN(numericValue)) return null;

  const cents = Math.round(Math.abs(numericValue) * 100);
  return { cents, negative: negative || numericValue < 0 };
}

/**
 * Parses a date string trying multiple formats: DD/MM/YYYY, YYYY-MM-DD, MM/DD/YYYY.
 * Returns YYYY-MM-DD or null.
 */
function parseDate(raw: string): string | null {
  const cleaned = raw.trim();

  // Try DD/MM/YYYY or DD-MM-YYYY
  const brMatch = cleaned.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})$/);
  if (brMatch) {
    const day = parseInt(brMatch[1], 10);
    const month = parseInt(brMatch[2], 10);
    const year = parseInt(brMatch[3], 10);

    // If first number > 12, it must be DD/MM/YYYY
    if (day > 12 && month <= 12) {
      return formatISODate(year, month, day);
    }

    // Default: treat as DD/MM/YYYY (Brazilian standard)
    if (day <= 31 && month <= 12) {
      return formatISODate(year, month, day);
    }

    // Fallback: try MM/DD/YYYY
    if (month <= 31 && day <= 12) {
      return formatISODate(year, day, month);
    }
  }

  // Try YYYY-MM-DD or YYYY/MM/DD
  const isoMatch = cleaned.match(/^(\d{4})[/\-.](\d{1,2})[/\-.](\d{1,2})$/);
  if (isoMatch) {
    const year = parseInt(isoMatch[1], 10);
    const month = parseInt(isoMatch[2], 10);
    const day = parseInt(isoMatch[3], 10);
    return formatISODate(year, month, day);
  }

  return null;
}

function formatISODate(year: number, month: number, day: number): string | null {
  if (year < 1900 || year > 2100 || month < 1 || month > 12 || day < 1 || day > 31) {
    return null;
  }
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/**
 * Determines transaction type from a type column value.
 */
function parseType(raw: string): "receita" | "despesa" | null {
  const lower = raw.trim().toLowerCase();

  const incomePatterns = ["receita", "cr\u00e9dito", "credito", "credit", "c", "income", "entrada"];
  const expensePatterns = ["despesa", "d\u00e9bito", "debito", "debit", "d", "expense", "sa\u00edda", "saida"];

  if (incomePatterns.includes(lower)) return "receita";
  if (expensePatterns.includes(lower)) return "despesa";
  return null;
}

/**
 * Parses CSV content using the provided column mapping.
 * headerRowIndex indicates which line (after filtering empties) is the header.
 */
export function parseCSV(content: string, mapping: CSVColumnMapping, headerRowIndex = 0): CSVParseResult {
  const errors: string[] = [];

  if (!content || content.length === 0) {
    return { success: false, transactions: [], errors: ["Arquivo vazio."] };
  }

  if (content.length > MAX_FILE_SIZE) {
    return { success: false, transactions: [], errors: ["Arquivo excede o limite de 5MB."] };
  }

  const lines = content
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length < headerRowIndex + 2) {
    return {
      success: false,
      transactions: [],
      errors: ["Arquivo deve ter pelo menos um cabeçalho e uma linha de dados."],
    };
  }

  const delimiter = detectDelimiter(lines[headerRowIndex]);
  const dataLines = lines.slice(headerRowIndex + 1); // Skip metadata + header
  const transactions: ParsedTransaction[] = [];

  for (let i = 0; i < dataLines.length; i++) {
    const fields = splitCSVLine(dataLines[i], delimiter);
    const lineNum = i + 2; // 1-indexed, +1 for header

    // Extract date
    const dateRaw = fields[mapping.date];
    if (!dateRaw || dateRaw.trim().length === 0) {
      errors.push(`Linha ${lineNum}: coluna de data vazia, ignorada.`);
      continue;
    }

    const date = parseDate(dateRaw);
    if (!date) {
      errors.push(`Linha ${lineNum}: data inv\u00e1lida "${dateRaw}", ignorada.`);
      continue;
    }

    // Extract amount
    const amountRaw = fields[mapping.amount];
    if (!amountRaw || amountRaw.trim().length === 0) {
      errors.push(`Linha ${lineNum}: coluna de valor vazia, ignorada.`);
      continue;
    }

    const amount = parseAmount(amountRaw);
    if (!amount) {
      errors.push(`Linha ${lineNum}: valor inv\u00e1lido "${amountRaw}", ignorado.`);
      continue;
    }

    // Extract description
    const description = (fields[mapping.description] || "Sem descri\u00e7\u00e3o").trim();

    // Determine type
    let type: "receita" | "despesa";

    if (mapping.type !== undefined && fields[mapping.type]) {
      const parsedType = parseType(fields[mapping.type]);
      if (parsedType) {
        type = parsedType;
      } else {
        // Fallback to sign if type column value not recognized
        type = amount.negative ? "despesa" : "receita";
      }
    } else {
      type = amount.negative ? "despesa" : "receita";
    }

    transactions.push({
      date,
      amount_cents: amount.cents,
      type,
      description,
    });
  }

  return {
    success: transactions.length > 0,
    transactions,
    errors,
  };
}
