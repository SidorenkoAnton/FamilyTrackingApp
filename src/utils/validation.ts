const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function isValidEmail(value: string): boolean {
  return EMAIL_PATTERN.test(value.trim());
}

export function normalizeEmail(value: string): string {
  return value.trim();
}

/** Returns a user-facing error string, or null when the value is valid. */
export function validateEmail(value: string): string | null {
  if (!value.trim()) return 'Введите email';
  if (!isValidEmail(value)) return 'Похоже, в email опечатка';
  return null;
}

export function validatePassword(value: string): string | null {
  if (!value) return 'Введите пароль';
  if (value.length < 6) return 'Минимум 6 символов';
  return null;
}

export function validateName(value: string): string | null {
  if (!value.trim()) return 'Введите имя';
  if (value.trim().length < 2) return 'Имя слишком короткое';
  return null;
}

export function validateGroupName(value: string): string | null {
  if (!value.trim()) return 'Введите название группы';
  if (value.trim().length < 2) return 'Название слишком короткое';
  if (value.trim().length > 60) return 'Не больше 60 символов';
  return null;
}

export function normalizeInviteCode(value: string): string {
  return value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
}
