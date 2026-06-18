// ──────────────────────────────────────────────────────────────────
// API: Send reward unlock email via Nodemailer
// Reuses the existing email infrastructure configuration
// ──────────────────────────────────────────────────────────────────

import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

function getTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

function getFromAddress(): string {
  return process.env.SMTP_FROM || 'Amar Churighor <mgolam644@gmail.com>';
}

export async function POST(request: Request) {
  try {
    const { to, subject, html } = await request.json();

    if (!to || !subject || !html) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: to, subject, html' },
        { status: 400 }
      );
    }

    const transporter = getTransporter();
    const info = await transporter.sendMail({
      from: getFromAddress(),
      to,
      subject,
      html,
    });

    console.log('[Reward Email] Sent to', to, '| Message ID:', info.messageId);
    return NextResponse.json({ success: true, messageId: info.messageId });
  } catch (error: any) {
    console.error('[Reward Email] Failed:', error.message);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}