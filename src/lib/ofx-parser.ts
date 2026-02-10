export interface ParsedTransaction {
  date: string;
  amount_cents: number;
  type: "receita" | "despesa";
  description: string;
}

export interface OFXParseResult {
  success: boolean;
  transactions: ParsedTransaction[];
  errors: string[];
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

/**
 * Parses an OFX date string (YYYYMMDD or YYYYMMDDHHMMSS) to YYYY-MM-DD.
 */
function parseOFXDate(raw: string): string {
  const clean = raw.trim().replace(/\[.*\]/, "");
  const y = clean.substring(0, 4);
  const m = clean.substring(4, 6);
  const d = clean.substring(6, 8);
  return `${y}-${m}-${d}`;
}

/**
 * Extracts text content between SGML-style tags.
 * Handles both <TAG>value and <TAG>value</TAG>.
 */
function extractTag(block: string, tag: string): string | null {
  const regex = new RegExp(`<${tag}>([^<\\r\\n]+)`, "i");
  const match = block.match(regex);
  return match ? match[1].trim() : null;
}

/**
 * Strips the OFX SGML header (everything before the first <OFX> tag)
 * and normalizes the content for easier parsing.
 */
function preprocessOFX(content: string): string {
  const ofxStart = content.indexOf("<OFX>");
  if (ofxStart === -1) {
    const ofxStartLower = content.toLowerCase().indexOf("<ofx>");
    if (ofxStartLower === -1) {
      return content;
    }
    return content.substring(ofxStartLower);
  }
  return content.substring(ofxStart);
}

/**
 * Extracts all STMTTRN blocks from the OFX content.
 */
function extractTransactionBlocks(content: string): string[] {
  const blocks: string[] = [];
  const upperContent = content.toUpperCase();
  let searchFrom = 0;

  while (true) {
    const start = upperContent.indexOf("<STMTTRN>", searchFrom);
    if (start === -1) break;

    const end = upperContent.indexOf("</STMTTRN>", start);
    if (end === -1) {
      // Some OFX files don't close STMTTRN — find next STMTTRN or BANKTRANLIST close
      const nextStart = upperContent.indexOf("<STMTTRN>", start + 9);
      const listEnd = upperContent.indexOf("</BANKTRANLIST>", start);
      const blockEnd = nextStart !== -1
        ? nextStart
        : listEnd !== -1
          ? listEnd
          : content.length;
      blocks.push(content.substring(start, blockEnd));
      searchFrom = blockEnd;
    } else {
      blocks.push(content.substring(start, end + "</STMTTRN>".length));
      searchFrom = end + "</STMTTRN>".length;
    }
  }

  return blocks;
}

/**
 * Parses OFX/QFX file content and returns structured transactions.
 * Supports both bank statements (BANKMSGSRSV1) and credit card statements (CREDITCARDMSGSRSV1).
 */
export function parseOFX(content: string): OFXParseResult {
  const errors: string[] = [];

  if (!content || content.length === 0) {
    return { success: false, transactions: [], errors: ["Arquivo vazio."] };
  }

  if (content.length > MAX_FILE_SIZE) {
    return { success: false, transactions: [], errors: ["Arquivo excede o limite de 5MB."] };
  }

  const processed = preprocessOFX(content);
  const upperProcessed = processed.toUpperCase();

  if (!upperProcessed.includes("<STMTTRN>")) {
    return {
      success: false,
      transactions: [],
      errors: ["Nenhuma transação encontrada no arquivo OFX."],
    };
  }

  const isBank = upperProcessed.includes("<BANKMSGSRSV1>");
  const isCreditCard = upperProcessed.includes("<CREDITCARDMSGSRSV1>");

  if (!isBank && !isCreditCard) {
    errors.push(
      "Formato OFX não reconhecido (esperado BANKMSGSRSV1 ou CREDITCARDMSGSRSV1). Tentando extrair transações mesmo assim."
    );
  }

  const blocks = extractTransactionBlocks(processed);
  const transactions: ParsedTransaction[] = [];

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];

    const dateRaw = extractTag(block, "DTPOSTED");
    const amountRaw = extractTag(block, "TRNAMT");
    const memo = extractTag(block, "MEMO");
    const name = extractTag(block, "NAME");

    if (!dateRaw) {
      errors.push(`Transação ${i + 1}: data (DTPOSTED) não encontrada, ignorada.`);
      continue;
    }

    if (!amountRaw) {
      errors.push(`Transação ${i + 1}: valor (TRNAMT) não encontrado, ignorada.`);
      continue;
    }

    const date = parseOFXDate(dateRaw);
    const amountFloat = parseFloat(amountRaw.replace(",", "."));

    if (isNaN(amountFloat)) {
      errors.push(`Transação ${i + 1}: valor inválido "${amountRaw}", ignorada.`);
      continue;
    }

    const isExpense = amountFloat < 0;
    const amountCents = Math.round(Math.abs(amountFloat) * 100);
    const description = (memo || name || "Sem descrição").trim();

    transactions.push({
      date,
      amount_cents: amountCents,
      type: isExpense ? "despesa" : "receita",
      description,
    });
  }

  return {
    success: transactions.length > 0,
    transactions,
    errors,
  };
}
