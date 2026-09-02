import { describe, it, expect } from "vitest";
import {
  isValidTaxId,
  isValidCellphone,
  isValidCreci,
  isValidRegistrationEmail,
  validateRegistrationFields,
} from "@/lib/user-validation";

describe("isValidTaxId", () => {
  // ── Happy path ──────────────────────────────────────────────
  it("accepts a valid CPF (formatted)", () => {
    expect(isValidTaxId("529.982.247-25")).toBe(true);
  });

  it("accepts a valid CPF (digits only)", () => {
    expect(isValidTaxId("52998224725")).toBe(true);
  });

  it("accepts a valid CNPJ (formatted)", () => {
    expect(isValidTaxId("11.222.333/0001-81")).toBe(true);
  });

  // ── Edge cases ──────────────────────────────────────────────
  it("rejects repeated-digit CPF (111...) even though length matches", () => {
    expect(isValidTaxId("111.111.111-11")).toBe(false);
  });

  it("rejects a number with the wrong length", () => {
    expect(isValidTaxId("12345")).toBe(false);
  });

  // ── Failure (bot garbage) ───────────────────────────────────
  it("rejects a hash / random alphanumeric string", () => {
    expect(isValidTaxId("a3f9c8e1b27d4f0a9c8e1b27d4f0a9c8")).toBe(false);
  });

  it("rejects a CPF that fails the check digit", () => {
    expect(isValidTaxId("529.982.247-24")).toBe(false);
  });
});

describe("isValidCellphone", () => {
  // ── Happy path ──────────────────────────────────────────────
  it("accepts a formatted BR mobile number", () => {
    expect(isValidCellphone("(11) 99999-9999")).toBe(true);
  });

  it("accepts a digits-only BR mobile number", () => {
    expect(isValidCellphone("11999999999")).toBe(true);
  });

  it("accepts a number with the 55 country code", () => {
    expect(isValidCellphone("+55 (21) 98888-7777")).toBe(true);
  });

  // ── Edge cases ──────────────────────────────────────────────
  it("rejects a landline (no leading 9 on the subscriber number)", () => {
    expect(isValidCellphone("(11) 3333-4444")).toBe(false);
  });

  it("rejects an invalid DDD", () => {
    expect(isValidCellphone("(00) 99999-9999")).toBe(false);
  });

  // ── Failure (bot garbage) ───────────────────────────────────
  it("rejects a hash / random string", () => {
    expect(isValidCellphone("a3f9c8e1b27d4f0a")).toBe(false);
  });

  it("rejects repeated digits", () => {
    expect(isValidCellphone("99999999999")).toBe(false);
  });
});

describe("isValidCreci", () => {
  // ── Happy path ──────────────────────────────────────────────
  it("accepts a plain numeric CRECI", () => {
    expect(isValidCreci("123456")).toBe(true);
  });

  it("accepts a CRECI with an F suffix", () => {
    expect(isValidCreci("123456-F")).toBe(true);
  });

  it("accepts a CRECI with state and prefix", () => {
    expect(isValidCreci("CRECI-SP 12345-J")).toBe(true);
  });

  // ── Edge cases ──────────────────────────────────────────────
  it("rejects an empty string", () => {
    expect(isValidCreci("")).toBe(false);
  });

  it("rejects a number that is too short", () => {
    expect(isValidCreci("12")).toBe(false);
  });

  // ── Failure (bot garbage) ───────────────────────────────────
  it("rejects a hash / random alphanumeric string", () => {
    expect(isValidCreci("a3f9c8e1b27d4f0a9c8e1b27d4f0a9c8")).toBe(false);
  });
});

describe("isValidRegistrationEmail", () => {
  // ── Happy path ──────────────────────────────────────────────
  it("accepts a normal email", () => {
    expect(isValidRegistrationEmail("joao.silva@gmail.com")).toBe(true);
  });

  it("accepts a business email", () => {
    expect(isValidRegistrationEmail("contato@imobiliaria.com.br")).toBe(true);
  });

  // ── Edge cases ──────────────────────────────────────────────
  it("rejects a malformed email", () => {
    expect(isValidRegistrationEmail("not-an-email")).toBe(false);
  });

  it("rejects a domain without a TLD", () => {
    expect(isValidRegistrationEmail("user@localhost")).toBe(false);
  });

  // ── Failure (disposable / throwaway) ────────────────────────
  it("rejects a known disposable domain", () => {
    expect(isValidRegistrationEmail("bot@mailinator.com")).toBe(false);
  });

  it("rejects another disposable domain regardless of case", () => {
    expect(isValidRegistrationEmail("bot@YOPMAIL.COM")).toBe(false);
  });
});

describe("validateRegistrationFields", () => {
  // ── Happy path ──────────────────────────────────────────────
  it("returns ok when all provided fields are valid", () => {
    const result = validateRegistrationFields({
      cellphone: "(11) 99999-9999",
      taxId: "529.982.247-25",
      creci: "123456-F",
    });
    expect(result).toEqual({ ok: true });
  });

  // ── Edge cases ──────────────────────────────────────────────
  it("skips fields that are undefined", () => {
    const result = validateRegistrationFields({ creci: "123456" });
    expect(result).toEqual({ ok: true });
  });

  it("skips empty strings (field not being set)", () => {
    const result = validateRegistrationFields({ cellphone: "", taxId: "" });
    expect(result).toEqual({ ok: true });
  });

  // ── Failure ─────────────────────────────────────────────────
  it("reports the offending field when taxId is a hash", () => {
    const result = validateRegistrationFields({
      taxId: "a3f9c8e1b27d4f0a",
      cellphone: "(11) 99999-9999",
    });
    expect(result).toEqual({
      ok: false,
      field: "taxId",
      message: expect.any(String),
    });
  });

  it("reports cellphone when it is invalid", () => {
    const result = validateRegistrationFields({
      cellphone: "a3f9c8e1b27d4f0a",
    });
    expect(result).toMatchObject({ ok: false, field: "cellphone" });
  });

  it("reports creci when it is invalid", () => {
    const result = validateRegistrationFields({ creci: "###garbage###" });
    expect(result).toMatchObject({ ok: false, field: "creci" });
  });
});
