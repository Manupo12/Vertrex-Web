/**
 * Normaliza un nombre de usuario de Telegram.
 * Quita el símbolo '@', urls de t.me, parámetros de búsqueda,
 * y valida que cumpla con los caracteres permitidos (letras, números y guión bajo).
 */
export function normalizeTelegramUsername(raw: string): string {
  if (!raw) return "";
  let clean = raw.trim();

  // Eliminar URL de Telegram si se proporciona completa
  if (clean.includes("t.me/")) {
    clean = clean.substring(clean.lastIndexOf("t.me/") + 5);
  }

  // Quitar el '@' inicial si existe
  if (clean.startsWith("@")) {
    clean = clean.substring(1);
  }

  // Quitar parámetros query si vienen de una URL de compartir
  if (clean.includes("?")) {
    clean = clean.split("?")[0];
  }

  clean = clean.toLowerCase();

  // Las reglas de Telegram exigen entre 3 y 32 caracteres (letras, números y _)
  const isValid = /^[a-z0-9_]{3,32}$/.test(clean);
  return isValid ? clean : "";
}

/**
 * Devuelve la mención formateada con '@' si el usuario tiene telegramUsername configurado.
 * Si no lo tiene, devuelve su nombre en texto plano.
 */
export function mentionFor(user: { name: string; telegramUsername: string | null }): string {
  if (user.telegramUsername) {
    return `@${user.telegramUsername}`;
  }
  return user.name;
}
