import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import path from "path";

const ROOT = path.resolve(__dirname, "../..");

// ─── A12: Upload Validation ─────────────────────────────────────────────────

describe("Upload File Type Validation (A12)", () => {
  const uploadRoute = readFileSync(
    path.join(ROOT, "app/api/upload/route.ts"),
    "utf-8",
  );

  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/avif",
    "image/gif",
    "video/mp4",
    "video/quicktime",
    "video/webm",
  ];

  it("defines an explicit ALLOWED_TYPES whitelist", () => {
    expect(uploadRoute).toMatch(/ALLOWED_TYPES\s*=\s*\[/);
  });

  for (const type of allowedTypes) {
    it(`allows ${type}`, () => {
      expect(uploadRoute).toContain(`"${type}"`);
    });
  }

  const dangerousTypes = [
    "image/svg+xml",
    "application/javascript",
    "text/html",
    "application/x-php",
    "application/x-executable",
    "application/x-sh",
  ];

  for (const type of dangerousTypes) {
    it(`does NOT allow dangerous type: ${type}`, () => {
      expect(uploadRoute).not.toContain(`"${type}"`);
    });
  }

  it("validates file type against the whitelist", () => {
    expect(uploadRoute).toMatch(/ALLOWED_TYPES\.includes\(file\.type\)/);
  });
});

describe("Upload File Size Limits (A12)", () => {
  const uploadRoute = readFileSync(
    path.join(ROOT, "app/api/upload/route.ts"),
    "utf-8",
  );

  it("sets MAX_IMAGE_SIZE to 10MB or less", () => {
    const match = uploadRoute.match(
      /MAX_IMAGE_SIZE\s*=\s*(\d+)\s*\*\s*1024\s*\*\s*1024/,
    );
    expect(match).not.toBeNull();
    const sizeMB = parseInt(match![1]);
    expect(sizeMB).toBeLessThanOrEqual(10);
  });

  it("sets MAX_VIDEO_SIZE", () => {
    expect(uploadRoute).toMatch(/MAX_VIDEO_SIZE\s*=/);
  });

  it("checks file size before upload", () => {
    expect(uploadRoute).toMatch(/file\.size\s*>\s*maxSize/);
  });

  it("limits files per request to 30 or less", () => {
    expect(uploadRoute).toMatch(/files\.length\s*>\s*30/);
  });
});

describe("Upload Filename Sanitization (A12)", () => {
  const uploadRoute = readFileSync(
    path.join(ROOT, "app/api/upload/route.ts"),
    "utf-8",
  );

  it("converts filenames to lowercase", () => {
    expect(uploadRoute).toMatch(/\.toLowerCase\(\)/);
  });

  it("removes special characters from filename", () => {
    expect(uploadRoute).toMatch(/\.replace\(\/\[/);
  });

  it("limits filename length", () => {
    expect(uploadRoute).toMatch(/\.slice\(0,\s*\d+\)/);
  });
});

describe("Upload Authentication (A12)", () => {
  const uploadRoute = readFileSync(
    path.join(ROOT, "app/api/upload/route.ts"),
    "utf-8",
  );

  it("requires authentication", () => {
    expect(uploadRoute).toMatch(/auth\.api\.getSession/);
  });

  it("requires active subscription plan", () => {
    expect(uploadRoute).toMatch(/requireActivePlan/);
  });

  it("scopes uploads to user directory", () => {
    expect(uploadRoute).toMatch(/session\.user\.id/);
  });

  it("validates ownership on delete", () => {
    expect(uploadRoute).toMatch(/userPrefix/);
  });
});
