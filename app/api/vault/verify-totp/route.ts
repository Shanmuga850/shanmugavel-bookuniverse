import { NextResponse } from 'next/server';
import { timingSafeEqual } from 'node:crypto';
import * as OTPAuth from 'otpauth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function safeCompare(a: string, b: string) {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab as any, bb as any);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const totp = typeof body.totp === 'string' ? body.totp.trim() : '';
    const vaultCode = typeof body.vaultCode === 'string' ? body.vaultCode.trim() : '';
    const secret = process.env.FOUNDER_TOTP_SECRET;
    const configuredVault = process.env.FOUNDER_VAULT_CODE;
    if (!secret || !configuredVault) return NextResponse.json({ error: 'Vault not configured' }, { status: 500 });
    if (!vaultCode || !safeCompare(vaultCode, configuredVault)) return NextResponse.json({ error: 'Invalid vault code' }, { status: 401 });
    if (!/^\d{6}$/.test(totp)) return NextResponse.json({ error: 'Invalid code format' }, { status: 401 });

    const totpObj = new OTPAuth.TOTP({
      issuer: 'Vels Book Universe',
      label: 'Founder Vault',
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret: OTPAuth.Secret.fromBase32(secret),
    });

    const delta = totpObj.validate({ token: totp, window: 1 });
    if (delta === null) return NextResponse.json({ error: 'Invalid or expired authenticator code' }, { status: 401 });

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('TOTP verify error:', e);
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
}