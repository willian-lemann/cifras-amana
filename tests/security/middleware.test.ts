import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import path from "path";

const ROOT = path.resolve(__dirname, "../..");
// Next.js 16 renamed middleware.ts → proxy.ts. proxy.ts is the single entrypoint.
const PROXY_SRC = readFileSync(path.join(ROOT, "proxy.ts"), "utf-8");

describe("Centralized Security Proxy (B9)", () => {
  // ─── Structure ──────────────────────────────────────────────────────────────

  it("exports a proxy function", () => {
    expect(PROXY_SRC).toMatch(/export\s+async\s+function\s+proxy/);
  });

  it("exports a config with a route matcher", () => {
    expect(PROXY_SRC).toMatch(/export\s+const\s+config/);
    expect(PROXY_SRC).toMatch(/matcher/);
  });

  // ─── CORS ───────────────────────────────────────────────────────────────────

  it("defines ALLOWED_ORIGINS from env", () => {
    expect(PROXY_SRC).toMatch(/ALLOWED_ORIGINS/);
  });

  it("includes NEXT_PUBLIC_APP_URL in allowed origins", () => {
    expect(PROXY_SRC).toMatch(/process\.env\.NEXT_PUBLIC_APP_URL/);
  });

  it("sets Access-Control-Allow-Origin for allowed origins", () => {
    expect(PROXY_SRC).toMatch(/Access-Control-Allow-Origin/);
  });

  it("sets Access-Control-Allow-Methods header", () => {
    expect(PROXY_SRC).toMatch(/Access-Control-Allow-Methods/);
    expect(PROXY_SRC).toMatch(/GET.*POST.*PUT.*DELETE.*PATCH/);
  });

  it("sets Access-Control-Allow-Headers header", () => {
    expect(PROXY_SRC).toMatch(/Access-Control-Allow-Headers/);
    expect(PROXY_SRC).toMatch(/Content-Type.*Authorization/);
  });

  // ─── Preflight ──────────────────────────────────────────────────────────────

  it("handles OPTIONS preflight with 204 for allowed origins", () => {
    expect(PROXY_SRC).toMatch(/req\.method\s*===\s*["']OPTIONS["']/);
    expect(PROXY_SRC).toMatch(/\?\s*204\s*:\s*403/);
  });

  it("returns 403 for preflight from unknown origins", () => {
    expect(PROXY_SRC).toMatch(/:\s*403/);
  });

  // ─── Scope ──────────────────────────────────────────────────────────────────

  it("matcher excludes Next internals and static-file paths", () => {
    expect(PROXY_SRC).toMatch(/_next/);
    expect(PROXY_SRC).toMatch(/_vercel/);
    expect(PROXY_SRC).toMatch(/well-known/);
  });

  it("matcher pattern is not a blanket wildcard", () => {
    expect(PROXY_SRC).not.toMatch(/matcher.*"\/\*"/);
    expect(PROXY_SRC).not.toMatch(/matcher.*"\/:path\*"/);
  });
});
