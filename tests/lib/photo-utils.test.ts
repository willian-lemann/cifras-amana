import { describe, it, expect } from "vitest";
import { reorderPhotos, getCoverPhoto, clampToLimit } from "@/lib/photo-utils";

// ═══════════════════════════════════════════════════════════════
//  Photo ordering — drag-and-drop reorder + first photo is the cover
// ═══════════════════════════════════════════════════════════════

describe("reorderPhotos", () => {
  // ── Happy path ────────────────────────────────────────────
  it("moves a photo to the front, making it the new cover", () => {
    const result = reorderPhotos(["a", "b", "c", "d"], 2, 0);
    expect(result).toEqual(["c", "a", "b", "d"]);
    expect(getCoverPhoto(result)).toBe("c");
  });

  it("moves the first photo to the end", () => {
    expect(reorderPhotos(["a", "b", "c"], 0, 2)).toEqual(["b", "c", "a"]);
  });

  it("returns a new array (does not mutate the input)", () => {
    const input = ["a", "b", "c"];
    const result = reorderPhotos(input, 0, 1);
    expect(result).not.toBe(input);
    expect(input).toEqual(["a", "b", "c"]);
  });

  // ── Edge cases ────────────────────────────────────────────
  it("is a no-op when source and target are the same", () => {
    expect(reorderPhotos(["a", "b", "c"], 1, 1)).toEqual(["a", "b", "c"]);
  });

  it("returns the list unchanged when an index is out of range", () => {
    expect(reorderPhotos(["a", "b"], 5, 0)).toEqual(["a", "b"]);
    expect(reorderPhotos(["a", "b"], 0, -1)).toEqual(["a", "b"]);
  });

  it("handles an empty list", () => {
    expect(reorderPhotos([], 0, 0)).toEqual([]);
  });
});

describe("getCoverPhoto", () => {
  it("returns the first photo as the cover", () => {
    expect(getCoverPhoto(["cover", "b", "c"])).toBe("cover");
  });

  it("returns an empty string when there are no photos", () => {
    expect(getCoverPhoto([])).toBe("");
  });
});

// ═══════════════════════════════════════════════════════════════
//  Upload limit — accept up to `max` photos, report the overflow
// ═══════════════════════════════════════════════════════════════

describe("clampToLimit", () => {
  // ── Happy path ────────────────────────────────────────────
  it("accepts everything when under the limit", () => {
    const result = clampToLimit(5, ["a", "b", "c"], 40);
    expect(result.accepted).toEqual(["a", "b", "c"]);
    expect(result.rejectedCount).toBe(0);
  });

  it("accepts the exact amount that fills the limit", () => {
    const result = clampToLimit(38, ["a", "b"], 40);
    expect(result.accepted).toEqual(["a", "b"]);
    expect(result.rejectedCount).toBe(0);
  });

  // ── Over the limit ────────────────────────────────────────
  it("accepts only what fits and reports the rest as rejected", () => {
    const result = clampToLimit(38, ["a", "b", "c", "d", "e"], 40);
    expect(result.accepted).toEqual(["a", "b"]);
    expect(result.rejectedCount).toBe(3);
  });

  it("rejects everything when already at the limit", () => {
    const result = clampToLimit(40, ["a", "b", "c"], 40);
    expect(result.accepted).toEqual([]);
    expect(result.rejectedCount).toBe(3);
  });

  // ── Edge cases ────────────────────────────────────────────
  it("rejects everything when already over the limit", () => {
    const result = clampToLimit(45, ["a"], 40);
    expect(result.accepted).toEqual([]);
    expect(result.rejectedCount).toBe(1);
  });

  it("handles an empty incoming list", () => {
    const result = clampToLimit(10, [], 40);
    expect(result.accepted).toEqual([]);
    expect(result.rejectedCount).toBe(0);
  });
});
