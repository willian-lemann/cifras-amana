import { describe, it, expect } from "vitest";
import { readFileSync, existsSync, readdirSync, type Dirent } from "fs";
import path from "path";

const ROOT = path.resolve(__dirname, "../..");

// ─── A1: Auth Cookie Configuration ───────────────────────────────────────────

describe("Auth Cookie Configuration (A1)", () => {
  const authSource = readFileSync(path.join(ROOT, "lib/auth.ts"), "utf-8");

  it("sets httpOnly: true on cookies", () => {
    expect(authSource).toMatch(/httpOnly:\s*true/);
  });

  it("sets secure flag based on production env", () => {
    expect(authSource).toMatch(
      /secure:\s*process\.env\.NODE_ENV\s*===\s*["']production["']/,
    );
  });

  it("sets sameSite to lax or strict", () => {
    expect(authSource).toMatch(/sameSite:\s*["'](lax|strict)["']/);
  });

  it("uses a cookie prefix", () => {
    expect(authSource).toMatch(/cookiePrefix:/);
  });

  it("defines trustedOrigins", () => {
    expect(authSource).toMatch(/trustedOrigins/);
  });
});

// ─── A2: No Hardcoded Secrets in Source ──────────────────────────────────────

describe("No Hardcoded Secrets (A2)", () => {
  const sourceFiles = [
    "lib/auth.ts",
    "lib/ai.ts",
    "lib/r2.ts",
    "lib/prisma.ts",
    "lib/subscription.ts",
    "lib/auth-client.ts",
  ];

  const secretPatterns = [
    { name: "Stripe live key", pattern: /sk_live_[a-zA-Z0-9]{10,}/ },
    { name: "Stripe test key literal", pattern: /sk_test_[a-zA-Z0-9]{10,}/ },
    { name: "OpenAI key", pattern: /sk-proj-[a-zA-Z0-9]{10,}/ },
    { name: "AWS access key", pattern: /AKIA[0-9A-Z]{12,}/ },
    {
      name: "PostgreSQL connection string",
      pattern: /postgresql:\/\/[^"'\s]+:[^"'\s]+@[^"'\s]+/,
    },
  ];

  for (const file of sourceFiles) {
    const filePath = path.join(ROOT, file);
    if (!existsSync(filePath)) continue;
    const content = readFileSync(filePath, "utf-8");

    for (const { name, pattern } of secretPatterns) {
      it(`${file} does not contain ${name}`, () => {
        expect(content).not.toMatch(pattern);
      });
    }
  }
});

// ─── A3: .gitignore Coverage ─────────────────────────────────────────────────

describe(".gitignore Coverage (A3)", () => {
  const gitignore = readFileSync(path.join(ROOT, ".gitignore"), "utf-8");

  it("ignores .env files", () => {
    expect(gitignore).toMatch(/\.env\*/);
  });

  it("ignores node_modules", () => {
    expect(gitignore).toMatch(/node_modules/);
  });

  it("ignores .next build output", () => {
    expect(gitignore).toMatch(/\.next/);
  });

  it("ignores .pem private keys", () => {
    expect(gitignore).toMatch(/\*\.pem/);
  });

  it("ignores certificates directory", () => {
    expect(gitignore).toMatch(/certificates/);
  });
});

// ─── A4: No SQL Injection via Raw Queries ────────────────────────────────────

describe("No SQL Injection via Raw Queries (A4)", () => {
  const apiDir = path.join(ROOT, "app/api");

  function collectTsFiles(dir: string): string[] {
    const results: string[] = [];
    const entries = readdirSync(dir, { withFileTypes: true }) as Dirent[];
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        results.push(...collectTsFiles(fullPath));
      } else if (entry.name.endsWith(".ts") || entry.name.endsWith(".tsx")) {
        results.push(fullPath);
      }
    }
    return results;
  }

  const apiFiles = collectTsFiles(apiDir);

  it("no API route uses $queryRawUnsafe", () => {
    for (const file of apiFiles) {
      const content = readFileSync(file, "utf-8");
      expect(
        content,
        `Found $queryRawUnsafe in ${path.relative(ROOT, file)}`,
      ).not.toMatch(/\$queryRawUnsafe/);
    }
  });

  it("no API route uses $executeRawUnsafe", () => {
    for (const file of apiFiles) {
      const content = readFileSync(file, "utf-8");
      expect(
        content,
        `Found $executeRawUnsafe in ${path.relative(ROOT, file)}`,
      ).not.toMatch(/\$executeRawUnsafe/);
    }
  });

  it("no API route uses SQL string concatenation in db calls", () => {
    // Matches actual unsafe DB calls like: db.query(`SELECT ... ${var}`)
    const sqlConcatPattern =
      /(?:query|execute)\s*\(\s*`[^`]*(?:SELECT|INSERT|UPDATE|DELETE)\s[^`]*\$\{/i;

    for (const file of apiFiles) {
      const content = readFileSync(file, "utf-8");
      expect(
        content,
        `Found SQL concatenation in ${path.relative(ROOT, file)}`,
      ).not.toMatch(sqlConcatPattern);
    }
  });
});

// ─── A6: Security Headers ───────────────────────────────────────────────────

describe("Security Headers (A6)", () => {
  const nextConfig = readFileSync(path.join(ROOT, "next.config.ts"), "utf-8");
  const headersConfig = readFileSync(
    path.join(ROOT, "lib/next-config/headers.ts"),
    "utf-8",
  );

  it("sets X-Frame-Options to DENY", () => {
    expect(headersConfig).toMatch(/X-Frame-Options.*DENY/);
  });

  it("sets X-Content-Type-Options to nosniff", () => {
    expect(headersConfig).toMatch(/X-Content-Type-Options.*nosniff/);
  });

  it("sets Strict-Transport-Security with long max-age", () => {
    expect(headersConfig).toMatch(/Strict-Transport-Security/);
    expect(headersConfig).toMatch(/max-age=\d{7,}/);
  });

  it("sets Referrer-Policy", () => {
    expect(headersConfig).toMatch(/Referrer-Policy/);
  });

  it("sets Permissions-Policy restricting sensitive APIs", () => {
    expect(headersConfig).toMatch(/Permissions-Policy/);
    expect(headersConfig).toMatch(/camera=\(\)/);
    expect(headersConfig).toMatch(/microphone=\(\)/);
  });

  it("applies headers to all routes", () => {
    expect(nextConfig).toMatch(/source:\s*["']\/\(\.\*\)["']/);
  });

  it("sets Content-Security-Policy", () => {
    expect(headersConfig).toMatch(/Content-Security-Policy/);
  });

  it("CSP blocks object embeds", () => {
    expect(headersConfig).toMatch(/object-src\s+'none'/);
  });

  it("CSP restricts base-uri", () => {
    expect(headersConfig).toMatch(/base-uri\s+'self'/);
  });

  it("CSP enforces upgrade-insecure-requests", () => {
    expect(headersConfig).toMatch(/upgrade-insecure-requests/);
  });
});

// ─── B12: Source Maps Disabled in Production ─────────────────────────────────

describe("Source Maps Disabled in Production (B12)", () => {
  const nextConfig = readFileSync(path.join(ROOT, "next.config.ts"), "utf-8");

  it("explicitly disables productionBrowserSourceMaps", () => {
    expect(nextConfig).toMatch(/productionBrowserSourceMaps:\s*false/);
  });
});

// ─── A14: No localStorage for Auth Tokens ───────────────────────────────────

describe("No localStorage for Auth Tokens (A14)", () => {
  const libDir = path.join(ROOT, "lib");
  const hooksDir = path.join(ROOT, "hooks");

  function readAllTs(dir: string): { file: string; content: string }[] {
    if (!existsSync(dir)) return [];
    const results: { file: string; content: string }[] = [];
    const entries = readdirSync(dir, { withFileTypes: true }) as Dirent[];
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        results.push(...readAllTs(fullPath));
      } else if (entry.name.endsWith(".ts") || entry.name.endsWith(".tsx")) {
        results.push({
          file: fullPath,
          content: readFileSync(fullPath, "utf-8"),
        });
      }
    }
    return results;
  }

  const allFiles = [...readAllTs(libDir), ...readAllTs(hooksDir)];

  it("no lib/hooks file stores auth tokens in localStorage", () => {
    const tokenStoragePattern =
      /localStorage\.setItem\s*\(\s*["'](?:auth|token|session|access_token|refresh_token)/i;
    for (const { file, content } of allFiles) {
      expect(
        content,
        `Found localStorage token storage in ${path.relative(ROOT, file)}`,
      ).not.toMatch(tokenStoragePattern);
    }
  });
});

// ─── A15: Env Var Validation at Startup ─────────────────────────────────────

describe("Env Var Validation (A15)", () => {
  const validateEnv = readFileSync(
    path.join(ROOT, "lib/validate-env.ts"),
    "utf-8",
  );

  const requiredVars = [
    "DATABASE_URL",
    "BETTER_AUTH_SECRET",
    "STRIPE_SECRET_KEY",
    "STRIPE_WEBHOOK_SECRET",
    "R2_ACCOUNT_ID",
    "R2_ACCESS_KEY_ID",
    "R2_SECRET_ACCESS_KEY",
    "R2_BUCKET_NAME",
    "R2_PUBLIC_URL",
    "OPENAI_API_KEY",
  ];

  for (const envVar of requiredVars) {
    it(`validates ${envVar} is required`, () => {
      expect(validateEnv).toContain(`"${envVar}"`);
    });
  }

  it("throws on missing env vars", () => {
    expect(validateEnv).toMatch(/throw new Error/);
  });

  it("validates DATABASE_URL format", () => {
    expect(validateEnv).toMatch(/postgresql:\/\//);
  });

  it("warns about Stripe test key in production", () => {
    expect(validateEnv).toMatch(/sk_test_/);
  });
});
