import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';

const resend = new Resend(process.env.RESEND_API_KEY);
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export async function POST(req: NextRequest) {
  const { email } = await req.json();
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expires_at = new Date(Date.now() + 5 * 60 * 1000).toISOString();

  await supabase.from('founder_otps').delete().eq('email', email);
  await supabase.from('founder_otps').insert({ email, otp, expires_at });

  await resend.emails.send({
    from: 'Shanmugavel Vault <vault@shanmugavel.store>',
    to: email,
    subject: 'Your Founder Vault OTP',
    html: `<div style="font-family:serif;background:#000;color:#D4AF37;padding:24px;text-align:center"><h1>${otp}</h1><p>Valid for 5 minutes. Don't share.</p></div>`
  });

  return NextResponse.json({ success: true });
}