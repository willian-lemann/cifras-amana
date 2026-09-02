import { describe, it, expect } from "vitest";
import { cn } from "@/lib/utils";

describe("cn (class name utility)", () => {
  it("merges multiple class names", () => {
    expect(cn("px-4", "py-2")).toBe("px-4 py-2");
  });

  it("resolves conflicting Tailwind classes (last wins)", () => {
    expect(cn("px-4", "px-8")).toBe("px-8");
  });

  it("handles conditional classes via clsx syntax", () => {
    const isActive = true;
    expect(cn("base", isActive && "active")).toBe("base active");
  });

  it("filters falsy values", () => {
    expect(cn("base", false, null, undefined, "extra")).toBe("base extra");
  });

  it("returns empty string for no inputs", () => {
    expect(cn()).toBe("");
  });

  it("merges object-style class names", () => {
    expect(cn({ hidden: true, flex: false })).toBe("hidden");
  });

  it("handles array inputs", () => {
    expect(cn(["px-2", "py-2"])).toBe("px-2 py-2");
  });
});
