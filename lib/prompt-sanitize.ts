/**
 * Prompt injection protection for AI endpoints.
 * Sanitizes user input before interpolation into LLM prompts.
 */

/** Strip control characters, collapse whitespace, enforce length limit. */
export function sanitizeForPrompt(input: string, maxLength = 500): string {
  return input
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "") // strip control chars
    .replace(/\n{3,}/g, "\n\n") // collapse excessive newlines
    .slice(0, maxLength);
}

/** Common prompt injection patterns. */
const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|prior|above)\s+(instructions?|prompts?)/i,
  /you\s+are\s+now\s+/i,
  /system\s*:\s*/i,
  /\[INST\]/i,
  /<<SYS>>/i,
  /forget\s+(everything|all|your)/i,
  /new\s+instructions?\s*:/i,
  /do\s+not\s+follow/i,
];

/** Returns true if the input contains suspicious prompt injection patterns. */
export function detectInjection(input: string): boolean {
  return INJECTION_PATTERNS.some((p) => p.test(input));
}
