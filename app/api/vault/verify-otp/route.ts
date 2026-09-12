import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export async function POST(req: NextRequest) {
  const { email, otp, vaultCode } = await req.json();

  if (vaultCode !== process.env.FOUNDER_VAULT_CODE) {
    return NextResponse.json({ error: 'Invalid vault' }, { status: 401 });
  }

  const { data } = await supabase.from('founder_otps').select('*').eq('email', email).order('created_at',{ascending:false}).limit(1).single();
  
  if (!data || data.otp !== otp) return NextResponse.json({ error: 'Invalid OTP' }, { status: 401 });
  if (new Date(data.expires_at) < new Date()) return NextResponse.json({ error: 'OTP expired' }, { status: 401 });

  await supabase.from('founder_otps').delete().eq('email', email);
  return NextResponse.json({ success: true });
}