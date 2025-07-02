/**
 * Valide et parse une variable d'environnement en nombre entier
 * @param envValue Valeur de la variable d'environnement
 * @param defaultValue Valeur par défaut si parsing échoue
 * @param min Valeur minimale acceptée
 * @param max Valeur maximale acceptée
 * @returns Nombre entier validé
 */
export function parseEnvInt(
  envValue: string | undefined,
  defaultValue: number,
  min: number = 1,
  max: number = Number.MAX_SAFE_INTEGER,
): number {
  if (!envValue) {
    return defaultValue;
  }

  const parsed = parseInt(envValue, 10);

  if (isNaN(parsed)) {
    console.warn(
      `Invalid environment variable value: ${envValue}, using default: ${defaultValue}`,
    );
    return defaultValue;
  }

  if (parsed < min || parsed > max) {
    console.warn(
      `Environment variable value ${parsed} out of range [${min}, ${max}], using default: ${defaultValue}`,
    );
    return defaultValue;
  }

  return parsed;
}

/**
 * Valide et nettoie une clé de rate limiting
 * @param input Chaîne d'entrée à nettoyer
 * @param maxLength Longueur maximale de la clé
 * @returns Chaîne nettoyée et sécurisée
 */
export function sanitizeRateLimitKey(
  input: string,
  maxLength: number = 64,
): string {
  if (!input) {
    return 'anonymous';
  }

  const sanitized = input
    .replace(/[^a-zA-Z0-9._@-]/g, '_')
    .substring(0, maxLength);

  return sanitized || 'anonymous';
}

/**
 * Encode une chaîne en base64url de manière efficace
 * @param input Chaîne à encoder
 * @returns Chaîne encodée en base64url
 */
export function encodeBase64Url(input: string): string {
  if (!input) {
    return '';
  }

  const bytes = new TextEncoder().encode(input);
  const base64 = btoa(String.fromCharCode(...bytes));

  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}
