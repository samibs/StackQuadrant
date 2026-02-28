type ValidationError = { field: string; message: string };

const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function validateString(
  value: unknown,
  field: string,
  { min = 1, max = 500, required = true }: { min?: number; max?: number; required?: boolean } = {}
): ValidationError | null {
  if (value === undefined || value === null || value === "") {
    return required ? { field, message: `${field} is required` } : null;
  }
  if (typeof value !== "string") return { field, message: `${field} must be a string` };
  if (value.length < min) return { field, message: `${field} must be at least ${min} characters` };
  if (value.length > max) return { field, message: `${field} must be at most ${max} characters` };
  return null;
}

export function validateSlug(value: unknown, field = "slug"): ValidationError | null {
  const strErr = validateString(value, field, { max: 100 });
  if (strErr) return strErr;
  if (!SLUG_REGEX.test(value as string)) {
    return { field, message: "Slug must contain only lowercase letters, numbers, and hyphens" };
  }
  return null;
}

export function validateUrl(value: unknown, field: string): ValidationError | null {
  if (!value) return null; // optional
  if (typeof value !== "string") return { field, message: `${field} must be a string` };
  if (value.length > 2000) return { field, message: `${field} is too long` };
  try {
    new URL(value);
    return null;
  } catch {
    return { field, message: `${field} must be a valid URL` };
  }
}

export function validateNumber(
  value: unknown,
  field: string,
  { min = 0, max = 10, required = false }: { min?: number; max?: number; required?: boolean } = {}
): ValidationError | null {
  if (value === undefined || value === null) {
    return required ? { field, message: `${field} is required` } : null;
  }
  const num = Number(value);
  if (isNaN(num)) return { field, message: `${field} must be a number` };
  if (num < min || num > max) return { field, message: `${field} must be between ${min} and ${max}` };
  return null;
}

export function validateEnum(
  value: unknown,
  field: string,
  allowed: string[],
  { required = false }: { required?: boolean } = {}
): ValidationError | null {
  if (!value) return required ? { field, message: `${field} is required` } : null;
  if (typeof value !== "string" || !allowed.includes(value)) {
    return { field, message: `${field} must be one of: ${allowed.join(", ")}` };
  }
  return null;
}

export function collectErrors(...results: (ValidationError | null)[]): ValidationError[] {
  return results.filter((r): r is ValidationError => r !== null);
}
