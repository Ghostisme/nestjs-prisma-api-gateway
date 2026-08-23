import { createHmac } from 'crypto';
import { canonicalJson, verifyInternalSignature } from './internal-signature.util';

describe('internal signature util', () => {
  const originalSecret = process.env.LUMAX_INTERNAL_SECRET;

  afterEach(() => {
    process.env.LUMAX_INTERNAL_SECRET = originalSecret;
  });

  it('canonicalizes payload keys recursively', () => {
    expect(canonicalJson({ b: 1, a: { d: 2, c: 3 } })).toBe('{"a":{"c":3,"d":2},"b":1}');
  });

  it('verifies valid HMAC signature', () => {
    process.env.LUMAX_INTERNAL_SECRET = 'secret';
    const body = { userId: 2, tenantId: 1 };
    const timestamp = String(Math.floor(Date.now() / 1000));
    const nonce = 'nonce';
    const signature = createHmac('sha256', 'secret')
      .update(`${timestamp}.${nonce}.${canonicalJson(body)}`, 'utf8')
      .digest('hex');

    expect(() =>
      verifyInternalSignature(
        {
          'x-lumax-timestamp': timestamp,
          'x-lumax-nonce': nonce,
          'x-lumax-signature': signature,
        },
        body,
      ),
    ).not.toThrow();
  });

  it('rejects invalid HMAC signature', () => {
    process.env.LUMAX_INTERNAL_SECRET = 'secret';

    expect(() =>
      verifyInternalSignature(
        {
          'x-lumax-timestamp': String(Math.floor(Date.now() / 1000)),
          'x-lumax-nonce': 'nonce',
          'x-lumax-signature': 'bad',
        },
        { tenantId: 1 },
      ),
    ).toThrow('Invalid internal signature');
  });
});
