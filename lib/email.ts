/**
 * Production-grade email service using Nodemailer (Gmail SMTP).
 *
 * Sends:
 * 1. Customer order confirmation email (rich HTML template)
 * 2. Admin order notification email (new order alert)
 *
 * All email sending is non-blocking. Failures never break order creation.
 */

import nodemailer from 'nodemailer';
import { renderCustomerConfirmationHtml, CustomerConfirmationData } from './email-templates/customer-confirmation';
import { renderAdminNotificationHtml, AdminNotificationData } from './email-templates/admin-notification';

// ── Configuration ───────────────────────────────────────────────

function getTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

function getFromAddress(): string {
  return process.env.SMTP_FROM || 'Amar Churighor <mgolam644@gmail.com>';
}

function getAdminRecipients(): string[] {
  const raw = process.env.ADMIN_EMAIL_RECIPIENTS || '';
  return raw
    .split(',')
    .map((e) => e.trim())
    .filter(Boolean);
}

// ── Customer Confirmation Email ─────────────────────────────────

interface SendOrderConfirmationParams {
  to: string;
  orderId: string;
  trackingToken: string;
  customerName: string;
  total: number;
  items?: Array<{
    name: string;
    quantity: number;
    price: number;
    image?: string;
  }>;
  subtotal?: number;
  deliveryCharge?: number;
  district?: string;
  area?: string;
  address?: string;
  phone?: string;
  customerEmail?: string;
  /** Defaults to "Cash on Delivery" */
  paymentMethod?: string;
  /** Defaults to "pending" */
  orderStatus?: string;
}

export async function sendOrderConfirmationEmail(params: SendOrderConfirmationParams) {
  const {
    to,
    orderId,
    trackingToken,
    customerName,
    total,
    items = [],
    subtotal = 0,
    deliveryCharge = 0,
    district,
    area,
    address,
    phone,
    customerEmail,
    paymentMethod = 'Cash on Delivery',
    orderStatus = 'pending',
  } = params;

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://amarcurighor.vercel.app';
  const trackingUrl = `${baseUrl}/track/${trackingToken}`;
  const myOrdersUrl = `${baseUrl}/my-orders`;

  // Build template data
  const templateData: CustomerConfirmationData = {
    customerName,
    orderId,
    orderDate: new Date().toISOString(),
    items: items.map((item) => ({
      name: item.name,
      quantity: item.quantity,
      price: item.price,
      selectedSize: (item as any).selectedSize,
    })),
    subtotal,
    deliveryCharge,
    total,
    shippingAddress: address || '',
    district: district || '',
    area: area || '',
    phone: phone || '',
    email: customerEmail || to,
    paymentMethod,
    orderStatus,
    trackingUrl,
    myOrdersUrl,
  };

  const html = renderCustomerConfirmationHtml(templateData);

  const transporter = getTransporter();

  try {
    const info = await transporter.sendMail({
      from: getFromAddress(),
      to,
      subject: `Order Confirmed — ${orderId} | Amar Churighor`,
      html,
    });

    console.log('[Email] Customer confirmation sent to', to, 'for order', orderId, '| Message ID:', info.messageId);
    return { success: true, data: info };
  } catch (error: any) {
    console.error('[Email] Customer confirmation failed:', error.message);
    return { success: false, error: error.message };
  }
}

// ── Admin Notification Email ────────────────────────────────────

interface SendAdminNotificationParams {
  orderId: string;
  trackingToken: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAltPhone?: string;
  items: Array<{
    productId: string;
    name: string;
    quantity: number;
    price: number;
    image?: string;
  }>;
  subtotal: number;
  deliveryCharge: number;
  total: number;
  address: string;
  district: string;
  area: string;
  notes?: string;
  paymentMethod?: string;
  orderStatus?: string;
}

