const MIN_JWT_SECRET_LENGTH = 32;
const FORBIDDEN_SECRETS = new Set(['replace_this_in_prod']);

let cachedSecret: string | undefined;

export function getJwtSecret(): string {
  if (cachedSecret) return cachedSecret;

  const secret = process.env.JWT_SECRET?.trim() ?? '';
  if (
    !secret ||
    FORBIDDEN_SECRETS.has(secret) ||
    secret.length < MIN_JWT_SECRET_LENGTH
  ) {
    throw new Error(
      'JWT_SECRET must be set to a unique value of at least 32 characters (not the default placeholder).'
    );
  }

  cachedSecret = secret;
  return cachedSecret;
}

export function assertJwtSecretConfigured(): void {
  getJwtSecret();
}
