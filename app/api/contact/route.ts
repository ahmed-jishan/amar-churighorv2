import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone, message } = body;

    // Basic validation
    if (!name?.trim() || !email?.trim() || !message?.trim()) {
      return NextResponse.json(
        { error: 'Name, email, and message are required.' },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return NextResponse.json(
        { error: 'Please provide a valid email address.' },
        { status: 400 }
      );
    }

    // Log the contact form submission (in production, send email or store in DB)
    console.log('[Contact Form Submission]', {
      name: name.trim(),
      email: email.trim(),
      phone: phone?.trim() || null,
      message: message.trim(),
      timestamp: new Date().toISOString(),
    });

    // TODO: Integrate with email service (e.g., Resend, SendGrid)
    // For now, we return success — the message is logged server-side.

    return NextResponse.json(
      { success: true, message: 'Your message has been received. We will get back to you within 24 hours.' },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Contact Form Error]', error);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again later.' },
      { status: 500 }
    );
  }
}