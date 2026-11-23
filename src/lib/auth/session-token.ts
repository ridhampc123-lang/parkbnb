import crypto from 'crypto';
import { UserRole } from '@/types/database';

export interface SessionPayload {
  sub: string; // User ID
  phone?: string | null;
  name?: string;
  role: UserRole;
  iat: number;
  exp: number;
  jti: string; // Unique session ID
}

const SESSION_SECRET =
  process.env.SESSION_SECRET ||
  process.env.SUPABASE_SECRET_KEY ||
  process.env.CRON_SECRET ||
  'parkbnb-auth-sec-k9x7v2-salt-2026-production-hmac';

/**
 * Base64URL encode buffer/string
 */
function base64UrlEncode(str: string): string {
  return Buffer.from(str)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

/**
 * Base64URL decode string
 */
function base64UrlDecode(str: string): string {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) {
    str += '=';
  }
  return Buffer.from(str, 'base64').toString('utf8');
}

/**
 * Signs a cryptographic session token using HMAC-SHA256
 */
export function signSessionToken(
  payload: Omit<SessionPayload, 'iat' | 'exp' | 'jti'> & {
    expiresInSeconds?: number;
    jti?: string;
  }
): { token: string; payload: SessionPayload } {
  const iat = Math.floor(Date.now() / 1000);
  const expiresIn = payload.expiresInSeconds || 60 * 60 * 24 * 30; // 30 days persistent
  const exp = iat + expiresIn;
  const jti = payload.jti || crypto.randomUUID();

  const fullPayload: SessionPayload = {
    sub: payload.sub,
    phone: payload.phone || null,
    name: payload.name || '',
    role: payload.role,
    iat,
    exp,
    jti,
  };

  const headerStr = JSON.stringify({ alg: 'HS256', typ: 'JWT' });
  const payloadStr = JSON.stringify(fullPayload);

  const encodedHeader = base64UrlEncode(headerStr);
  const encodedPayload = base64UrlEncode(payloadStr);

  const signature = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  const token = `${encodedHeader}.${encodedPayload}.${signature}`;
  return { token, payload: fullPayload };
}

/**
 * Cryptographically verifies session token with constant-time HMAC check & expiration
 */
export function verifySessionToken(token: string): SessionPayload | null {
  if (!token || typeof token !== 'string') return null;

  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const [encodedHeader, encodedPayload, signature] = parts;

  // Recompute HMAC signature
  const expectedSignature = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  const sigBuffer = Buffer.from(signature);
  const expectedSigBuffer = Buffer.from(expectedSignature);

  if (sigBuffer.length !== expectedSigBuffer.length) {
    return null;
  }

  // Constant-time signature verification to prevent timing attacks
  if (!crypto.timingSafeEqual(sigBuffer, expectedSigBuffer)) {
    return null;
  }

  try {
    const payloadStr = base64UrlDecode(encodedPayload);
    const payload = JSON.parse(payloadStr) as SessionPayload;

    const now = Math.floor(Date.now() / 1000);
    // Expiration check
    if (payload.exp && payload.exp < now) {
      return null;
    }

    if (!payload.sub || !payload.role) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

/**
 * Creates a SHA-256 hash of a session token for revocation lookup
 */
export function hashSessionToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Hashes an OTP with phone-salted HMAC to avoid plaintext storage
 */
export function hashOtp(phone: string, otp: string): string {
  const salt = `otp-salt-${phone.trim()}`;
  return crypto.createHmac('sha256', salt).update(otp.trim()).digest('hex');
}

/**
 * Verifies OTP using constant-time comparison
 */
export function verifyOtpHash(phone: string, otp: string, expectedHash: string): boolean {
  const actualHash = hashOtp(phone, otp);
  const actualBuf = Buffer.from(actualHash, 'hex');
  const expectedBuf = Buffer.from(expectedHash, 'hex');

  if (actualBuf.length !== expectedBuf.length) {
    return false;
  }

  return crypto.timingSafeEqual(actualBuf, expectedBuf);
}