export async function sendAdminNotificationEmail(params: SendAdminNotificationParams) {
  const adminEmails = getAdminRecipients();
  if (adminEmails.length === 0) {
    console.warn('[Email] No admin recipients configured (ADMIN_EMAIL_RECIPIENTS). Skipping admin notification.');
    return { success: false, error: 'No admin recipients configured' };
  }

  const {
    orderId,
    trackingToken,
    customerName,
    customerEmail,
    customerPhone,
    customerAltPhone,
    items,
    subtotal,
    deliveryCharge,
    total,
    address,
    district,
    area,
    notes,
    paymentMethod = 'Cash on Delivery',
    orderStatus = 'pending',
  } = params;

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://amarcurighor.vercel.app';
  const adminOrdersUrl = `${baseUrl}/admin/orders`;

  // Build template data
  const templateData: AdminNotificationData = {
    customerName,
    customerEmail,
    customerPhone,
    customerAltPhone,
    orderId,
    orderDate: new Date().toISOString(),
    items: items.map((item) => ({
      name: item.name,
      productId: item.productId,
      quantity: item.quantity,
      price: item.price,
      image: item.image,
      selectedSize: (item as any).selectedSize,
    })),
    subtotal,
    deliveryCharge,
    total,
    shippingAddress: address,
    district,
    area,
    notes,
    paymentMethod,
    orderStatus,
    trackingToken,
    adminOrdersUrl,
  };

  const html = renderAdminNotificationHtml(templateData);

  const transporter = getTransporter();

  try {
    const info = await transporter.sendMail({
      from: getFromAddress(),
      to: adminEmails,
      subject: `🛒 New Order — ${orderId} | ${customerName} | Amar Churighor`,
      html,
    });

    console.log('[Email] Admin notification sent to', adminEmails.join(', '), 'for order', orderId, '| Message ID:', info.messageId);
    return { success: true, data: info };
  } catch (error: any) {
    console.error('[Email] Admin notification failed:', error.message);
    return { success: false, error: error.message };
  }
}

// ── Bulk: Send Both Customer + Admin ────────────────────────────

export interface SendAllOrderEmailsParams {
  // Customer email params
  customerEmail: string;
  customerName: string;
  customerPhone: string;
  customerAltPhone?: string;
  // Order details
  orderId: string;
  trackingToken: string;
  items: Array<{
    productId: string;
    name: string;
    quantity: number;
    price: number;
    image?: string;
  }>;
  subtotal: number;
  deliveryCharge: number;
  total: number;
  address: string;
  district: string;
  area: string;
  notes?: string;
  paymentMethod?: string;
  orderStatus?: string;
}

/**
 * Sends both customer confirmation AND admin notification emails.
 * Both are fire-and-forget — failures are logged but never thrown.
 * Returns combined results for tracking purposes.
 */
export async function sendAllOrderEmails(params: SendAllOrderEmailsParams): Promise<{
  customer: { success: boolean; error?: string };
  admin: { success: boolean; error?: string };
}> {
  const {
    customerEmail,
    customerName,
    customerPhone,
    customerAltPhone,
    orderId,
    trackingToken,
    items,
    subtotal,
    deliveryCharge,
    total,
    address,
    district,
    area,
    notes,
    paymentMethod,
    orderStatus,
  } = params;

  // Fire both emails concurrently — never throw
  const [customerResult, adminResult] = await Promise.allSettled([
    sendOrderConfirmationEmail({
      to: customerEmail,
      orderId,
      trackingToken,
      customerName,
      total,
      items: items.map((i) => ({
        name: i.name,
        quantity: i.quantity,
        price: i.price,
        image: i.image,
        selectedSize: (i as any).selectedSize,
      })),
      subtotal,
      deliveryCharge,
      district,
      area,
      address,
      phone: customerPhone,
      customerEmail,
      paymentMethod,
      orderStatus,
    }),
    sendAdminNotificationEmail({
      orderId,
      trackingToken,
      customerName,
      customerEmail,
      customerPhone,
      customerAltPhone,
      items,
      subtotal,
      deliveryCharge,
      total,
      address,
      district,
      area,
      notes,
      paymentMethod,
      orderStatus,
    }),
  ]);

  return {
    customer:
      customerResult.status === 'fulfilled'
        ? customerResult.value
        : { success: false, error: customerResult.reason?.message || 'Customer email failed' },
    admin:
      adminResult.status === 'fulfilled'
        ? adminResult.value
        : { success: false, error: adminResult.reason?.message || 'Admin email failed' },
  };
}

// ── Utility ─────────────────────────────────────────────────────

/**
 * Checks if the SMTP credentials are configured.
 */
export function isEmailConfigured(): boolean {
  return !!(process.env.SMTP_USER && process.env.SMTP_PASS);
}

/**
 * Checks if admin notification emails are configured (recipients set).
 */
export function isAdminNotificationConfigured(): boolean {
  return getAdminRecipients().length > 0;
}