import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'node:crypto';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function safeCompare(left: string, right: string): boolean {
  if (left.length !== right.length) return false;
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  // Cast to fix TS2345 error
  return timingSafeEqual(leftBuffer as any, rightBuffer as any);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const code = typeof body.code === 'string' ? body.code.trim() : '';
    const configuredVaultCode = process.env.FOUNDER_VAULT_CODE;

    if (!configuredVaultCode) {
      return NextResponse.json(
        { error: 'Vault not configured' },
        { status: 500 },
      );
    }

    if (!code || !safeCompare(code, configuredVaultCode)) {
      return NextResponse.json(
        { error: 'Invalid vault code' },
        { status: 401 },
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 },
    );
  }
}