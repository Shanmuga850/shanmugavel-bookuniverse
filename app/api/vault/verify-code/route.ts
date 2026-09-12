import { NextRequest, NextResponse } from 'next/server';
export async function POST(req: NextRequest) {
  const { code } = await req.json();
  if (code === process.env.FOUNDER_VAULT_CODE) return NextResponse.json({ success: true });
  return NextResponse.json({ error: 'Invalid vault code' }, { status: 401 });
}