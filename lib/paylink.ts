// lib/paylink.ts
import crypto from 'crypto';

export function createPlainToken(len = 32) {
    return crypto.randomBytes(len).toString('base64url'); // URL-safe
}
export function hashToken(token: string) {
    return crypto.createHash('sha256').update(token).digest('hex');
}
