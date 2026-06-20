import { NextRequest, NextResponse } from 'next/server';
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

function buildNewsletterHtml(subject: string, message: string): string {
  const lines = message
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => `<p style="margin:0 0 8px 0;font-size:16px;line-height:1.7;color:#1a1a1a;">${line}</p>`)
    .join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Georgia,'Times New Roman',serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.06);">
          <!-- Header -->
          <tr>
            <td style="padding:32px 32px 16px 32px;text-align:center;border-bottom:1px solid #eaeaea;">
              <span style="font-size:28px;font-weight:bold;color:#c9a96e;letter-spacing:4px;">◈ LUMIN</span>
              <p style="margin:4px 0 0 0;font-size:12px;color:#999;letter-spacing:1px;">AMAR CHURIGHOR</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              <h2 style="margin:0 0 20px 0;font-size:24px;font-weight:400;color:#1a1a1a;">${subject}</h2>
              ${lines}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:24px 32px;background:#fafafa;border-top:1px solid #eaeaea;">
              <p style="margin:0 0 8px 0;font-size:12px;color:#999;line-height:1.5;">
                You're receiving this because you subscribed at amarcurighor.vercel.app
              </p>
              <p style="margin:0 0 8px 0;font-size:12px;color:#999;line-height:1.5;">
                To unsubscribe, reply with 'unsubscribe' in the subject line.
              </p>
              <p style="margin:0;font-size:11px;color:#bbb;">
                &copy; 2026 Lumin. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function POST(request: NextRequest) {
  try {
    const { emails, subject, message, adminUid } = await request.json();

    // ── Validation ──
    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return NextResponse.json({ success: false, error: 'Emails array must not be empty.' }, { status: 400 });
    }
    if (emails.length > 100) {
      return NextResponse.json(
        { success: false, error: 'Maximum 100 recipients per send. Please send in batches.' },
        { status: 400 }
      );
    }
    if (!subject || typeof subject !== 'string' || subject.trim().length === 0) {
      return NextResponse.json({ success: false, error: 'Subject is required.' }, { status: 400 });
    }
    if (subject.length > 200) {
      return NextResponse.json({ success: false, error: 'Subject must be 200 characters or less.' }, { status: 400 });
    }
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json({ success: false, error: 'Message is required.' }, { status: 400 });
    }
    if (message.length > 2000) {
      return NextResponse.json({ success: false, error: 'Message must be 2000 characters or less.' }, { status: 400 });
    }

    // ── Admin auth check (server-side) ──
    if (!adminUid) {
      return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
    }

    try {
      const { getAdminDb } = await import('@/lib/firebase/adminConfig');
      const adminDb = getAdminDb();
      const adminDoc = await adminDb.collection('admins').doc(adminUid).get();

      if (!adminDoc.exists) {
        return NextResponse.json({ success: false, error: 'Admin not found.' }, { status: 401 });
      }

      const adminData = adminDoc.data();
      if (adminData?.isSuspended) {
        return NextResponse.json({ success: false, error: 'Account suspended.' }, { status: 403 });
      }
    } catch {
      return NextResponse.json({ success: false, error: 'Authorization check failed.' }, { status: 500 });
    }

    // ── Send emails ──
    const html = buildNewsletterHtml(subject.trim(), message.trim());
    const fromAddress = process.env.SMTP_FROM || 'Amar Churighor <mgolam644@gmail.com>';
    const transporter = getTransporter();

    if (emails.length === 1) {
      // Single send
      try {
        await transporter.sendMail({
          from: fromAddress,
          to: emails[0],
          subject: subject.trim(),
          html,
        });
        return NextResponse.json({ success: true, sent: 1, failed: 0 });
      } catch (error: any) {
        console.error('[Send Newsletter] Single send failed:', error.message);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      }
    }

    // Batch send with Promise.allSettled
    const results = await Promise.allSettled(
      emails.map((email: string) =>
        transporter.sendMail({
          from: fromAddress,
          to: email,
          subject: subject.trim(),
          html,
        })
      )
    );

    let sent = 0;
    const errors: string[] = [];
    for (const result of results) {
      if (result.status === 'fulfilled') {
        sent++;
      } else {
        errors.push(result.reason?.message || 'Unknown error');
      }
    }

    return NextResponse.json({
      success: sent > 0,
      sent,
      failed: results.length - sent,
      errors: errors.length > 0 ? errors.slice(0, 5) : undefined,
    });
  } catch (error: any) {
    console.error('[Send Newsletter] Fatal error:', error.message);
    return NextResponse.json({ success: false, error: 'Internal server error.' }, { status: 500 });
  }
}