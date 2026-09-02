/**
 * Formats a numeric value as Brazilian Real (BRL) currency.
 *
 * @example
 * formatPrice(250000)        // "R$ 250.000,00"
 * formatPrice(1500.5)        // "R$ 1.500,50"
 * formatPrice(null)          // "Consultar valor"
 * formatPrice(null, { fallback: "—" }) // "—"
 * formatPrice(47, { cents: false })   // "R$ 47"
 */

interface FormatPriceOptions {
  /** Text returned when value is null/undefined/0. Defaults to "Consultar valor". */
  fallback?: string;
  /** Whether to always show two decimal places. Defaults to true. */
  cents?: boolean;
}

export function formatPrice(
  value: number | string | null | undefined,
  options: FormatPriceOptions = {},
): string {
  const { fallback = "Consultar valor", cents = true } = options;

  const num = typeof value === "string" ? Number(value) : value;

  if (num == null || isNaN(num as number) || (num as number) <= 0) {
    return fallback;
  }

  return (num as number).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: cents ? 2 : 0,
    maximumFractionDigits: cents ? 2 : 0,
  });
}
