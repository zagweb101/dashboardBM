/**
 * Input sanitization utilities.
 */

/** Maximum field lengths */
export const MAX_LENGTHS = {
  name: 255,
  email: 320,
  phone: 20,
  notes: 2000,
  address: 500,
  city: 100,
  title: 255,
  description: 5000,
  url: 2048,
  nationalId: 10,
  code: 50,
} as const;

/** Strip potential XSS vectors from user input (basic — not a sanitizer replacement) */
export function sanitizeInput(value: string): string {
  return value
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .trim();
}

/** Validate that a string does not exceed maxLength */
export function assertMaxLength(
  value: string,
  maxLength: number,
  fieldName: string,
): string | null {
  if (value.length > maxLength) {
    return `${fieldName} must be at most ${maxLength} characters`;
  }
  return null;
}

/** Validate multiple fields at once. Returns first error or null. */
export function validateFieldLengths(
  fields: Array<{ value: string; max: number; name: string }>,
): string | null {
  for (const field of fields) {
    const error = assertMaxLength(field.value, field.max, field.name);
    if (error) return error;
  }
  return null;
}
