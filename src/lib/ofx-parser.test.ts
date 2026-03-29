import { describe, it, expect } from "vitest";
import { parseOFX } from "./ofx-parser";

const VALID_OFX = `OFXHEADER:100
<OFX>
<BANKMSGSRSV1>
<STMTTRNRS>
<BANKTRANLIST>
<STMTTRN>
<TRNTYPE>DEBIT
<DTPOSTED>20260315
<TRNAMT>-150.50
<MEMO>Supermercado Extra
</STMTTRN>
<STMTTRN>
<TRNTYPE>CREDIT
<DTPOSTED>20260301120000
<TRNAMT>5000.00
<NAME>Salário
</STMTTRN>
</BANKTRANLIST>
</STMTTRNRS>
</BANKMSGSRSV1>
</OFX>`;

const CREDIT_CARD_OFX = `<OFX>
<CREDITCARDMSGSRSV1>
<STMTTRNRS>
<BANKTRANLIST>
<STMTTRN>
<TRNTYPE>DEBIT
<DTPOSTED>20260310
<TRNAMT>-89.90
<MEMO>iFood
</STMTTRN>
</BANKTRANLIST>
</STMTTRNRS>
</CREDITCARDMSGSRSV1>
</OFX>`;

describe("parseOFX", () => {
  it("returns error for empty content", () => {
    const result = parseOFX("");
    expect(result.success).toBe(false);
    expect(result.errors[0]).toContain("vazio");
  });

  it("returns error for file exceeding 5MB", () => {
    const huge = "x".repeat(6 * 1024 * 1024);
    const result = parseOFX(huge);
    expect(result.success).toBe(false);
    expect(result.errors[0]).toContain("5MB");
  });

  it("returns error for content without transactions", () => {
    const result = parseOFX("<OFX><BANKMSGSRSV1></BANKMSGSRSV1></OFX>");
    expect(result.success).toBe(false);
    expect(result.errors[0]).toContain("Nenhuma transação");
  });

  it("parses bank statement correctly", () => {
    const result = parseOFX(VALID_OFX);
    expect(result.success).toBe(true);
    expect(result.transactions).toHaveLength(2);

    const debit = result.transactions[0];
    expect(debit.date).toBe("2026-03-15");
    expect(debit.amount_cents).toBe(15050);
    expect(debit.type).toBe("despesa");
    expect(debit.description).toBe("Supermercado Extra");

    const credit = result.transactions[1];
    expect(credit.date).toBe("2026-03-01");
    expect(credit.amount_cents).toBe(500000);
    expect(credit.type).toBe("receita");
    expect(credit.description).toBe("Salário");
  });

  it("parses credit card statement", () => {
    const result = parseOFX(CREDIT_CARD_OFX);
    expect(result.success).toBe(true);
    expect(result.transactions).toHaveLength(1);
    expect(result.transactions[0].amount_cents).toBe(8990);
    expect(result.transactions[0].type).toBe("despesa");
  });

  it("skips transactions without DTPOSTED", () => {
    const ofx = `<OFX><BANKMSGSRSV1><BANKTRANLIST>
<STMTTRN><TRNAMT>-100.00<MEMO>No date</STMTTRN>
<STMTTRN><DTPOSTED>20260310<TRNAMT>-50.00<MEMO>Has date</STMTTRN>
</BANKTRANLIST></BANKMSGSRSV1></OFX>`;
    const result = parseOFX(ofx);
    expect(result.transactions).toHaveLength(1);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain("DTPOSTED");
  });

  it("skips transactions without TRNAMT", () => {
    const ofx = `<OFX><BANKMSGSRSV1><BANKTRANLIST>
<STMTTRN><DTPOSTED>20260310<MEMO>No amount</STMTTRN>
</BANKTRANLIST></BANKMSGSRSV1></OFX>`;
    const result = parseOFX(ofx);
    expect(result.transactions).toHaveLength(0);
    expect(result.errors[0]).toContain("TRNAMT");
  });

  it("handles OFX date with timezone brackets", () => {
    const ofx = `<OFX><BANKMSGSRSV1><BANKTRANLIST>
<STMTTRN><DTPOSTED>20260315120000[-3:BRT]<TRNAMT>-100.00<MEMO>Test</STMTTRN>
</BANKTRANLIST></BANKMSGSRSV1></OFX>`;
    const result = parseOFX(ofx);
    expect(result.transactions[0].date).toBe("2026-03-15");
  });

  it("uses MEMO over NAME, falls back to 'Sem descrição'", () => {
    const ofx = `<OFX><BANKMSGSRSV1><BANKTRANLIST>
<STMTTRN><DTPOSTED>20260310<TRNAMT>-10.00<MEMO>Memo text<NAME>Name text</STMTTRN>
<STMTTRN><DTPOSTED>20260311<TRNAMT>-20.00<NAME>Only name</STMTTRN>
<STMTTRN><DTPOSTED>20260312<TRNAMT>-30.00</STMTTRN>
</BANKTRANLIST></BANKMSGSRSV1></OFX>`;
    const result = parseOFX(ofx);
    expect(result.transactions[0].description).toBe("Memo text");
    expect(result.transactions[1].description).toBe("Only name");
    expect(result.transactions[2].description).toBe("Sem descrição");
  });

  it("handles amount with comma (European format)", () => {
    const ofx = `<OFX><BANKMSGSRSV1><BANKTRANLIST>
<STMTTRN><DTPOSTED>20260310<TRNAMT>-100,50<MEMO>Test</STMTTRN>
</BANKTRANLIST></BANKMSGSRSV1></OFX>`;
    const result = parseOFX(ofx);
    expect(result.transactions[0].amount_cents).toBe(10050);
  });

  it("warns about unrecognized format but still parses", () => {
    const ofx = `<OFX><BANKTRANLIST>
<STMTTRN><DTPOSTED>20260310<TRNAMT>-50.00<MEMO>Unknown format</STMTTRN>
</BANKTRANLIST></OFX>`;
    const result = parseOFX(ofx);
    expect(result.success).toBe(true);
    expect(result.errors.some((e) => e.includes("não reconhecido"))).toBe(true);
  });

  it("handles case-insensitive OFX tags", () => {
    const ofx = `header
<ofx>
<BANKMSGSRSV1>
<BANKTRANLIST>
<STMTTRN>
<DTPOSTED>20260310
<TRNAMT>-25.00
<MEMO>Lowercase OFX tag
</STMTTRN>
</BANKTRANLIST>
</BANKMSGSRSV1>
</ofx>`;
    const result = parseOFX(ofx);
    expect(result.success).toBe(true);
    expect(result.transactions).toHaveLength(1);
  });
});
