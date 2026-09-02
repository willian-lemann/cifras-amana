import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Reads the error message from a failed API response and throws it.
 * Falls back to `fallback` if the body cannot be parsed.
 */
export async function throwApiError(
  res: Response,
  fallback: string,
): Promise<never> {
  try {
    const body = await res.json();
    throw new Error(body?.error || body?.message || fallback);
  } catch (e) {
    if (e instanceof SyntaxError) throw new Error(fallback);
    throw e;
  }
}
