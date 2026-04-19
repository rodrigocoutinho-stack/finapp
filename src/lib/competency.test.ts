import { describe, it, expect } from "vitest";
import {
  deriveCompetencyMonth,
  getEffectiveCompetency,
  toCompetencyLabel,
  buildCompetencyOrFilter,
} from "./competency";

describe("deriveCompetencyMonth", () => {
  it("closing_day=1 — sempre usa o mês calendário", () => {
    expect(deriveCompetencyMonth("2026-04-01", 1)).toBe("2026-04");
    expect(deriveCompetencyMonth("2026-04-30", 1)).toBe("2026-04");
  });

  it("closing_day=10 — dia 15/mai cai em competência de maio", () => {
    // competência maio = 10/mai a 9/jun
    expect(deriveCompetencyMonth("2026-05-15", 10)).toBe("2026-05");
  });

  it("closing_day=10 — dia 09/mai cai em competência de abril", () => {
    // competência abril = 10/abr a 9/mai
    expect(deriveCompetencyMonth("2026-05-09", 10)).toBe("2026-04");
  });

  it("closing_day=10 — dia 10/abr cai em competência de abril", () => {
    expect(deriveCompetencyMonth("2026-04-10", 10)).toBe("2026-04");
  });

  it("virada de ano com closing_day>1", () => {
    // closing_day=10: 05/jan/2027 → competência dez/2026 (10/dez a 9/jan)
    expect(deriveCompetencyMonth("2027-01-05", 10)).toBe("2026-12");
  });
});

describe("getEffectiveCompetency", () => {
  it("retorna o override quando presente", () => {
    // date seria maio, mas override força abril
    expect(getEffectiveCompetency("2026-05-15", "2026-04", 10)).toBe("2026-04");
  });

  it("deriva quando override é null", () => {
    expect(getEffectiveCompetency("2026-05-15", null, 10)).toBe("2026-05");
  });

  it("deriva quando override é string vazia (tratado como null)", () => {
    // null-ish → cai na derivação
    expect(getEffectiveCompetency("2026-05-15", "", 10)).toBe("2026-05");
  });
});

describe("toCompetencyLabel", () => {
  it("formata YYYY-MM com mês 0-based", () => {
    expect(toCompetencyLabel(2026, 0)).toBe("2026-01");
    expect(toCompetencyLabel(2026, 3)).toBe("2026-04");
    expect(toCompetencyLabel(2026, 11)).toBe("2026-12");
  });
});

describe("buildCompetencyOrFilter", () => {
  it("produz a cláusula OR correta para PostgREST", () => {
    const filter = buildCompetencyOrFilter("2026-04", "2026-04-10", "2026-05-09");
    expect(filter).toBe(
      "competency_month.eq.2026-04,and(competency_month.is.null,date.gte.2026-04-10,date.lte.2026-05-09)"
    );
  });
});
