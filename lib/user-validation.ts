// Validation for user-supplied identity fields collected at registration.
// Goal: reject bot garbage (hashes, random strings, throwaway emails) while
// letting real values through. Pure functions so they can be unit-tested and
// reused on both the better-auth sign-up hook and the /api/user PATCH route.

function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

function allSameDigit(digits: string): boolean {
  return /^(\d)\1+$/.test(digits);
}

// ── Tax ID (CPF / CNPJ) ───────────────────────────────────────

function isValidCpf(digits: string): boolean {
  if (digits.length !== 11 || allSameDigit(digits)) return false;

  const checkDigit = (length: number): number => {
    let sum = 0;
    let weight = length + 1;
    for (let i = 0; i < length; i++) {
      sum += Number(digits[i]) * weight;
      weight--;
    }
    const remainder = sum % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  };

  return (
    checkDigit(9) === Number(digits[9]) && checkDigit(10) === Number(digits[10])
  );
}

function isValidCnpj(digits: string): boolean {
  if (digits.length !== 14 || allSameDigit(digits)) return false;

  const checkDigit = (length: number): number => {
    let sum = 0;
    let weight = length - 7;
    for (let i = 0; i < length; i++) {
      sum += Number(digits[i]) * weight;
      weight = weight === 2 ? 9 : weight - 1;
    }
    const remainder = sum % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  };

  return (
    checkDigit(12) === Number(digits[12]) &&
    checkDigit(13) === Number(digits[13])
  );
}

export function isValidTaxId(value: string): boolean {
  const digits = onlyDigits(value);
  if (digits.length === 11) return isValidCpf(digits);
  if (digits.length === 14) return isValidCnpj(digits);
  return false;
}

// ── Cellphone (Brazilian mobile) ──────────────────────────────

// Valid DDDs (area codes) in Brazil. 11–99 with a number of gaps.
const VALID_DDDS = new Set([
  11, 12, 13, 14, 15, 16, 17, 18, 19, 21, 22, 24, 27, 28, 31, 32, 33, 34, 35,
  37, 38, 41, 42, 43, 44, 45, 46, 47, 48, 49, 51, 53, 54, 55, 61, 62, 63, 64,
  65, 66, 67, 68, 69, 71, 73, 74, 75, 77, 79, 81, 82, 83, 84, 85, 86, 87, 88,
  89, 91, 92, 93, 94, 95, 96, 97, 98, 99,
]);

export function isValidCellphone(value: string): boolean {
  let digits = onlyDigits(value);

  // Drop an optional 55 country code.
  if (digits.length === 13 && digits.startsWith("55")) {
    digits = digits.slice(2);
  }

  // Mobile numbers are 11 digits: DDD (2) + 9 + 8 subscriber digits.
  if (digits.length !== 11) return false;
  if (allSameDigit(digits)) return false;

  const ddd = Number(digits.slice(0, 2));
  if (!VALID_DDDS.has(ddd)) return false;

  // The 9th digit (first of the subscriber number) is always 9 for mobiles.
  return digits[2] === "9";
}

// ── CRECI ─────────────────────────────────────────────────────

// Optional "CRECI" label, optional UF, a 3–8 digit registration number and an
// optional F (física) / J (jurídica) suffix. Rejects hash-like strings.
const CRECI_RE = /^(CRECI[-/\s]?)?([A-Z]{2}[-/\s]?)?\d{3,8}([-/\s]?[FJ])?$/;

export function isValidCreci(value: string): boolean {
  const normalized = value.trim().toUpperCase();
  if (!normalized) return false;
  return CRECI_RE.test(normalized);
}

// ── Email (format + disposable-domain block) ──────────────────

const EMAIL_RE =
  /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?)+$/;

const DISPOSABLE_EMAIL_DOMAINS = new Set([
  "mailinator.com",
  "yopmail.com",
  "guerrillamail.com",
  "guerrillamail.info",
  "sharklasers.com",
  "10minutemail.com",
  "tempmail.com",
  "temp-mail.org",
  "trashmail.com",
  "getnada.com",
  "dispostable.com",
  "maildrop.cc",
  "throwawaymail.com",
  "fakeinbox.com",
  "mailnesia.com",
  "mohmal.com",
  "emailondeck.com",
]);

export function isValidRegistrationEmail(value: string): boolean {
  const email = value.trim();
  if (!EMAIL_RE.test(email)) return false;

  const domain = email.slice(email.lastIndexOf("@") + 1).toLowerCase();
  if (DISPOSABLE_EMAIL_DOMAINS.has(domain)) return false;

  return true;
}

// ── Combined registration check ───────────────────────────────

export type RegistrationFieldsResult =
  | { ok: true }
  | { ok: false; field: "cellphone" | "taxId" | "creci"; message: string };

export function validateRegistrationFields(input: {
  cellphone?: string | null;
  taxId?: string | null;
  creci?: string | null;
}): RegistrationFieldsResult {
  const { cellphone, taxId, creci } = input;

  if (taxId && !isValidTaxId(taxId)) {
    return {
      ok: false,
      field: "taxId",
      message: "CPF ou CNPJ inválido.",
    };
  }

  if (cellphone && !isValidCellphone(cellphone)) {
    return {
      ok: false,
      field: "cellphone",
      message: "Número de celular inválido.",
    };
  }

  if (creci && !isValidCreci(creci)) {
    return {
      ok: false,
      field: "creci",
      message: "CRECI inválido.",
    };
  }

  return { ok: true };
}
