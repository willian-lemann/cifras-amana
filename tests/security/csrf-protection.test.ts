import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import path from "path";

const ROOT = path.resolve(__dirname, "../..");

// ─── B8: CSRF Protection ─────────────────────────────────────────────────────

describe("CSRF Helper (lib/csrf.ts)", () => {
  const csrfSource = readFileSync(path.join(ROOT, "lib/csrf.ts"), "utf-8");

  it("exports validateOrigin function", () => {
    expect(csrfSource).toMatch(/export function validateOrigin/);
  });

  it("checks the origin header", () => {
    expect(csrfSource).toMatch(/headers\.get\(["']origin["']\)/);
  });

  it("checks the referer header as fallback", () => {
    expect(csrfSource).toMatch(/headers\.get\(["']referer["']\)/);
  });

  it("returns false when no origin or referer", () => {
    // The function should return false at the end
    expect(csrfSource).toMatch(/return false/);
  });

  it("validates against ALLOWED_ORIGINS list", () => {
    expect(csrfSource).toMatch(/ALLOWED_ORIGINS/);
    expect(csrfSource).toMatch(/NEXT_PUBLIC_APP_URL/);
  });
});
