import { createHmac, timingSafeEqual } from 'crypto';
import { UnauthorizedException } from '@nestjs/common';

const SIGNATURE_TTL_SECONDS = 300;

export function canonicalJson(payload: unknown): string {
  return JSON.stringify(sortObject(payload));
}

export function verifyInternalSignature(headers: Record<string, unknown>, body: unknown): void {
  const secret = process.env.LUMAX_INTERNAL_SECRET;
  if (!secret) {
    return;
  }

  const timestamp = getHeader(headers, 'x-lumax-timestamp');
  const nonce = getHeader(headers, 'x-lumax-nonce');
  const signature = getHeader(headers, 'x-lumax-signature');
  if (!timestamp || !nonce || !signature) {
    throw new UnauthorizedException('Missing internal signature headers');
  }

  const timestampSeconds = Number(timestamp);
  if (!Number.isFinite(timestampSeconds)) {
    throw new UnauthorizedException('Invalid internal signature timestamp');
  }
  const nowSeconds = Math.floor(Date.now() / 1000);
  if (Math.abs(nowSeconds - timestampSeconds) > SIGNATURE_TTL_SECONDS) {
    throw new UnauthorizedException('Expired internal signature');
  }

  const signedPayload = `${timestamp}.${nonce}.${canonicalJson(body)}`;
  const expected = createHmac('sha256', secret).update(signedPayload, 'utf8').digest('hex');
  if (!safeEqual(signature, expected)) {
    throw new UnauthorizedException('Invalid internal signature');
  }
}

function getHeader(headers: Record<string, unknown>, name: string): string {
  const direct = headers[name] ?? headers[name.toLowerCase()] ?? headers[name.toUpperCase()];
  const value = Array.isArray(direct) ? direct[0] : direct;
  return typeof value === 'string' ? value : '';
}

function sortObject(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortObject);
  }
  if (value && typeof value === 'object') {
    return Object.keys(value as Record<string, unknown>)
      .sort()
      .reduce<Record<string, unknown>>((acc, key) => {
        acc[key] = sortObject((value as Record<string, unknown>)[key]);
        return acc;
      }, {});
  }
  return value;
}

function safeEqual(actual: string, expected: string): boolean {
  const actualBuffer = Buffer.from(actual, 'utf8');
  const expectedBuffer = Buffer.from(expected, 'utf8');
  return actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer);
}
