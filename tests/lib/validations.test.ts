import { describe, it, expect } from "vitest";
import { signUpSchema, signInSchema } from "@/lib/validations";

describe("signUpSchema", () => {
  it("accepts valid input", () => {
    const result = signUpSchema.safeParse({
      name: "João Silva",
      email: "joao@example.com",
      password: "12345678",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a name shorter than 2 characters", () => {
    const result = signUpSchema.safeParse({
      name: "J",
      email: "joao@example.com",
      password: "12345678",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid email", () => {
    const result = signUpSchema.safeParse({
      name: "João Silva",
      email: "not-an-email",
      password: "12345678",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a password shorter than 8 characters", () => {
    const result = signUpSchema.safeParse({
      name: "João Silva",
      email: "joao@example.com",
      password: "123",
    });
    expect(result.success).toBe(false);
  });
});

describe("signInSchema", () => {
  it("accepts valid credentials", () => {
    const result = signInSchema.safeParse({
      email: "joao@example.com",
      password: "any-password",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid email", () => {
    const result = signInSchema.safeParse({
      email: "nope",
      password: "any-password",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an empty password", () => {
    const result = signInSchema.safeParse({
      email: "joao@example.com",
      password: "",
    });
    expect(result.success).toBe(false);
  });
});
