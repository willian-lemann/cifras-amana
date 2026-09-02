import { describe, it, expect } from "vitest";
import { formatPrice } from "@/lib/format-price";

describe("formatPrice", () => {
  // ── Happy path ──────────────────────────────────────────────
  it("formats a whole number as BRL currency", () => {
    const result = formatPrice(250000);
    expect(result).toContain("250.000");
    expect(result).toContain("R$");
  });

  it("formats a decimal number with cents", () => {
    const result = formatPrice(1500.5);
    expect(result).toContain("1.500");
    expect(result).toContain("50");
  });

  it("formats a small integer value", () => {
    const result = formatPrice(47);
    expect(result).toContain("47");
    expect(result).toContain("R$");
  });

  it("formats a string number correctly", () => {
    const result = formatPrice("500000");
    expect(result).toContain("500.000");
    expect(result).toContain("R$");
  });

  // ── cents option ────────────────────────────────────────────
  it("removes decimal places when cents is false", () => {
    const result = formatPrice(47, { cents: false });
    expect(result).toContain("R$");
    expect(result).not.toContain(",00");
  });

  it("always shows two decimal places when cents is true (default)", () => {
    const result = formatPrice(100);
    expect(result).toMatch(/,00/);
  });

  // ── Fallback / null / undefined ─────────────────────────────
  it('returns "Consultar valor" for null', () => {
    expect(formatPrice(null)).toBe("Consultar valor");
  });

  it('returns "Consultar valor" for undefined', () => {
    expect(formatPrice(undefined)).toBe("Consultar valor");
  });

  it('returns "Consultar valor" for 0', () => {
    expect(formatPrice(0)).toBe("Consultar valor");
  });

  it("returns custom fallback when provided", () => {
    expect(formatPrice(null, { fallback: "—" })).toBe("—");
  });

  it("returns custom fallback for negative number", () => {
    expect(formatPrice(-100, { fallback: "N/A" })).toBe("N/A");
  });

  // ── Edge cases ──────────────────────────────────────────────
  it("returns fallback for NaN string input", () => {
    expect(formatPrice("abc")).toBe("Consultar valor");
  });

  it("returns fallback for negative values", () => {
    expect(formatPrice(-500)).toBe("Consultar valor");
  });

  it("returns fallback for empty string", () => {
    expect(formatPrice("")).toBe("Consultar valor");
  });

  it("handles very large numbers", () => {
    const result = formatPrice(999999999.99);
    expect(result).toContain("R$");
    expect(result).toContain("999.999.999");
  });

  it("handles very small positive numbers", () => {
    const result = formatPrice(0.01);
    expect(result).toContain("R$");
    expect(result).toContain("0,01");
  });
});
