import { describe, it, expect } from "vitest";
import { extractTokens, buildSuggestionIndex } from "./category-suggestion";

describe("extractTokens", () => {
  it("extrai 2 primeiras palavras normalizadas", () => {
    expect(extractTokens("UBER*TRIP 123ABC")).toEqual(["uber", "trip"]);
    expect(extractTokens("SUPERMERCADO EXTRA 21/04")).toEqual(["supermercado", "extra"]);
    expect(extractTokens("IFD*IFOOD 456")).toEqual(["ifd", "ifood"]);
  });

  it("ignora palavras de 1 char", () => {
    expect(extractTokens("A B CAFE")).toEqual(["cafe"]);
  });

  it("preserva acentos do português", () => {
    expect(extractTokens("PADARIA AÇÃO")).toEqual(["padaria", "ação"]);
  });

  it("retorna array vazio para string vazia ou só números", () => {
    expect(extractTokens("")).toEqual([]);
    expect(extractTokens("123 456")).toEqual([]);
  });

  it("respeita o limite de maxTokens", () => {
    expect(extractTokens("ABC DEF GHI JKL", 3)).toEqual(["abc", "def", "ghi"]);
  });
});

describe("buildSuggestionIndex", () => {
  it("sugere categoria quando há 2+ matches de 2 tokens + mesmo type", () => {
    const history = [
      { description: "UBER TRIP 111", category_id: "cat-transp", type: "despesa" as const },
      { description: "UBER TRIP 222", category_id: "cat-transp", type: "despesa" as const },
      { description: "UBER TRIP 333", category_id: "cat-transp", type: "despesa" as const },
    ];
    const idx = buildSuggestionIndex(history);
    expect(idx.lookup("UBER TRIP 999", "despesa")).toBe("cat-transp");
  });

  it("não sugere quando score < 2 em match estrito", () => {
    const history = [
      { description: "UBER TRIP 111", category_id: "cat-transp", type: "despesa" as const },
    ];
    const idx = buildSuggestionIndex(history);
    expect(idx.lookup("UBER TRIP 999", "despesa")).toBe(null);
  });

  it("usa fallback de 1 token quando score >= 3", () => {
    const history = [
      { description: "IFD MERCADINHO", category_id: "cat-ali", type: "despesa" as const },
      { description: "IFD RESTAURANTE", category_id: "cat-ali", type: "despesa" as const },
      { description: "IFD PIZZARIA", category_id: "cat-ali", type: "despesa" as const },
    ];
    const idx = buildSuggestionIndex(history);
    // 3 entradas com token "ifd" apontando para cat-ali → fallback 1-token passa
    expect(idx.lookup("IFD NOVO LUGAR", "despesa")).toBe("cat-ali");
  });

  it("não cruza despesa com receita", () => {
    const history = [
      { description: "SALARIO EMPRESA", category_id: "cat-sal", type: "receita" as const },
      { description: "SALARIO EMPRESA", category_id: "cat-sal", type: "receita" as const },
    ];
    const idx = buildSuggestionIndex(history);
    // mesma descrição, mas procurando como despesa, não deve retornar
    expect(idx.lookup("SALARIO EMPRESA", "despesa")).toBe(null);
    expect(idx.lookup("SALARIO EMPRESA", "receita")).toBe("cat-sal");
  });

  it("ignora histórico sem category_id", () => {
    const history = [
      { description: "UBER TRIP", category_id: null, type: "despesa" as const },
      { description: "UBER TRIP", category_id: null, type: "despesa" as const },
    ];
    const idx = buildSuggestionIndex(history);
    expect(idx.lookup("UBER TRIP", "despesa")).toBe(null);
  });

  it("ignora transferências", () => {
    const history = [
      { description: "PIX PAGTO", category_id: "cat-x", type: "transferencia" as const },
      { description: "PIX PAGTO", category_id: "cat-x", type: "transferencia" as const },
    ];
    const idx = buildSuggestionIndex(history);
    expect(idx.lookup("PIX PAGTO", "despesa")).toBe(null);
  });

  it("retorna categoria mais frequente quando há conflito", () => {
    const history = [
      { description: "MERCADO DIA", category_id: "cat-ali", type: "despesa" as const },
      { description: "MERCADO DIA", category_id: "cat-ali", type: "despesa" as const },
      { description: "MERCADO DIA", category_id: "cat-outro", type: "despesa" as const },
    ];
    const idx = buildSuggestionIndex(history);
    expect(idx.lookup("MERCADO DIA", "despesa")).toBe("cat-ali");
  });
});
